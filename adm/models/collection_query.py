from django.db import models
from .delete_base_model import SafeDeleteModel


class CollectionQuery(SafeDeleteModel):
    key = models.CharField(max_length=50, unique=True)
    query = models.TextField(null=True)
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    def __str__(self):
        return self.key
    
    class Meta:
        db_table = 'adm_collection_query'