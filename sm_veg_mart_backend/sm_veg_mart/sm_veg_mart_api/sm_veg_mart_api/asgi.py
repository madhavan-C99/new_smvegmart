"""
ASGI config for sm_veg_mart_api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sm_veg_mart_api.settings')

# Initialize Django ASGI application FIRST
django_asgi_app = get_asgi_application()

# ONLY AFTER Django is ready, import Channels components
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

import adm.routing
import biz.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            adm.routing.websocket_urlpatterns + biz.routing.websocket_urlpatterns
        )
    ),
})
