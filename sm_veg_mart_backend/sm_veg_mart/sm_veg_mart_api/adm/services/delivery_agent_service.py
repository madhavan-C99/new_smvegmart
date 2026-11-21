import logging
from rest_framework.exceptions import ValidationError
from adm.models.delivery_boy import DeliveryBoyProfile
from adm.models.order_assignments import OrderAssignments
from biz.models.order import Order
from biz.services.order_tracking_service import assign_delivery_boy_and_notify
from . import order_service

logger = logging.getLogger('django')


def fetch_all_delivery_agents_service():
    """
    Returns list of all registered delivery agents with live availability based on active orders.
    """
    boys = DeliveryBoyProfile.objects.all().order_by('id')
    agents_data = []

    for boy in boys:
        # A rider is ONLY busy when an order is actually Out for Delivery (OFD).
        # In Dispatch / Packing, the rider remains Available (Online).
        active_ofd_assignments = OrderAssignments.objects.filter(
            delivery_boy=boy,
            status='OUT_FOR_DELIVERY'
        ).count()

        is_offline = (not boy.user or not boy.user.is_active or boy.status == 'offline')
        if is_offline:
            rider_status = 'offline'
            is_available = False
        elif active_ofd_assignments > 0:
            rider_status = 'busy'
            is_available = False
        else:
            rider_status = 'online'
            is_available = True

        # Sync database flags if needed
        if boy.is_available != is_available or boy.status != rider_status:
            boy.is_available = is_available
            boy.status = rider_status
            boy.save(update_fields=['is_available', 'status'])

        agents_data.append({
            "id": boy.id,
            "name": boy.name,
            "email": boy.email,
            "phone": boy.mobile_number,
            "vehicle_number": boy.vehicle_number or "",
            "driving_license_no": boy.driving_license_no or "",
            "is_available": is_available,
            "status": rider_status,
            "active_orders_count": active_ofd_assignments,
        })

    return agents_data


def assign_delivery_agent_service(order_id, delivery_boy_id):
    """
    Assigns a delivery agent to an order.
    The rider remains Available in Dispatch/Packing, and only becomes Busy when the order moves to OFD.
    """
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        raise ValidationError({"detail": f"Order with ID {order_id} not found."})

    try:
        boy = DeliveryBoyProfile.objects.get(id=delivery_boy_id)
    except DeliveryBoyProfile.DoesNotExist:
        raise ValidationError({"detail": f"Delivery Agent with ID {delivery_boy_id} not found."})

    existing_assignment = OrderAssignments.objects.filter(order_id=order.id).first()
    old_boy = existing_assignment.delivery_boy if existing_assignment else None

    norm_order_status = str(order.status or "").lower().strip()
    is_already_ofd = norm_order_status in ['out_for_delivery', 'out for delivery', 'ofd']

    # 1. Only mark rider as busy if the order is already in Out for Delivery (OFD)
    if is_already_ofd:
        boy.status = 'busy'
        boy.is_available = False
        boy.save(update_fields=['status', 'is_available'])
    else:
        # In Dispatch / Packing, rider remains Available
        if str(boy.status).lower() != 'offline':
            boy.status = 'online'
            boy.is_available = True
            boy.save(update_fields=['status', 'is_available'])

    assignment, created = OrderAssignments.objects.update_or_create(
        order_id=order.id,
        defaults={
            "delivery_boy": boy,
            "status": "OUT_FOR_DELIVERY" if is_already_ofd else "ASSIGNED",
            "updated_by": "admin"
        }
    )

    # Real-time Customer Notification of assigned rider (BIZ Tracking WebSocket)
    try:
        assign_delivery_boy_and_notify(order.id, boy.id)
    except Exception as ws_err:
        logger.warning(f"Could not trigger customer delivery boy tracking websocket: {ws_err}")

    # 2. If re-assigning from an old rider, restore old rider if they have no other active OFD orders
    if old_boy and old_boy.id != boy.id:
        has_other_ofd = OrderAssignments.objects.filter(
            delivery_boy=old_boy,
            status='OUT_FOR_DELIVERY'
        ).exclude(order_id=order.id).exists()
        if not has_other_ofd and old_boy.status == 'busy':
            old_boy.status = 'online'
            old_boy.is_available = True
            old_boy.save(update_fields=['status', 'is_available'])

    # 3. Real-time broadcast for all connected clients
    try:
        order_service.notify_order_subscribers()
    except Exception:
        pass

    return {
        "order_id": order.id,
        "delivery_agent": {
            "id": boy.id,
            "name": boy.name,
            "phone": boy.mobile_number,
            "vehicle_number": boy.vehicle_number,
            "status": boy.status,
            "is_available": boy.is_available,
        },
        "assignment_status": assignment.status
    }


def unassign_delivery_agent_service(order_id):
    """
    Removes the assigned delivery agent from an order and restores rider to Available status.
    """
    assignment = OrderAssignments.objects.filter(order_id=order_id).first()
    if assignment:
        boy = assignment.delivery_boy
        assignment.save_delete()

        # Check if rider has any other active OFD trips
        if boy:
            has_other_ofd = OrderAssignments.objects.filter(
                delivery_boy=boy,
                status='OUT_FOR_DELIVERY'
            ).exists()
            if not has_other_ofd:
                boy.status = 'online'
                boy.is_available = True
                boy.save(update_fields=['status', 'is_available'])

        try:
            order_service.notify_order_subscribers()
        except Exception:
            pass
        return {"order_id": order_id, "status": "UNASSIGNED"}

    return {"order_id": order_id, "status": "NO_ASSIGNMENT_FOUND"}
