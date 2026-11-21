from django.db import models
from .delete_base_model import SafeDeleteModel


class OrderConfiguration(SafeDeleteModel):
    delivery_option = models.CharField(max_length=50, unique=True, default='')
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.delivery_option} (Fee: {self.delivery_charge}, Min: {self.min_amount})"

    class Meta:
        db_table = 'adm_order_configuration'
