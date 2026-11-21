import logging
from django.utils import timezone
from adm.models.notification import Notification
from biz.models.order import Order
from adm.utils.time_utils import format_12h_time, format_12h_datetime, to_ist
from . import order_service

logger = logging.getLogger('django')


def create_order_notification_service(order):
    """
    Creates a Notification record in adm_notification for an order if it does not already exist.
    """
    try:
        existing = Notification.objects.filter(order=order).first()
        if existing:
            return existing

        mode = str(order.delivery_mode or "").lower()
        if "pickup" in mode:
            title = "Incoming Pickup Order"
        elif "schedule" in mode:
            title = "Incoming Scheduled Order"
        else:
            title = "Incoming Express Order"

        cust_name = "Customer"
        if order.address and order.address.name:
            cust_name = order.address.name
        elif order.user:
            cust_name = getattr(order.user, 'name', cust_name) or cust_name

        order_no = order.order_number or f"SMV-{order.id}"
        message = f"New order {order_no} placed by {cust_name}"

        return Notification.objects.create(
            title=title,
            message=message,
            order=order,
            is_read=False,
            created_by="system",
            updated_by="system"
        )
    except Exception as e:
        logger.error(f"Error creating notification for order {order.id}: {e}")
        return None


def fetch_all_notifications_service():
    """
    Fetches all notifications from adm_notification joined with orders.
    Auto-populates Notification records for any new orders.
    """
    try:
        # Auto-create notification for any order with 'new order', 'confirmed', or 'waiting' status that lacks one
        new_orders = Order.objects.filter(status__in=['new_order', 'pending', 'new order', 'New Order', 'confirmed', 'Confirmed', 'waiting', 'Waiting'])
        for o in new_orders:
            if not Notification.objects.filter(order=o).exists():
                create_order_notification_service(o)

        orders_data = order_service.get_all_orders_orm()
        orders_map = {o['id']: o for o in orders_data}

        notifications = (
            Notification.objects
            .select_related('order', 'order__address', 'order__user')
            .order_by('-id')[:50]
        )

        results = []
        for n in notifications:
            order_payload = orders_map.get(n.order_id) if n.order_id else None
            current_status = None
            if order_payload and order_payload.get('status'):
                current_status = order_payload.get('status')
            elif n.order and n.order.status:
                current_status = n.order.status

            is_new = str(current_status or '').lower().strip() in ['new order', 'new_order', 'pending', 'placed', 'confirmed', 'waiting']
            is_read = n.is_read
            if not is_new and not is_read:
                Notification.objects.filter(id=n.id).update(is_read=True)
                is_read = True

            results.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "order_id": n.order_id,
                "order_number": (n.order.order_number if (n.order and n.order.order_number) else f"SMV-{n.order_id}"),
                "order_status": current_status or "New Order",
                "is_read": is_read,
                "created_at": format_12h_time(n.created_at) if n.created_at else "Just now",
                "created_at_datetime": format_12h_datetime(n.created_at),
                "order": order_payload,

            })

        return results
    except Exception as e:
        logger.error(f"Error in fetch_all_notifications_service: {e}", exc_info=True)
        return []


def mark_notification_read_service(order_id=None, notification_id=None):
    """
    Marks a notification as read in adm_notification table.
    """
    try:
        if order_id:
            clean_id = str(order_id).replace("#SM-", "").replace("#", "").strip()
            try:
                numeric_id = int(clean_id)
                Notification.objects.filter(order_id=numeric_id).update(is_read=True)
            except ValueError:
                Notification.objects.filter(order__order_number=str(order_id)).update(is_read=True)
        elif notification_id:
            Notification.objects.filter(id=notification_id).update(is_read=True)
        return True
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return False


def mark_all_notifications_read_service():
    """
    Marks all notifications as read in adm_notification table.
    """
    try:
        Notification.objects.filter(is_read=False).update(is_read=True)
        return True
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return False
