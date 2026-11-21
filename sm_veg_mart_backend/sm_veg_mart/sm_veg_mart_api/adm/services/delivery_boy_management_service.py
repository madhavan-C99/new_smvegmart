import logging
from datetime import datetime
from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import ValidationError, APIException

from adm.models.delivery_boy import DeliveryBoyProfile
from adm.models.user import User
from adm.models.order_assignments import OrderAssignments
from biz.models.order import Order
from .order_service import notify_order_subscribers
from adm.utils.time_utils import format_12h_datetime


logger = logging.getLogger('django')


def fetch_all_delivery_boys_service(search="", sort_by="normal", order_by="asc"):
    """
    Returns list of all active delivery boys with delivery metrics and contact information.
    """
    queryset = DeliveryBoyProfile.objects.all().select_related('user')

    # 1. Search Filter (by name, mobile, email)
    if search:
        search_term = str(search).strip()
        queryset = queryset.filter(
            Q(name__icontains=search_term) |
            Q(mobile_number__icontains=search_term) |
            Q(email__icontains=search_term) |
            Q(address_line1__icontains=search_term) |
            Q(address_line2__icontains=search_term)
        )

    # 2. Sorting
    desc = order_by.lower() == "desc" or order_by.lower() == "descending"
    if sort_by.lower() == "name":
        queryset = queryset.order_by("-name" if desc else "name")
    elif sort_by.lower() == "status":
        queryset = queryset.order_by("-status" if desc else "status")
    else:
        # Default / Normal sort by ID
        queryset = queryset.order_by("-id" if desc else "id")

    today = timezone.localdate()
    boys_list = []

    for boy in queryset:
        # Count delivered orders
        total_delivered = OrderAssignments.objects.filter(
            delivery_boy=boy,
            status='DELIVERED'
        ).count()

        # Count delivered today
        delivered_today = OrderAssignments.objects.filter(
            delivery_boy=boy,
            status='DELIVERED',
            delivered_at__date=today
        ).count()

        # Active assigned orders (currently OUT on delivery trip)
        active_orders = OrderAssignments.objects.filter(
            delivery_boy=boy,
            status='OUT_FOR_DELIVERY'
        ).count()

        # Determine 3-state status: online / busy / offline directly from order management
        if not boy.user or not boy.user.is_active or str(boy.status).lower() == 'offline':
            rider_status = 'offline'
            is_avail = False
        elif active_orders > 0:
            rider_status = 'busy'
            is_avail = False
        else:
            rider_status = 'online'
            is_avail = True

        if boy.status != rider_status or boy.is_available != is_avail:
            boy.status = rider_status
            boy.is_available = is_avail
            boy.save(update_fields=['status', 'is_available'])

        # Build address
        addr_parts = [p for p in [boy.address_line1, boy.address_line2] if p]
        full_address = ", ".join(addr_parts) if addr_parts else "No address provided"

        is_user_active = boy.user.is_active if boy.user else True

        boys_list.append({
            "id": boy.id,
            "user_id": boy.user_id if boy.user else None,
            "name": boy.name,
            "email": boy.email,
            "mobile": boy.mobile_number,
            "mobile_number": boy.mobile_number,
            "address_line1": boy.address_line1 or "",
            "address_line2": boy.address_line2 or "",
            "full_address": full_address,
            "vehicle_number": boy.vehicle_number or "",
            "driving_license_no": boy.driving_license_no or "",
            "is_available": is_avail,
            "status": rider_status, # online, busy, offline
            "is_active": is_user_active,
            "total_delivered": total_delivered,
            "delivered_today": delivered_today,
            "active_orders_count": active_orders,
            "created_at": format_12h_datetime(boy.created_at) if boy.created_at else "",
        })


    return {
        "delivery_boys": boys_list,
        "total_count": len(boys_list),
        "online_count": sum(1 for b in boys_list if b["status"] == "online"),
        "busy_count": sum(1 for b in boys_list if b["status"] == "busy"),
        "offline_count": sum(1 for b in boys_list if b["status"] == "offline"),
        "active_count": sum(1 for b in boys_list if b["status"] == "online"),
    }


