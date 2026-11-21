from django.db import models
from .delete_base_model import SafeDeleteModel
class DeliveryTimings(SafeDeleteModel):
    start_time = models.CharField(max_length=20)  # e.g. "06:00 AM", "04:00 PM"
    end_time = models.CharField(max_length=20)    # e.g. "08:00 AM", "06:00 PM"
    slot_label = models.CharField(max_length=100)  # e.g. "Early Morning", "Morning • Popular", "Evening"
    is_active = models.BooleanField(default=True)  # UI Switch (Night: False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True)
    def __str__(self):
        return f"{self.start_time} - {self.end_time} ({self.slot_label})"
    class Meta:
        db_table = 'adm_delivery_timings'
        ordering = ['id']