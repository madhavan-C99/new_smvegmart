from django.db import models
from .delete_base_model import SafeDeleteModel

class OrderReturnReason(SafeDeleteModel):
    name = models.CharField(max_length=255) # e.g. Rotten/Spoiled, Customer Unavailable
    is_active = models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'adm_order_return_reason'