def create_delivery_boy_service(data, created_by="admin"):
    """
    Creates a User account and corresponding DeliveryBoyProfile.
    """
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    mobile_number = (data.get("mobile_number") or data.get("mobile") or "").strip()
    password = (data.get("password") or "").strip()
    address_line1 = (data.get("address_line1") or "").strip()
    address_line2 = (data.get("address_line2") or "").strip()
    driving_license_no = (data.get("driving_license_no") or "").strip()
    vehicle_number = (data.get("vehicle_number") or "").strip()

    if not name:
        raise ValidationError({"name": "Full name is required."})
    if not mobile_number:
        raise ValidationError({"mobile_number": "Mobile number is required."})
    if not email:
        raise ValidationError({"email": "Email address is required."})
    if not password:
        raise ValidationError({"password": "Password is required."})
    if not address_line1:
        raise ValidationError({"address_line1": "Address Line 1 is required."})
    if not driving_license_no:
        raise ValidationError({"driving_license_no": "Driving License Number is required."})

    # 1. Check existing DeliveryBoyProfile
    if DeliveryBoyProfile.objects.filter(email=email).exists():
        raise ValidationError({"email": f"Delivery boy with email '{email}' already exists."})
    if DeliveryBoyProfile.objects.filter(mobile_number=mobile_number).exists():
        raise ValidationError({"mobile_number": f"Delivery boy with mobile '{mobile_number}' already exists."})

    # 2. Check / Create User
    user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create_user(
            email=email,
            password=password,
            mobile=mobile_number
        )
        if hasattr(user, 'first_name'):
            user.first_name = name
        user.mobile = mobile_number
        user.is_active = True
        user.save()
    else:
        # Existing user - update details
        if hasattr(user, 'first_name'):
            user.first_name = name
        user.mobile = mobile_number
        user.is_active = True
        if password:
            user.set_password(password)
        user.save()

    # 3. Create DeliveryBoyProfile
    boy = DeliveryBoyProfile.objects.create(
        user=user,
        name=name,
        email=email,
        mobile_number=mobile_number,
        address_line1=address_line1,
        address_line2=address_line2,
        vehicle_number=(data.get("vehicle_number") or "").strip(),
        driving_license_no=(data.get("driving_license_no") or "").strip(),
        is_available=True,
        status="online",
        created_by=created_by,
        updated_by=created_by
    )

    # 4. Real-time broadcast for orders websocket
    try:
        notify_order_subscribers()
    except Exception as e:
        logger.warning(f"Could not notify websocket subscribers: {e}")

    return {
        "id": boy.id,
        "name": boy.name,
        "email": boy.email,
        "mobile": boy.mobile_number,
        "address_line1": boy.address_line1,
        "address_line2": boy.address_line2,
        "vehicle_number": boy.vehicle_number,
        "driving_license_no": boy.driving_license_no,
        "status": boy.status,
        "is_available": boy.is_available,
        "is_active": True
    }


def update_delivery_boy_service(boy_id, data, updated_by="admin"):
    """
    Updates an existing DeliveryBoyProfile and linked User credentials.
    """
    try:
        boy = DeliveryBoyProfile.objects.get(id=boy_id)
    except DeliveryBoyProfile.DoesNotExist:
        raise ValidationError({"id": f"Delivery boy with ID {boy_id} not found."})

    if "name" in data and data["name"]:
        boy.name = data["name"].strip()
    if "mobile_number" in data and data["mobile_number"]:
        new_mobile = data["mobile_number"].strip()
        # Verify uniqueness
        if DeliveryBoyProfile.objects.filter(mobile_number=new_mobile).exclude(id=boy.id).exists():
            raise ValidationError({"mobile_number": "This mobile number is already in use by another rider."})
        boy.mobile_number = new_mobile

    if "email" in data and data["email"]:
        new_email = data["email"].strip().lower()
        if DeliveryBoyProfile.objects.filter(email=new_email).exclude(id=boy.id).exists():
            raise ValidationError({"email": "This email address is already in use by another rider."})
        boy.email = new_email

    if "address_line1" in data:
        boy.address_line1 = (data.get("address_line1") or "").strip()
    if "address_line2" in data:
        boy.address_line2 = (data.get("address_line2") or "").strip()
    if "vehicle_number" in data:
        boy.vehicle_number = (data.get("vehicle_number") or "").strip()
    if "driving_license_no" in data:
        boy.driving_license_no = (data.get("driving_license_no") or "").strip()
    if "status" in data:
        new_status = str(data["status"]).lower().strip()
        boy.status = new_status
        if new_status == "online":
            boy.is_available = True
        else:
            boy.is_available = False

    if "is_available" in data:
        boy.is_available = bool(data["is_available"])

    boy.updated_by = updated_by
    boy.save()

    # Update User model
    if boy.user:
        if hasattr(boy.user, 'first_name'):
            boy.user.first_name = boy.name
        boy.user.mobile = boy.mobile_number
        boy.user.email = boy.email
        if data.get("password"):
            boy.user.set_password(data["password"])
        if "is_active" in data:
            boy.user.is_active = bool(data["is_active"])
        boy.user.save()

    # Real-time broadcast
    try:
        notify_order_subscribers()
    except Exception as e:
        logger.warning(f"Could not notify websocket subscribers: {e}")

    return {
        "id": boy.id,
        "name": boy.name,
        "email": boy.email,
        "mobile": boy.mobile_number,
        "address_line1": boy.address_line1,
        "address_line2": boy.address_line2,
        "vehicle_number": boy.vehicle_number,
        "driving_license_no": boy.driving_license_no,
        "status": boy.status,
        "is_available": boy.is_available,
        "is_active": boy.user.is_active if boy.user else True
    }


