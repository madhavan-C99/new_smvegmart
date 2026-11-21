from django.urls import re_path
from .consumers import OrderTrackingConsumer, UserOrderTrackingConsumer

websocket_urlpatterns = [
    # Customer Single Live Order Tracking URL: ws://<host>/ws/order/<order_id>/
    re_path(r"^ws/order/(?P<order_id>[^/]+)/?$", OrderTrackingConsumer.as_asgi()),
    # Customer All Active Orders Tracking URL: ws://<host>/ws/order_tracking/(?P<user_id>[^/]+)/?$
    re_path(r"^ws/order_tracking/(?P<user_id>[^/]+)/?$", UserOrderTrackingConsumer.as_asgi()),
]
