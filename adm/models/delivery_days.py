from django.db import models
from .delete_base_model import SafeDeleteModel


class DeliveryDays(SafeDeleteModel):
    day_name = models.CharField(max_length=20, unique=True)
    day_code = models.IntegerField(unique=True)
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        status = "Available" if self.is_available else "Disabled"
        return f"{self.day_name} ({status})"

    class Meta:
        db_table = 'adm_delivery_days'
        ordering = ['day_code']
