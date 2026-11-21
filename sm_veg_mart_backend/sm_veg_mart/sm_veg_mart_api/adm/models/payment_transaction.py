from django.db import models
from .customer_profile import CustomerProfile
from .user import User


class RazorpayOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.IntegerField()
    gateway_order_id = models.CharField(unique=True)
    status = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50)

    def __str__(self):
        return str(self.user_id)

    class Meta:
        db_table = "adm_razorpay_order"


class Transaction(models.Model):
    payment_id = models.CharField()
    razorpay_order = models.ForeignKey(RazorpayOrder, on_delete=models.CASCADE)
    signature = models.CharField()
    amount = models.IntegerField()
    order = models.ForeignKey('biz.Order', on_delete=models.CASCADE)
    payment_status = models.CharField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True)

    def __str__(self):
        return str(self.payment_id)

    class Meta:
        db_table = "adm_transaction"
