from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve
import os
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('adm/', include('adm.urls')),
    path('api/adm/', include('adm.urls')),

    # Media file routes (serves category_snap, product_snap, etc. in both ASGI and WSGI)

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)