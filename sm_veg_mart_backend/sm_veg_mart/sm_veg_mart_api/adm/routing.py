from django.urls import re_path
from .import consumers

websocket_urlpatterns = [
    re_path(r'ws/fetch_all_product/$', consumers.FetchAllProducts.as_asgi()),
    re_path(r'ws/fetch_all_orders/$', consumers.FetchAllOrders.as_asgi()),
    re_path(r'ws/order_actions/$', consumers.FetchAllOrders.as_asgi()),
    re_path(r'ws/notifications/$', consumers.FetchAllOrders.as_asgi()),
    re_path(r'ws/delivery_options/?$', consumers.DeliveryOptionsConsumer.as_asgi()),
    re_path(r'ws/reminders/?$', consumers.ReminderConsumer.as_asgi()),
]

 