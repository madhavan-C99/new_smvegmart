from django.db import models
from django.utils import timezone
from .address import Address
from adm.models.delete_base_model import SafeDeleteModel


class Order(SafeDeleteModel):
    user = models.ForeignKey('adm.CustomerProfile', on_delete=models.CASCADE, related_name="orders")
    total_amount = models.FloatField()
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, default='Pending') 
    payment_status = models.BooleanField(default=False)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    delivery_mode = models.CharField(max_length=30, default='Express 25m') # Express 25m / Scheduled / Shop
    delivery_slot = models.ForeignKey('adm.DeliverySlots', on_delete=models.SET_NULL, null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_otp = models.CharField(max_length=10, null=True, blank=True) # Doorstep Handover OTP
    delivery_instructions = models.TextField(null=True, blank=True)
    order_date = models.DateField(default=timezone.now, null=True, blank=True)
    order_config_day_timings = models.ForeignKey('adm.OrderConfigDayTimings', on_delete=models.SET_NULL, null=True, blank=True)
    stage_timestamps = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50)

    class Meta:
        db_table = 'biz_order'
