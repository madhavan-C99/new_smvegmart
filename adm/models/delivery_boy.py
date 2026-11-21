from django.db import models
from .user import User
from .delete_base_model import SafeDeleteModel

class DeliveryBoyProfile(SafeDeleteModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_boy_profile')
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=20)
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    vehicle_number = models.CharField(max_length=50, null=True, blank=True)
    driving_license_no = models.CharField(max_length=100, null=True, blank=True)
    is_available = models.BooleanField(default=True)
    status = models.CharField(max_length=20, default='online') # online / offline / busy
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'adm_delivery_boy_profile'