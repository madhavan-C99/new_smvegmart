import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import ValidationError, APIException

from adm.models.customer_profile import CustomerProfile
from adm.models.user import User
from adm.models.role import Role
from adm.models.user_role import UserRole
from biz.models.order import Order
from adm.utils.time_utils import format_12h_datetime


import re
logger = logging.getLogger('django')


def build_customer_order_query(cp):
    order_query = Q(user=cp)

    # 1. Match by Customer Name (e.g. "Rajesh Verma")
    cust_name = str(cp.name or '').strip()
    if cust_name and cust_name.lower() not in ['customer', 'user', 'guest', 'none', '']:
        order_query |= Q(address__name__iexact=cust_name)

    # 2. Match by Customer Email
    if cp.email and str(cp.email).strip():
        order_query |= Q(user__email__iexact=str(cp.email).strip())

    # 3. Match by Customer Mobile (handling variations: '+919845028194', '9845028194', '98450 28194')
    user = getattr(cp, 'user', None)
    user_mobile = getattr(user, 'mobile', '') if user else ''
    if user_mobile:
        digits = re.sub(r'\D', '', str(user_mobile))
        if len(digits) >= 10:
            last10 = digits[-10:]
            # Continuous 10 digits
            order_query |= Q(address__mobile__icontains=last10)
            # Two-part spaced digits (e.g. "98450 28194")
            order_query |= (Q(address__mobile__icontains=last10[:5]) & Q(address__mobile__icontains=last10[5:]))
        elif digits:
            order_query |= Q(address__mobile__icontains=digits)

    return order_query


def evaluate_customer_7day_activity(cp, now=None):
    if now is None:
        now = timezone.now()
    
    cutoff_time = now - timedelta(days=7)
    user = getattr(cp, 'user', None)

    # 1. Did the customer place an order within the last 7 continuous days?
    order_query = build_customer_order_query(cp)
    latest_order = Order.objects.filter(order_query).order_by('-id').first()
    has_order_within_7_days = False
    latest_order_time = None

    if latest_order:
        # Re-link order to this CustomerProfile if it had been assigned to another account
        if latest_order.user_id != cp.id:
            try:
                latest_order.user = cp
                latest_order.save(update_fields=['user'])
            except Exception:
                pass

        latest_order_time = latest_order.created_at
        if not latest_order_time and latest_order.order_date:
            latest_order_time = timezone.make_aware(datetime.combine(latest_order.order_date, datetime.min.time()))
        if latest_order_time and latest_order_time >= cutoff_time:
            has_order_within_7_days = True

    # 2. Did the customer use / log into the app within the last 7 continuous days?
    # App usage includes: login timestamp, account creation, or placing an order.
    activity_dates = []
    if user and user.last_login:
        activity_dates.append(user.last_login)
    if cp.created_at:
        activity_dates.append(cp.created_at)
    if latest_order_time:
        activity_dates.append(latest_order_time)

    last_activity = max(activity_dates) if activity_dates else None
    used_app_within_7_days = bool(last_activity and last_activity >= cutoff_time)

    # Active requires BOTH app usage within 7 days AND an order within 7 days
    # (If an order was placed within 7 days, both requirements are inherently met)
    is_active = (used_app_within_7_days and has_order_within_7_days)

    # Safely synchronize is_active in DB if changed
    if cp.is_active != is_active:
        cp.is_active = is_active
        cp.save(update_fields=['is_active'])
        if user and user.is_active != is_active:
            user.is_active = is_active
            user.save(update_fields=['is_active'])

    return is_active


def update_all_customers_activity_status_service():
    now = timezone.now()
    active_count = 0
    inactive_count = 0
    
    customers = CustomerProfile.objects.all().select_related('user')
    for cp in customers:
        is_active = evaluate_customer_7day_activity(cp, now=now)
        if is_active:
            active_count += 1
        else:
            inactive_count += 1
            
    return {
        "total_evaluated": customers.count(),
        "active_count": active_count,
        "inactive_count": inactive_count,
        "evaluated_at": now.isoformat()
    }


def check_customer_activity_manual():
    result = update_all_customers_activity_status_service()
    return result


