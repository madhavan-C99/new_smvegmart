import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sm_veg_mart_api.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import biz.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            biz.routing.websocket_urlpatterns
        )
    ),
})
