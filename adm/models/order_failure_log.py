from django.db import models
from .delete_base_model import SafeDeleteModel

class OrderFailureLog(SafeDeleteModel):
    order_id = models.BigIntegerField()
    order_number = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='failed')
    reason = models.CharField(max_length=255)
    delivery_boy_id = models.BigIntegerField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    class Meta:
        db_table = 'adm_order_failure_log'