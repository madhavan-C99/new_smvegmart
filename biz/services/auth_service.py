import random
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from adm.models import User, CustomerProfile, OTPVerification, Role, UserRole
from ..models import Address

logger = logging.getLogger(__name__)


def send_otp_service(phone):
    # 30 Seconds Cooldown Check
    recent_otp = OTPVerification.objects.filter(
        mobile_number=phone,
        is_used=False,
        created_at__gte=timezone.now() - timedelta(seconds=30)
    ).order_by('-created_at').first()

    if recent_otp:
        raise serializers.ValidationError("Please wait 30 seconds before requesting a new OTP.")

    # 6-Digit OTP & 5 Minutes Expiry
    otp_code = str(random.randint(100000, 999999))
    expires_at = timezone.now() + timedelta(minutes=5)

    # Save OTP in adm_otp_verification
    otp_record = OTPVerification.objects.create(
        mobile_number=phone,
        otp_hash=make_password(otp_code),
        otp_sent_time=timezone.now(),
        expires_at=expires_at,
        is_used=False
    )

    logger.info(f"OTP for {phone}: {otp_code}")

    return {
        "message": "OTP sent successfully",
        "data": {
            "otp_id": otp_record.id,
            "otp": otp_code,
            "resend_in_seconds": 30
        }
    }


def verify_otp_service(otp, otp_id=None):
    # 1. Fetch OTP Record using otp_id or fallback to latest matching active OTP
    if otp_id:
        otp_record = OTPVerification.objects.filter(id=otp_id).first()
    else:
        active_otps = OTPVerification.objects.filter(
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        otp_record = None
        for rec in active_otps:
            if check_password(otp, rec.otp_hash):
                otp_record = rec
                break

    if not otp_record:
        raise serializers.ValidationError("Invalid OTP request or OTP not found.")

    # Get mobile number directly from OTP record
    phone = otp_record.mobile_number

    if otp_record.is_used:
        raise serializers.ValidationError("This OTP has already been used.")

    if timezone.now() > otp_record.expires_at:
        raise serializers.ValidationError("OTP has expired. Please request a new one.")

    if not check_password(otp, otp_record.otp_hash):
        raise serializers.ValidationError("Invalid OTP entered. Please try again.")

    # Mark OTP as used
    otp_record.is_used = True
    otp_record.verified_at = timezone.now()
    otp_record.save(update_fields=["is_used", "verified_at"])

    # Get or Create User upon verification
    user, created = User.objects.get_or_create(
        mobile=phone,
        defaults={
            "is_active": True,
            "is_verified": True,
            "profile_completed": False
        }
    )

    # Ensure user is active and verified
    if not user.is_active or not user.is_verified:
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=["is_active", "is_verified"])

    # Assign Customer Role
    role = Role.objects.filter(name__iexact="customer").first()
    if role and not UserRole.objects.filter(user=user, role=role).exists():
        UserRole.objects.create(user=user, role=role)

    # Check Customer Profile & Name
    profile = CustomerProfile.objects.filter(user=user).first()
    has_name = bool(profile and profile.name and profile.name.strip())
    is_new_user = not has_name
    name = profile.name.strip() if has_name else ""

    # Generate JWT Token
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)

    # Fetch Default Address
    default_address = None
    if profile:
        address = Address.objects.filter(user=profile, is_default=True).first()
        if not address:
            address = Address.objects.filter(user=profile).first()

        if address:
            default_address = {
                "id": address.id,
                "area_name": address.area_name or address.city or "",
                "full_address": address.address_line1 or "",
                "pincode": address.pincode or ""
            }

    return {
        "message": "Login successful",
        "data": {
            "token": token,
            "is_new_user": is_new_user,
            "name": name,
            "phone": phone,
            "default_address": default_address
        }
    }


def update_profile_service(user, name):
    clean_name = name.strip() if name else ""
    if not clean_name:
        raise serializers.ValidationError({"name": "Name is required."})

    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        profile = CustomerProfile.objects.create(
            user=user,
            name=clean_name,
            is_active=True
        )
    else:
        profile.name = clean_name
        profile.save(update_fields=["name"])

    # Update User profile_completed flag
    user.profile_completed = True
    user.save(update_fields=["profile_completed"])

    # Fetch Default Address
    default_address = None
    address = Address.objects.filter(user=profile, is_default=True).first()
    if not address:
        address = Address.objects.filter(user=profile).first()

    if address:
        default_address = {
            "id": address.id,
            "area_name": address.area_name or address.city or "",
            "full_address": address.address_line1 or "",
            "pincode": address.pincode or ""
        }

    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": {
            "name": profile.name,
            "phone": user.mobile or "",
            "default_address": default_address
        }
    }


def get_user_profile_service(user):
    profile = CustomerProfile.objects.filter(user=user).first()
    name = profile.name if profile and profile.name else ""

    default_address = None
    if profile:
        address = Address.objects.filter(user=profile, is_default=True).first()
        if not address:
            address = Address.objects.filter(user=profile).first()

        if address:
            default_address = {
                "id": address.id,
                "area_name": address.area_name or address.city or "",
                "full_address": address.address_line1 or "",
                "pincode": address.pincode or ""
            }

    return {
        "name": name,
        "phone": user.mobile,
        "default_address": default_address
    }
