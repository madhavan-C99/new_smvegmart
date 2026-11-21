from django.db import models
from .category import *
from .delete_base_model import SafeDeleteModel


class Product(SafeDeleteModel):
    name = models.CharField()
    tamil_name = models.CharField(blank=True)
    product_img = models.ImageField(upload_to="product_snap", null=True, blank=True)
    description = models.TextField(max_length=200)
    subcategory=models.ForeignKey(SubCategory,on_delete=models.CASCADE,related_name='product',null=True)
    category=models.ForeignKey(Category,on_delete=models.CASCADE,null=True)
    is_active=models.BooleanField(default=True)

    daily_vegetables = models.BooleanField(default=False)
    
    # weight=models.FloatField(default=1,null=True)
    # unit=models.CharField(null=True)
    # price=models.FloatField()
    # stock=models.IntegerField(null=True)
    # expiry_date=models.DateField(null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table="adm_products"
        
        
# class TrendingProduct(SafeDeleteModel):
#     product=models.ForeignKey(Product,on_delete=models.CASCADE,null=True, blank=True)
#     subcategory=models.ForeignKey(SubCategory,on_delete=models.CASCADE,null=True, blank=True)
#     current_trending_status=models.BooleanField(default=True)
#     created_at=models.DateTimeField(auto_now_add=True)
#     created_by=models.CharField(max_length=50)
#     updated_at=models.DateTimeField(auto_now=True)
#     updated_by=models.CharField(max_length=50)

#     def __str__(self):
#         return self.product.name
    
#     class Meta:
#         db_table="adm_trendingproducts"   
    
    
    