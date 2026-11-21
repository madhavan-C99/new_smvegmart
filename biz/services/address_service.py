import logging
from rest_framework import serializers
from adm.models.customer_profile import CustomerProfile
from ..models.address import Address
from biz.utils.time_utils import format_12h_datetime

logger = logging.getLogger(__name__)


def add_address_service(
    user,
    full_address,
    pincode,
    label="Home",
    house_flat_no=None,
    apartment_name=None,
    landmark=None,
    area_name=None,
    latitude=None,
    longitude=None,
    delivery_mode=None,
    is_default=False,
):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    # 1. First address logic: if no existing addresses, force is_default = True
    existing_count = Address.objects.filter(user=profile).count()
    if existing_count == 0:
        is_default = True
    elif is_default:
        # If new address is marked as default, unset previous default addresses
        Address.objects.filter(user=profile, is_default=True).update(is_default=False)

    # 2. Save exactly what the user provided
    address = Address.objects.create(
        user=profile,
        name=profile.name or "Customer",
        mobile=user.mobile or "",
        category=label or "Home",
        house_flat_no=house_flat_no or "",
        apartment_name=apartment_name or "",
        landmark=landmark or "",
        area_name=area_name or "",
        address_line1=full_address,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
        delivery_mode=delivery_mode,
        is_default=is_default,
    )

    logger.info(f"address_created | id={address.id} | user_id={user.id} | default={is_default}")

    return {
        "id": address.id,
        "label": address.category,
        "house_flat_no": address.house_flat_no or "",
        "apartment_name": address.apartment_name or "",
        "landmark": address.landmark or "",
        "area_name": address.area_name or "",
        "full_address": address.address_line1 or "",
        "pincode": address.pincode or "",
        "latitude": float(address.latitude) if address.latitude is not None else None,
        "longitude": float(address.longitude) if address.longitude is not None else None,
        "delivery_mode": address.delivery_mode,
        "is_default": address.is_default,
        "created_at": format_12h_datetime(address.created_at),
    }


def get_user_addresses_service(user):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        return []

    # Sort so default address comes first, then recent ones
    addresses = Address.objects.filter(user=profile).order_by("-is_default", "-id")

    address_list = []
    for addr in addresses:
        address_list.append({
            "id": addr.id,
            "label": addr.category or "Home",
            "house_flat_no": addr.house_flat_no or "",
            "apartment_name": addr.apartment_name or "",
            "landmark": addr.landmark or "",
            "area_name": addr.area_name or "",
            "full_address": addr.address_line1 or "",
            "pincode": addr.pincode or "",
            "is_default": addr.is_default,
        })

    logger.info(f"get_user_addresses | user_id={user.id} | count={len(address_list)}")
    return address_list
