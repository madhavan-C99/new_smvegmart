from django.db import models
from .delete_base_model import SafeDeleteModel


class DeliveryTimings(SafeDeleteModel):
    start_time = models.CharField(max_length=20)
    end_time = models.CharField(max_length=20)
    slot_label = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.start_time} - {self.end_time} ({self.slot_label})"

    class Meta:
        db_table = 'adm_delivery_timings'
        ordering = ['id']
