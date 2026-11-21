import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .services.order_tracking_service import get_order_tracking_data, get_user_active_orders_data

logger = logging.getLogger(__name__)


class OrderTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    Customer Live Order Tracking Consumer
    URL: ws://<host>/ws/order/<order_id>/
    Supports: Database ID (e.g. 52), Order Number (#80722, 80722, SM-80722)
    """
    async def connect(self):
        self.raw_order_id = self.scope['url_route']['kwargs'].get('order_id', '')
        order_data = await self.get_order_details(self.raw_order_id)

        if order_data:
            self.order_pk = order_data["id"]
            self.order_number = order_data.get("order_number") or ""
            clean_num = str(self.order_number).replace("#", "").replace("SM-", "").strip()
            raw_clean = str(self.raw_order_id).replace("#", "").replace("SM-", "").strip()

            self.joined_groups = list(set(filter(None, [
                f"order_{self.order_pk}",
                f"order_{clean_num}",
                f"order_num_{clean_num}",
                f"order_{raw_clean}",
                f"order_{self.raw_order_id}",
            ])))

            for grp in self.joined_groups:
                await self.channel_layer.group_add(grp, self.channel_name)

            await self.accept()

            # Immediate Snapshot on connect
            await self.send_json({
                "type": "order_snapshot",
                "data": order_data
            })
            logger.info(f"OrderTrackingConsumer connected for order {self.order_pk} ({self.order_number})")
        else:
            await self.accept()
            await self.send_json({
                "type": "error",
                "message": f"Order #{self.raw_order_id} not found."
            })
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'joined_groups'):
            for grp in self.joined_groups:
                await self.channel_layer.group_discard(grp, self.channel_name)

    async def order_status_message(self, event):
        await self.send_json({
            "type": event.get("event_type", "order_status_update"),
            "data": event.get("data")
        })

    async def send_status_update(self, event):
        await self.send_json(event.get("data", {}))

    @database_sync_to_async
    def get_order_details(self, order_id):
        return get_order_tracking_data(order_id)


class UserOrderTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    Customer All Active Orders Live Tracking Consumer
    URL: ws://<host>/ws/order_tracking/<user_id>/
    """
    async def connect(self):
        self.user_id = str(self.scope['url_route']['kwargs'].get('user_id', '')).strip()
        self.group_name = f"order_user_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        orders = await self.get_active_orders(self.user_id)
        await self.send_json({"orders": orders})
        logger.info(f"UserOrderTrackingConsumer connected for user {self.user_id}")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_status_update(self, event):
        await self.send_json(event.get("data", {}))

    @database_sync_to_async
    def get_active_orders(self, user_id):
        return get_user_active_orders_data(user_id)
