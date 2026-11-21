from django.db import models
from .delete_base_model import SafeDeleteModel
from .products import Product


class ProductVariant(SafeDeleteModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    unit_value = models.CharField(max_length=50) # e.g. "500g", "1kg", "1 Bunch"
    weight_in_grams = models.IntegerField() # e.g. 500, 1000
    mrp_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.IntegerField(default=0)
    stock_quantity = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    expiry_date=models.DateField(null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)


    class Meta:
        db_table = 'adm_product_variants'