def delete_delivery_boy_service(boy_id, user_id=None):
    """
    Deactivates and removes delivery boy from roster.
    """
    try:
        boy = DeliveryBoyProfile.objects.get(id=boy_id)
    except DeliveryBoyProfile.DoesNotExist:
        raise ValidationError({"id": f"Delivery boy with ID {boy_id} not found."})

    # Unassign from any active orders first
    OrderAssignments.objects.filter(delivery_boy=boy, status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']).delete()

    # Soft delete using SafeDeleteModel
    if hasattr(boy, 'save_delete'):
        boy.save_delete(user_id=user_id)
    else:
        boy.delete()

    # Also deactivate user account
    if boy.user:
        boy.user.is_active = False
        boy.user.save()

    try:
        notify_order_subscribers()
    except Exception as e:
        logger.warning(f"Could not notify websocket subscribers: {e}")

    return {"id": boy_id, "message": "Delivery boy deleted successfully."}


def toggle_delivery_boy_status_service(boy_id):
    """
    Toggles delivery boy between Active/Online and Inactive/Offline.
    """
    try:
        boy = DeliveryBoyProfile.objects.get(id=boy_id)
    except DeliveryBoyProfile.DoesNotExist:
        raise ValidationError({"id": f"Delivery boy with ID {boy_id} not found."})

    if boy.status == 'online':
        boy.status = 'offline'
        boy.is_available = False
    else:
        boy.status = 'online'
        boy.is_available = True

    boy.save()

    if boy.user:
        boy.user.is_active = boy.is_available
        boy.user.save()

    try:
        notify_order_subscribers()
    except Exception as e:
        logger.warning(f"Could not notify websocket subscribers: {e}")

    return {
        "id": boy.id,
        "status": boy.status,
        "is_available": boy.is_available,
        "is_active": boy.user.is_active if boy.user else True
    }


def get_delivery_boy_details_service(boy_id):
    """
    Returns full profile and delivery metrics for the details modal (Image 4).
    """
    try:
        boy = DeliveryBoyProfile.objects.select_related('user').get(id=boy_id)
    except DeliveryBoyProfile.DoesNotExist:
        raise ValidationError({"id": f"Delivery boy with ID {boy_id} not found."})

    today = timezone.localdate()

    total_delivered = OrderAssignments.objects.filter(
        delivery_boy=boy,
        status='DELIVERED'
    ).count()

    delivered_today = OrderAssignments.objects.filter(
        delivery_boy=boy,
        status='DELIVERED',
        delivered_at__date=today
    ).count()

    active_orders = OrderAssignments.objects.filter(
        delivery_boy=boy,
        status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']
    ).count()

    if active_orders > 0 or str(boy.status).lower() == 'busy':
        rider_status = 'busy'
        is_avail = False
    elif str(boy.status).lower() == 'offline' or boy.is_available is False:
        rider_status = 'offline'
        is_avail = False
    else:
        rider_status = 'online'
        is_avail = True

    addr_parts = [p for p in [boy.address_line1, boy.address_line2] if p]
    full_address = ", ".join(addr_parts) if addr_parts else "No address provided"

    return {
        "id": boy.id,
        "name": boy.name,
        "email": boy.email,
        "mobile": boy.mobile_number,
        "address_line1": boy.address_line1 or "",
        "address_line2": boy.address_line2 or "",
        "full_address": full_address,
        "status": rider_status,
        "is_available": is_avail,
        "is_active": boy.user.is_active if boy.user else True,
        "total_delivered": total_delivered,
        "delivered_today": delivered_today,
        "active_orders_count": active_orders,
        "vehicle_number": boy.vehicle_number or "",
        "driving_license_no": boy.driving_license_no or "",
        "joined_date": format_12h_datetime(boy.created_at, "%d %b %Y") if boy.created_at else "",
    }

