from django.db import models
from adm.models.customer_profile import CustomerProfile
from adm.models.delete_base_model import SafeDeleteModel

class Address(SafeDeleteModel):
    user = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name="users")
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    category = models.CharField(max_length=50, default="home")
    house_flat_no = models.CharField(max_length=150, null=True, blank=True)
    apartment_name = models.CharField(max_length=200, null=True, blank=True)
    area_name = models.CharField(max_length=200, null=True, blank=True)
    delivery_mode = models.CharField(max_length=50, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address_line1 = models.CharField(max_length=500)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    landmark = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True, default="")
    state = models.CharField(max_length=100, null=True, blank=True, default="")
    country = models.CharField(max_length=100, null=True, blank=True, default="")
    # status = models.CharField(max_length=50, default="Active")
    pincode = models.CharField(max_length=20)

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.address_line1}, {self.city}"

    class Meta:
        db_table = "biz_address"
