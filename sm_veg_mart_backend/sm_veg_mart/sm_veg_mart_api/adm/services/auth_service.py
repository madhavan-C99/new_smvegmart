import datetime
import random
import re
from datetime import timedelta
from django.contrib.auth import authenticate
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password,check_password
from ..models.role import Role
from ..models.user_role import UserRole
from ..models.customer_profile import CustomerProfile
from ..models import User, OTPVerification
from ..models.admin_profile import AdminProfile



# utils.py



def create_token(**data):
    identifier = data.get('username') or data.get('email') or data.get('mobile_number') or data.get('mobile')
    password = data.get('password')

    if not identifier:
        raise AuthenticationFailed(detail='Please provide an email or mobile number.')

    identifier_str = str(identifier).strip()
    digits_only = re.sub(r'\D', '', identifier_str)

    # 1. Search for user by email or mobile
    candidates = []
    if '@' in identifier_str:
        candidates = list(User.objects.filter(email__iexact=identifier_str).order_by('-is_superuser', '-is_staff', '-id'))
    elif digits_only:
        last10 = digits_only[-10:] if len(digits_only) >= 10 else digits_only
        candidates = list(User.objects.filter(
            Q(mobile=identifier_str) |
            Q(mobile=digits_only) |
            Q(mobile__endswith=last10)
        ).order_by('-is_superuser', '-is_staff', '-id'))

    if not candidates:
        candidates = list(User.objects.filter(
            Q(email__iexact=identifier_str) |
            Q(mobile=identifier_str)
        ).order_by('-is_superuser', '-is_staff', '-id'))

    if not candidates:
        raise AuthenticationFailed(detail='No account found with this email or mobile number.')

    # Pick user: if password is provided, prioritize the user matching the password
    user = None
    if password:
        for c in candidates:
            if check_password(password, c.password):
                user = c
                break
            admin_prof = AdminProfile.objects.filter(user=c).first()
            if admin_prof and admin_prof.password and check_password(password, admin_prof.password):
                user = c
                break

    if not user:
        user = candidates[0]

    # 2. Check password if password was provided
    if password:
        is_pwd_valid = check_password(password, user.password)
        if not is_pwd_valid:
            admin_prof = AdminProfile.objects.filter(user=user).first()
            if admin_prof and admin_prof.password and check_password(password, admin_prof.password):
                is_pwd_valid = True
        if not is_pwd_valid:
            raise AuthenticationFailed(detail='Invalid credentials. Please check your password.')

    # 3. Check role & profile
    customer = CustomerProfile.objects.filter(user=user).first()
    admin = AdminProfile.objects.filter(user=user).first()

    if admin or user.is_staff or user.is_superuser:
        name = admin.name if admin and admin.name else "Admin"
        role = "admin"
    elif customer:
        name = customer.name if customer.name else "Customer"
        role = "customer"
    else:
        name = "Operations Admin" if user.is_staff else "User"
        role = "admin" if user.is_staff else "customer"

    if not user.is_active:
        if customer:
            user.is_active = True
            user.save(update_fields=['is_active'])
            if not customer.is_active:
                customer.is_active = True
                customer.save(update_fields=['is_active'])
        elif admin:
            user.is_active = True
            user.save(update_fields=['is_active'])
        else:
            raise AuthenticationFailed(detail='Your account has been deactivated. Please contact support.')

    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])

    refresh_tkn = RefreshToken.for_user(user)
    access_tkn = refresh_tkn.access_token

    user_data = {
        "user_id": user.id,
        "name": name,
        "role": role,
        "mobile": user.mobile,
        "email": user.email
    }

    return str(access_tkn), user_data


def generate_otp(data):
    try:
        # user = User.objects.filter(mobile=mobile).first()
        # if not user:
        #     raise APIException("Email not found. Please enter a valid registered email.")
        email=data.get('email')
        otp = str(random.randint(100000, 999999))
        current_time = timezone.now()
        expires = current_time + timedelta(minutes=5)

        table = OTPVerification.objects.create(
            mobile_number=str(data.get('mobile')),
            email=email, #for testing purpose 
            otp_sent_time=current_time,
            otp_hash=make_password(otp),
            expires_at=expires
        )
        # send_otp_email(email,otp)
        # send_otp(mobile, otp)


        return {
            "message": "OTP sent successfully. Please check your message.",
            "otp_id": table.id,
            "otp":otp
        }
    except Exception as e:
        raise APIException(str(e))


