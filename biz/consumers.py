import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .services.order_tracking_service import get_order_tracking_data

logger = logging.getLogger(__name__)


class OrderTrackingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # 1. URL-லிருந்து order_id எடுக்கப்படுகிறது
        self.order_id = self.scope['url_route']['kwargs'].get('order_id')
        
        # 2. Database-லிருந்து Order விபரங்களை எடுத்தல்
        order_data = await self.get_order_details(self.order_id)

        if not order_data:
            await self.accept()
            await self.send_json({
                "type": "error",
                "message": f"Order #{self.order_id} not found."
            })
            await self.close()
            return

        current_status = (order_data.get("status") or "").lower()

        await self.accept()

        # Connect ஆன உடனேயே தற்போதைய Snapshot அனுப்புதல்
        await self.send_json({
            "type": "order_snapshot",
            "data": order_data
        })

        # Order already delivered அல்லது cancelled ஆக இருந்தால் live tracking தேவையில்லை, உடனே close செய்கிறோம்
        if current_status in ["delivered", "cancelled"]:
            logger.info(f"Order #{self.order_id} is already {current_status}. Closing WS connection.")
            await self.close(code=1000)
            return

        # Active orders-க்கு மட்டும் Channel Group-ல் சேர்த்து Live Updates-ஐ listen செய்கிறோம்
        self.room_group_name = f"order_{self.order_id}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Admin Stage மாற்றினாலோ அல்லது Delivery Boy Assign செய்தாலோ இந்த method வழியாக Customer-க்கு Message போகும்
    async def order_status_message(self, event):
        await self.send_json({
            "type": event.get("event_type", "order_status_update"),
            "data": event.get("data")
        })

        # Order live-ல் 'delivered' அல்லது 'cancelled' நிலையை அடைந்தால் WebSocket-ஐ முடித்துக் கொள்ளலாம்
        data = event.get("data") or {}
        if data.get("status") in ["delivered", "cancelled"]:
            await self.close(code=1000)

    @database_sync_to_async
    def get_order_details(self, order_id):
        return get_order_tracking_data(order_id)
