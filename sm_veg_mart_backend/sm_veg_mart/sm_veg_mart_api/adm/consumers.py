import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .tasks.trendtask import get_all_products_orm
from .services import notification_service
from .services import order_service
from .services import delivery_agent_service
from .services import delivery_configuration_service
from .services import reminder_service

logger = logging.getLogger('django')


class FetchAllProducts(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "fetch_all_product_group"

        try:
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"Channel layer group_add error (check Redis): {e}")

        await self.accept()

    async def disconnect(self, close_code):
        try:
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception:
            pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get("action") == "init_all":
                fetch_all_product = await self.get_fetch_all_products()

                await self.send(text_data=json.dumps({
                    "payload": fetch_all_product
                }))
        except Exception as e:
            logger.error(f"Error in Receive: {str(e)}", exc_info=True)

    async def send_all_product_data(self, event):
        fetch_all_product = event.get("data", [])

        await self.send(text_data=json.dumps({
            "payload": fetch_all_product
        }))

    @sync_to_async
    def get_fetch_all_products(self):
        return get_all_products_orm()


class FetchAllOrders(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "fetch_all_orders_group"

        try:
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"Channel layer group_add error for orders: {e}")

        await self.accept()

    async def disconnect(self, close_code):
        try:
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception:
            pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

            # 1. Fetch all orders, delivery agents & notifications
            if action == "init_all" or not action:
                fetch_all_orders = await self.get_fetch_all_orders()
                fetch_all_agents = await self.get_fetch_all_agents()
                fetch_all_notifs = await self.get_fetch_all_notifications()

                await self.send(text_data=json.dumps({
                    "action": "init_all",
                    "status": "SUCCESS",
                    "payload": fetch_all_orders,
                    "orders": fetch_all_orders,
                    "delivery_agents": fetch_all_agents,
                    "notifications": fetch_all_notifs,
                }))

            # 2. Fetch single order details by ID
            elif action == "fetch_one_order":
                order_id = data.get("id") or data.get("order_id")
                if not order_id:
                    await self.send(text_data=json.dumps({
                        "action": "fetch_one_order",
                        "status": "ERROR",
                        "error": "Missing order id"
                    }))
                    return

                order_data = await self.execute_fetch_one_order(int(order_id))
                await self.send(text_data=json.dumps({
                    "action": "fetch_one_order",
                    "status": "SUCCESS",
                    "order": order_data,
                    "data": order_data
                }))

            # 3. Update order lifecycle status
            elif action == "update_order_status":
                order_id = data.get("id") or data.get("order_id")
                new_status = data.get("status")
                if not order_id or not new_status:
                    await self.send(text_data=json.dumps({
                        "action": "update_order_status",
                        "status": "ERROR",
                        "error": "Missing order id or status"
                    }))
                    return

                result = await self.execute_update_order_status(int(order_id), str(new_status))
                await self.send(text_data=json.dumps({
                    "action": "update_order_status",
                    "status": "SUCCESS",
                    "message": f"Order status updated to {new_status}",
                    "data": result
                }))

            # 4. Cancel / Reject order
            elif action == "cancel_order":
                order_id = data.get("id") or data.get("order_id")
                reason = data.get("reason", "")
                if not order_id:
                    await self.send(text_data=json.dumps({
                        "action": "cancel_order",
                        "status": "ERROR",
                        "error": "Missing order id"
                    }))
                    return

                result = await self.execute_cancel_order(int(order_id), str(reason))
                await self.send(text_data=json.dumps({
                    "action": "cancel_order",
                    "status": "SUCCESS",
                    "message": "Order cancelled successfully",
                    "data": result
                }))

            # 5. Delete specific item from order basket
            elif action == "delete_order_item":
                order_id = data.get("order_id") or data.get("id")
                item_id = data.get("item_id")
                if not order_id or not item_id:
                    await self.send(text_data=json.dumps({
                        "action": "delete_order_item",
                        "status": "ERROR",
                        "error": "Missing order_id or item_id"
                    }))
                    return

                result = await self.execute_delete_order_item(int(order_id), int(item_id))
                await self.send(text_data=json.dumps({
                    "action": "delete_order_item",
                    "status": "SUCCESS",
                    "message": "Item removed from order",
                    "data": result
                }))

            # 6. Mark notification as read
            elif action == "mark_notification_read":
                order_id = data.get("order_id") or data.get("id")
                await self.execute_mark_notification_read(order_id)
                notifs = await self.get_fetch_all_notifications()
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "send_notifications_update",
                            "notifications": notifs,
                        }
                    )
                else:
                    await self.send(text_data=json.dumps({
                        "action": "notifications_updated",
                        "status": "SUCCESS",
                        "notifications": notifs,
                    }))

            # 7. Mark all notifications as read
            elif action == "mark_all_notifications_read":
                await self.execute_mark_all_notifications_read()
                notifs = await self.get_fetch_all_notifications()
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "send_notifications_update",
                            "notifications": notifs,
                        }
                    )
                else:
                    await self.send(text_data=json.dumps({
                        "action": "notifications_updated",
                        "status": "SUCCESS",
                        "notifications": notifs,
                    }))

            # 8. Fetch notifications specifically
            elif action == "fetch_notifications":
                notifs = await self.get_fetch_all_notifications()
                await self.send(text_data=json.dumps({
                    "action": "fetch_notifications",
                    "status": "SUCCESS",
                    "notifications": notifs,
                }))

            else:
                logger.warning(f"Unknown action received in FetchAllOrders: {action}")

        except Exception as e:
            logger.error(f"Error in Receive (Orders & Agents): {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                "status": "ERROR",
                "error": str(e)
            }))

    async def send_notifications_update(self, event):
        notifications = event.get("notifications", [])
        await self.send(text_data=json.dumps({
            "action": "notifications_updated",
            "status": "SUCCESS",
            "notifications": notifications,
        }))

    async def send_all_orders_data(self, event):
        fetch_all_orders = event.get("data", [])
        fetch_all_agents = event.get("agents")
        if fetch_all_agents is None:
            fetch_all_agents = await self.get_fetch_all_agents()
        fetch_all_notifs = await self.get_fetch_all_notifications()

        await self.send(text_data=json.dumps({
            "payload": fetch_all_orders,
            "orders": fetch_all_orders,
            "delivery_agents": fetch_all_agents,
            "notifications": fetch_all_notifs,
        }))

    @sync_to_async
    def get_fetch_all_notifications(self):
        return notification_service.fetch_all_notifications_service()

    @sync_to_async
    def execute_mark_notification_read(self, order_id):
        return notification_service.mark_notification_read_service(order_id=order_id)

    @sync_to_async
    def execute_mark_all_notifications_read(self):
        return notification_service.mark_all_notifications_read_service()

    @sync_to_async
    def get_fetch_all_orders(self):
        return order_service.get_all_orders_orm()

    @sync_to_async
    def get_fetch_all_agents(self):
        return delivery_agent_service.fetch_all_delivery_agents_service()

    @sync_to_async
    def execute_fetch_one_order(self, order_id):
        return order_service.fetch_one_order_service(order_id)

    @sync_to_async
    def execute_update_order_status(self, order_id, status):
        return order_service.update_order_status_service(order_id, status)

    @sync_to_async
    def execute_cancel_order(self, order_id, reason=""):
        return order_service.cancel_order_service(order_id, reason)

    @sync_to_async
    def execute_delete_order_item(self, order_id, item_id):
        return order_service.delete_order_item_service(order_id, item_id)


