from django.db import models
from .user import User
from .delete_base_model import SafeDeleteModel


class CustomerProfile(SafeDeleteModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=50, null=True, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=50, null=True, blank=True, default='')

    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'adm_customer_profile'
