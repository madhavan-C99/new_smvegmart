from django.db import models
from .category import Category, SubCategory
from .delete_base_model import SafeDeleteModel


def product_image_path(instance, filename):
    return f"product_snap/{filename}"


class Product(SafeDeleteModel):
    name=models.CharField()
    tamil_name=models.CharField(blank=True)
    product_img = models.ImageField(upload_to=product_image_path, null=True, blank=True)
    description=models.TextField(max_length=200)
    subcategory=models.ForeignKey(SubCategory,on_delete=models.CASCADE,related_name='product',null=True)
    category=models.ForeignKey(Category,on_delete=models.CASCADE,null=True)
    daily_vegetables = models.BooleanField(default=False)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)


    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table="adm_products"   
    
    
    