class DeliveryOptionsConsumer(AsyncWebsocketConsumer):
    """
    Dedicated WebSocket consumer for real-time Delivery Options, Available Days,
    and Delivery Time Slots management.
    Broadcasts state changes in real time across all connected admin clients.
    """
    async def connect(self):
        self.group_name = "delivery_options_group"

        try:
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"Channel layer error in DeliveryOptionsConsumer: {e}")

        await self.accept()

        # Send initial data immediately upon connection
        try:
            config_data = await self.get_full_configuration()
            await self.send(text_data=json.dumps({
                "action": "init_all",
                "status": "SUCCESS",
                "payload": config_data
            }))
        except Exception as err:
            logger.error(f"Error sending init payload in DeliveryOptionsConsumer: {err}", exc_info=True)

    async def disconnect(self, close_code):
        try:
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception:
            pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action in ["init_all", "fetch_all", None]:
                config_data = await self.get_full_configuration()
                await self.send(text_data=json.dumps({
                    "action": "init_all",
                    "status": "SUCCESS",
                    "payload": config_data
                }))

            elif action == "toggle_option":
                option = data.get("delivery_option")
                is_enabled = data.get("is_enabled")
                result = await self.execute_toggle_option(option, is_enabled)
                await self.send(text_data=json.dumps({
                    "action": "toggle_option",
                    "status": "SUCCESS",
                    "data": result
                }))

            elif action == "toggle_day":
                option = data.get("delivery_option")
                day_id = data.get("day_id")
                is_available = data.get("is_available")
                result = await self.execute_toggle_day(option, day_id, is_available)
                await self.send(text_data=json.dumps({
                    "action": "toggle_day",
                    "status": "SUCCESS",
                    "data": result
                }))

            elif action == "toggle_slot":
                mapping_id = data.get("mapping_id")
                is_active = data.get("is_active")
                result = await self.execute_toggle_slot(mapping_id, is_active)
                await self.send(text_data=json.dumps({
                    "action": "toggle_slot",
                    "status": "SUCCESS",
                    "data": result
                }))

        except Exception as e:
            logger.error(f"Error in DeliveryOptionsConsumer receive: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                "status": "ERROR",
                "message": str(e)
            }))

    async def send_delivery_configuration_data(self, event):
        """
        Handler for channel layer broadcast.
        """
        payload = event.get("data", {})
        await self.send(text_data=json.dumps({
            "action": "update",
            "status": "SUCCESS",
            "payload": payload
        }))

    @sync_to_async
    def get_full_configuration(self):
        return delivery_configuration_service.get_full_delivery_configuration_service()

    @sync_to_async
    def execute_toggle_option(self, option, is_enabled):
        return delivery_configuration_service.toggle_delivery_option_service(option, is_enabled)

    @sync_to_async
    def execute_toggle_day(self, option, day_id, is_available):
        return delivery_configuration_service.toggle_delivery_day_service(option, day_id, is_available)

    @sync_to_async
    def execute_toggle_slot(self, mapping_id, is_active):
        return delivery_configuration_service.toggle_day_timing_slot_service(mapping_id, is_active)


class ReminderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "reminders_group"

        try:
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.warning(f"Channel layer error in ReminderConsumer: {e}")

        await self.accept()

        # Send initial reminders immediately upon connection
        try:
            reminders = await self.get_reminders()
            await self.send(text_data=json.dumps({
                "action": "init_all",
                "status": "SUCCESS",
                "payload": reminders
            }))
        except Exception as err:
            logger.error(f"Error sending init payload in ReminderConsumer: {err}", exc_info=True)

    async def disconnect(self, close_code):
        try:
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception:
            pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action in ["init_all", "fetch_all", None]:
                reminders = await self.get_reminders()
                await self.send(text_data=json.dumps({
                    "action": "init_all",
                    "status": "SUCCESS",
                    "payload": reminders
                }))

            elif action == "refresh":
                reminders = await self.get_reminders()
                await self.send(text_data=json.dumps({
                    "action": "update",
                    "status": "SUCCESS",
                    "payload": reminders
                }))

            elif action == "clear_all":
                result = await self.execute_clear_all()
                await self.send(text_data=json.dumps({
                    "action": "clear_all",
                    "status": "SUCCESS",
                    "payload": []
                }))

            elif action == "reset":
                result = await self.execute_reset()
                reminders = await self.get_reminders()
                await self.send(text_data=json.dumps({
                    "action": "init_all",
                    "status": "SUCCESS",
                    "payload": reminders
                }))


        except Exception as e:
            logger.error(f"Error in ReminderConsumer receive: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                "status": "ERROR",
                "message": str(e)
            }))

    async def send_reminders_data(self, event):
        """
        Handler for channel layer broadcast from reminder_service.broadcast_reminders_data.
        """
        payload = event.get("data", [])
        await self.send(text_data=json.dumps({
            "action": "update",
            "status": "SUCCESS",
            "payload": payload
        }))

    @sync_to_async
    def get_reminders(self):
        return reminder_service.get_all_reminders_service()

    @sync_to_async
    def execute_clear_all(self):
        return reminder_service.clear_all_reminders_service()

    @sync_to_async
    def execute_reset(self):
        return reminder_service.reset_reminders_service()