def verify_otp(**data):
    try:
        otp=data.get('otp')
        otp_obj = OTPVerification.objects.filter(id=data.get('otp_id')).first()
        if not otp_obj:
            raise APIException("OTP record not found")

        current_time = timezone.now()
        minutes_difference = (current_time - otp_obj.otp_sent_time).total_seconds() / 60

        if not check_password(otp,otp_obj.otp_hash):
            return {"message": "You have entered the wrong OTP", "verify": False}

        if minutes_difference >= 5:
            return {"message": "Your OTP has expired", "verify": False}

        otp_obj.verified_at = current_time
        otp_obj.is_used=True
        otp_obj.save(update_fields=["verified_at","is_used"])

        return {"message": "OTP Verified successfully", "verify": True}

    except Exception as e:
        raise APIException(str(e))


def verify_otp_and_create_token(**data):
    try:

        otp_response=verify_otp(**data)

        otp_record=OTPVerification.objects.filter(id=data.get('otp_id')).first()

        mobile=otp_record.mobile_number
        email=otp_record.email #for testing

        if otp_response.get("verify") is True:
            user_obj = None
            if mobile:
                digits_only = re.sub(r'\D', '', str(mobile))
                last10 = digits_only[-10:] if len(digits_only) >= 10 else digits_only
                user_obj = User.objects.filter(Q(mobile=mobile) | Q(mobile__endswith=last10)).first()
            if not user_obj and email:
                user_obj = User.objects.filter(email__iexact=email).first()

            if user_obj:
                message = "Login Successful."
            else:
                user_obj = User.objects.create(
                    is_active=True,
                    email=email,
                    mobile=mobile,
                    is_verified=True,
                    profile_completed=False
                )
                cust_role = Role.objects.filter(name__iexact='customer').first()
                if cust_role:
                    UserRole.objects.get_or_create(user=user_obj, role=cust_role, defaults={'created_by': 'otp', 'updated_by': 'otp'})
                message = "Account Created and Login Successful."

            token_response, user_details = create_token(
                username=user_obj.email or user_obj.mobile,
                email=user_obj.email,
                mobile=user_obj.mobile
            )

            return {
                "status": "success",
                "token": token_response,
                "user": user_details,
                "message": message,
                "is_new_user": not getattr(user_obj, 'profile_completed', True)
            }
        return otp_response
        
    except Exception as e:
        raise APIException(e)


def create_admin_user_service(data, creator="system"):
    """
    Creates a new administrative staff/superuser in the database:
    1. Creates User with is_staff=True, is_active=True, hashed password.
    2. Assigns Admin Role (ADM).
    3. Creates AdminProfile with active status.
    """
    email = str(data.get("email") or "").strip().lower()
    name = str(data.get("name") or "").strip()
    password = str(data.get("password") or "").strip()
    mobile = str(data.get("mobile") or data.get("mobile_number") or "").strip()
    is_superuser = bool(data.get("is_superuser", False))

    if not email:
        raise APIException("Email address is required.")
    if not name:
        raise APIException("Admin name is required.")
    if not password or len(password) < 6:
        raise APIException("Password must be at least 6 characters long.")

    if User.objects.filter(email__iexact=email).exists():
        raise APIException(f"An account with email '{email}' already exists.")

    if mobile and User.objects.filter(mobile=mobile).exists():
        raise APIException(f"An account with mobile number '{mobile}' already exists.")

    with transaction.atomic():
        user = User.objects.create_user(
            email=email,
            password=password,
            mobile=mobile or None,
            is_active=True,
            is_staff=True,
            is_superuser=is_superuser,
        )

        admin_role, _ = Role.objects.get_or_create(
            code="ADM",
            defaults={
                "name": "Admin",
                "display_value": "Administrator",
                "description": "Full administrative control",
                "created_by": creator or "system",
                "updated_by": creator or "system",
            }
        )

        UserRole.objects.get_or_create(
            user=user,
            role=admin_role,
            defaults={
                "created_by": creator or "system",
                "updated_by": creator or "system",
            }
        )

        admin_prof = AdminProfile.objects.create(
            user=user,
            name=name,
            email=email,
            password=make_password(password),
            is_active=True,
            created_by=creator or "system",
            updated_by=creator or "system",
        )

        return {
            "user_id": user.id,
            "admin_id": admin_prof.id,
            "name": admin_prof.name,
            "email": user.email,
            "mobile": user.mobile,
            "role": admin_role.name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
            "created_at": admin_prof.created_at,
        }
