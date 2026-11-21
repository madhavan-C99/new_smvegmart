from django.db import models
from .delete_base_model import SafeDeleteModel
from .delivery_boy import DeliveryBoyProfile

class OrderAssignments(SafeDeleteModel):
    order_id = models.BigIntegerField(unique=True) # biz_order.id
    delivery_boy = models.ForeignKey(DeliveryBoyProfile, on_delete=models.CASCADE, related_name='assigned_orders')
    assigned_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, default='ASSIGNED') # ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    def __str__(self):
        return f"Order {self.order_id} -> {self.delivery_boy.name}"

    class Meta:
        db_table = 'adm_order_assignments'