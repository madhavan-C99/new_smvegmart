from django.db import models
from .delete_base_model import SafeDeleteModel



class DeliverySlots(SafeDeleteModel):
    slot_title = models.CharField(max_length=100) # e.g. "Early Morning", "Evening"
    slot_tag = models.CharField(max_length=50, null=True, blank=True) # e.g. "Popular"
    start_time = models.TimeField()
    end_time = models.TimeField()
    available_days = models.CharField(max_length=200)
    order_cutoff_time = models.TimeField(null=True, blank=True)
    max_capacity = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)
   
       
    def __str__(self):
        return self.slot_title
    class Meta:
        db_table = 'adm_delivery_slots'