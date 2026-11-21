import logging
import uuid
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework.exceptions import APIException, ValidationError as DRFValidationError
from django.db.models import Q

from ..models.user import User
from ..models.role import Role
from ..models.user_role import UserRole
from ..models.perm import Perm, Perm as Permission
from ..models.customer_profile import CustomerProfile
from ..models.admin_profile import AdminProfile

logger = logging.getLogger('django')


def create_user(user_name, **data):
    try:
        if User.objects.filter(email=data.get("email")).exists():
            raise DRFValidationError({"email": ["Email already exists."]})

        if User.objects.filter(mobile=data.get("mobile_number")).exists():
            raise DRFValidationError({"mobile_number": ["Mobile already exists."]})

        user = User.objects.create_user(
            email=data.get("email"),
            password=data.get("password"),
            mobile=data.get("mobile_number")
        )

        user.is_active = True
        user.mobile = data.get("mobile_number")
        user.validate_token = User.objects.make_random_password(10) + uuid.uuid4().hex[:6].upper()
        user.save()

        role_id = data.get("role_id")
        if role_id:
            role_obj = Role.objects.filter(id=role_id).first()
            if role_obj:
                UserRole.objects.get_or_create(
                    user=user,
                    role=role_obj,
                    defaults={"created_by": user_name or "system", "updated_by": user_name or "system"}
                )
                if role_obj.code in ["ADM", "DEV", "STAFF"] or role_obj.name.lower() in ["admin", "staff"]:
                    user.is_staff = True
                    user.save(update_fields=["is_staff"])
                    AdminProfile.objects.get_or_create(
                        user=user,
                        defaults={
                            "name": data.get("name") or "Admin",
                            "email": data.get("email"),
                            "password": user.password,
                            "is_active": True,
                            "created_by": user_name or "system",
                            "updated_by": user_name or "system"
                        }
                    )

        return user.id

    except (DRFValidationError, APIException):
        raise
    except Exception as e:
        logger.error(f"Error in create_user: {e}", exc_info=True)
        raise APIException(str(e))


def add_perm_to_role(**data):
    try:
        role = None
        if data.get("role_id"):
            role = Role.objects.filter(id=data.get("role_id")).first()
        elif data.get("role_name"):
            role = Role.objects.filter(name=data.get("role_name")).first()
        elif data.get("role_code"):
            role = Role.objects.filter(code=data.get("role_code")).first()

        if not role:
            raise ValidationError("Role not available for the given params")

        perm = None
        if data.get("perm_id"):
            perm = Perm.objects.filter(id=data.get("perm_id")).first()
        elif data.get("perm_name"):
            perm = Perm.objects.filter(name=data.get("perm_name")).first()
        elif data.get("perm_code"):
            perm = Perm.objects.filter(code=data.get("perm_code")).first()

        if not perm:
            raise ValidationError("Permission not available for the given params")

        role.perms.add(perm)
        return "done"

    except Exception as e:
        raise APIException(e)


def create_permission(user_name, **data):
    try:
        perm = Perm.objects.create(
            name=data.get("name"),
            display_value=data.get("display_value"),
            code=data.get("code"),
            created_by=user_name
        )


        roles = Role.objects.filter(code__in=["DEV", "ADM"])

        # 3. Loop panni rendu role-kum permission-a add panrathu
        for role in roles:
            add_perm_to_role(**{'role_id': role.id, 'perm_id': perm.id})
            print(f"Permission added to role: {role.code}")

        return perm.name

    except Exception as e:
        raise APIException(e)


def create_role(user_name, **data):
    try:
        role = Role.objects.create(
            name=data.get("name"),
            display_value=data.get("display_value"),
            code=data.get("code"),
            description=data.get("description"),
            created_by=user_name
        )
        return role.code

    except Exception as e:
        raise APIException(e)


def authorize_request(perm_name, user):
    try:
       
        if user is None or user.is_anonymous:
            print(user)
            raise PermissionDenied("Authentication required")

       
        perm = Perm.objects.filter(
            roles__users=user,
            name=perm_name
        ).exists()
        print(perm)
        if not perm:
            raise PermissionDenied("Permission denied")

        return True

    except PermissionDenied:
        raise
    except Exception as e:
        raise APIException(str(e))


def all_users():
    try:
        customers=list(CustomerProfile.objects.all().values(
            'id', 'user_id', 'name', 'email', 'user__is_active', 'user__mobile'
        ))
        admins=list(AdminProfile.objects.all().values(
            'id', 'user_id', 'name', 'email', 'is_active', 'user__mobile'
        ))
        return {"customers":customers,
                "admins":admins}
    except Exception as e:
        raise APIException(e)