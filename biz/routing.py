from django.urls import re_path
from .consumers import OrderTrackingConsumer

websocket_urlpatterns = [
    # Customer Live Order Tracking URL: ws://<host>/ws/order/<order_id>/
    re_path(r"^ws/order/(?P<order_id>\d+)/?$", OrderTrackingConsumer.as_asgi()),
]