def fetch_all_customers_service(search="", sort_by="normal", order_by="asc"):
    """
    Returns list of all customers with contact information, 7-day activity status, and order statistics.
    """
    queryset = CustomerProfile.objects.all().select_related('user')

    # 1. Search Filter (by name, mobile, email)
    if search:
        search_term = str(search).strip()
        queryset = queryset.filter(
            Q(name__icontains=search_term) |
            Q(email__icontains=search_term) |
            Q(user__mobile__icontains=search_term)
        )

    # 2. Sorting
    desc = order_by.lower() in ["desc", "descending"]
    if sort_by.lower() == "name":
        queryset = queryset.order_by("-name" if desc else "name")
    elif sort_by.lower() == "status":
        queryset = queryset.order_by("-is_active" if desc else "is_active")
    else:
        # Default sort by id
        queryset = queryset.order_by("-id" if desc else "id")

    customers_list = []
    now = timezone.now()
    for cp in queryset:
        mobile = cp.user.mobile if cp.user and cp.user.mobile else ""
        if mobile and not mobile.startswith("+"):
            mobile = f"+91 {mobile}" if len(mobile) == 10 else mobile

        # Format registered date: "12 Jan 2024" in IST
        reg_date = format_12h_datetime(cp.created_at, "%d %b %Y") if cp.created_at else "—"


        # Count total orders placed by customer using multi-attribute query
        ord_q = build_customer_order_query(cp)
        order_count = Order.objects.filter(ord_q).count()

        # Dynamically evaluate 7-day continuous activity
        is_active = evaluate_customer_7day_activity(cp, now=now)

        customers_list.append({
            "id": cp.id,
            "user_id": cp.user.id if cp.user else None,
            "name": cp.name,
            "email": cp.email or "",
            "mobile_number": mobile,
            "role_name": "Customer",
            "is_active": is_active,
            "status": "Active" if is_active else "Inactive",
            "registered_date": reg_date,
            "created_at": cp.created_at.isoformat() if cp.created_at else None,
            "total_orders": order_count
        })

    return {
        "total_count": len(customers_list),
        "customers": customers_list
    }


def update_customer_service(customer_id, data):
    """
    Updates an existing customer profile and associated user details.
    """
    try:
        cp = CustomerProfile.objects.select_related('user').get(id=customer_id)
    except CustomerProfile.DoesNotExist:
        raise ValidationError({"message": f"Customer with id {customer_id} does not exist."})

    name = data.get("name")
    email = data.get("email")
    mobile = data.get("mobile_number")
    is_active = data.get("is_active")

    if name is not None:
        cp.name = str(name).strip()
    if email is not None:
        cp.email = str(email).strip()
    if is_active is not None:
        cp.is_active = bool(is_active)
        if cp.user:
            cp.user.is_active = bool(is_active)
            cp.user.save(update_fields=['is_active'])

    if mobile is not None and cp.user:
        cleaned_mobile = str(mobile).replace("+91", "").replace(" ", "").strip()
        cp.user.mobile = cleaned_mobile
        cp.user.save(update_fields=['mobile'])

    cp.save()

    return {
        "id": cp.id,
        "name": cp.name,
        "email": cp.email,
        "mobile_number": cp.user.mobile if cp.user else "",
        "is_active": cp.is_active,
        "status": "Active" if cp.is_active else "Inactive"
    }


def toggle_customer_status_service(customer_id):
    """
    Toggles customer active/inactive status.
    """
    try:
        cp = CustomerProfile.objects.select_related('user').get(id=customer_id)
    except CustomerProfile.DoesNotExist:
        raise ValidationError({"message": f"Customer with id {customer_id} does not exist."})

    cp.is_active = not cp.is_active
    cp.save(update_fields=['is_active'])

    if cp.user:
        cp.user.is_active = cp.is_active
        cp.user.save(update_fields=['is_active'])

    return {
        "id": cp.id,
        "is_active": cp.is_active,
        "status": "Active" if cp.is_active else "Inactive"
    }


def delete_customer_service(customer_id):
    """
    Deletes customer profile.
    """
    try:
        cp = CustomerProfile.objects.get(id=customer_id)
    except CustomerProfile.DoesNotExist:
        raise ValidationError({"message": f"Customer with id {customer_id} does not exist."})

    cp.delete()
    return {"message": "Customer deleted successfully"}
