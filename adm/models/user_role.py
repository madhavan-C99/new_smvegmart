from django.db import models
from .delete_base_model import SafeDeleteModel
from .role import Role
from .user import User


class UserRole(SafeDeleteModel):
   
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_users")
    created_at=models.DateTimeField(auto_now_add=True)
    created_by=models.CharField(max_length=50)
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.CharField(max_length=50)

    class Meta:
        db_table = "adm_user_role"
        verbose_name = "User Role"
        verbose_name_plural = "User Roles"
        unique_together = ("user", "role")
