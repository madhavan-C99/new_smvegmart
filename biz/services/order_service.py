import logging
import random
import math
import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from django.db import transaction
from django.db.models import Q
from rest_framework import serializers

from adm.models.customer_profile import CustomerProfile
from adm.models.products import Product
from adm.models.product_variants import ProductVariant
from adm.models.order_configuration import OrderConfiguration
from adm.models.order_config_day_timings import OrderConfigDayTimings
from adm.models.payment_transaction import Transaction
from biz.models.order import Order
from biz.models.order_items import OrderItems
from biz.models.address import Address
from biz.models.cart import Cart
from biz.models.cart_items import CartItems
from biz.services.cart_service import get_or_create_active_cart
from biz.utils.time_utils import get_ist_now, format_12h_datetime

logger = logging.getLogger(__name__)


# Main Place Order Service
def place_order_service(user, validated_data):
    logger.info(f"place_order_service_call | user_id={user.id}")

    # 1. User Profile சரிபார்த்தல்
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    delivery_mode = validated_data.get("delivery_mode", "express").lower()
    address_id = validated_data.get("address_id")
    order_config_id = validated_data.get("order_config_id")
    order_day_config_timings_id = validated_data.get("order_day_config_timings_id")
    scheduled_date = validated_data.get("scheduled_date")
    items_input = validated_data.get("items", [])

    # 2. Items List சரிபார்த்தல்
    if not items_input or not isinstance(items_input, list):
        raise serializers.ValidationError("Items list cannot be empty.")

    # 3. Address சரிபார்த்தல் (Pickup தவிர மற்றவற்றுக்கு Address கட்டாயம்)
    address = None
    if address_id:
        address = Address.objects.filter(id=address_id, user=profile).first()
        if not address:
            raise serializers.ValidationError("Selected address does not exist or belong to this user.")
    elif delivery_mode != "pickup":
        raise serializers.ValidationError("Delivery address is required for this delivery mode.")

    # 4. Delivery Master Config & Slot Timing எடுத்தல்
    order_config = None
    if order_config_id:
        order_config = OrderConfiguration.objects.filter(id=order_config_id).first()
    if not order_config:
        order_config = OrderConfiguration.objects.filter(delivery_option=delivery_mode).first()

    timing_mapping = None
    if order_day_config_timings_id:
        timing_mapping = OrderConfigDayTimings.objects.filter(id=order_day_config_timings_id, is_active=True).first()

    # 5. Dates தயாரித்தல் (IST)
    now_ist = get_ist_now()
    order_date = now_ist.date()
    delivery_date = scheduled_date if scheduled_date else order_date

    # 6. ஒவ்வொரு Item-யும் சரிபார்த்து Subtotal கணக்கிடுதல்
    items_subtotal = 0.0
    verified_items = []

    for item in items_input:
        if not isinstance(item, dict):
            raise serializers.ValidationError("Each item must be an object.")

        product_id = item.get("product_id")
        if not product_id:
            raise serializers.ValidationError("product_id is required in each item.")

        qty = item.get("qty")
        if not qty or int(qty) < 1:
            raise serializers.ValidationError("Valid qty (>= 1) is required in each item.")
        qty = int(qty)

        variant_id = item.get("variant_id")

        product = Product.objects.filter(id=product_id, is_active=True).first()
        if not product:
            raise serializers.ValidationError(f"Product not found or inactive (ID: {product_id})")

        variant = None
        if variant_id:
            variant = ProductVariant.objects.filter(id=variant_id, product=product).first()
        if not variant:
            variant = ProductVariant.objects.filter(product=product, is_available=True).first() or ProductVariant.objects.filter(product=product).first()

        if not variant:
            raise serializers.ValidationError(f"No variant found for product '{product.name}'")

        unit_price = float(variant.selling_price)
        item_total = round(unit_price * qty, 2)
        items_subtotal += item_total

        verified_items.append({
            "product": product,
            "variant": variant,
            "weight": variant.unit_value or "1 unit",
            "quantity": qty,
            "unit_price": unit_price,
            "total_price": item_total,
        })

    # 7. Delivery Charge கணக்கிடுதல் (Free delivery threshold check)
    delivery_charge = 0.0
    if order_config:
        fee = float(order_config.delivery_charge)
        min_amount = float(order_config.min_amount)
        if min_amount > 0 and items_subtotal >= min_amount:
            delivery_charge = 0.0
        else:
            delivery_charge = fee
    else:
        delivery_charge = 25.0 if delivery_mode == "express" else (10.0 if delivery_mode == "scheduled" else 0.0)

    total_amount = round(items_subtotal + delivery_charge, 2)
    delivery_otp = f"{random.randint(1000, 9999)}"

    initial_stage_time = {
        "waiting": {
            "time": now_ist.strftime("%I:%M %p"),
            "date": now_ist.strftime("%d %b %Y"),
            "display": now_ist.strftime("%d %b %Y, %I:%M %p"),
        }
    }

    # 8. Atomic Transaction மூலம் Order மற்றும் OrderItems உருவாக்குதல்
    with transaction.atomic():
        temp_number = f"TEMP-{uuid.uuid4().hex[:6]}"
        order = Order.objects.create(
            user=profile,
            total_amount=total_amount,
            order_number=temp_number,
            status="waiting",
            payment_status=False,
            address=address,
            delivery_mode=delivery_mode,
            delivery_date=delivery_date,
            delivery_charge=delivery_charge,
            delivery_otp=delivery_otp,
            order_date=order_date,
            order_config_day_timings=timing_mapping,
            stage_timestamps=initial_stage_time,
            created_by=profile.name or "Customer",
            updated_by=profile.name or "Customer",
        )

        formatted_order_number = f"SMV-{order_date.strftime('%Y%m%d')}-{order.id:03d}"
        order.order_number = formatted_order_number
        order.save(update_fields=["order_number"])

        for vi in verified_items:
            OrderItems.objects.create(
                order=order,
                product=vi["product"],
                weight=vi["weight"],
                quantity=vi["quantity"],
                unit_price=vi["unit_price"],
                total_price=vi["total_price"],
            )

        # Cart-ஐ Checkout ஆனதாக மாற்றுதல்
        Cart.objects.filter(user=profile, is_ordered=False).update(is_ordered=True)

    placed_at_display = format_12h_datetime(order.created_at)

    logger.info(f"order_placed_success | order_id={order.id} | number={order.order_number} | total={total_amount}")

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "placed_at": placed_at_display,
        "created_at": placed_at_display,
        "updated_at": format_12h_datetime(order.updated_at),
        "delivery_mode": order.delivery_mode,
        "total_amount": float(order.total_amount),
        "order_status": order.status,
        "payment_status": "pending",
    }


def get_user_orders_service(request, user, status="all", page=1, limit=10, search=None):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    all_orders = Order.objects.filter(user=profile)
    total_all_orders = all_orders.count()
    active_statuses = ["waiting", "confirmed", "dispatched", "out for delivery"]
    total_active_orders = all_orders.filter(status__in=active_statuses).count()
    total_delivered_orders = all_orders.filter(status__iexact="delivered").count()

    orders_query = all_orders

    # Tab Filter
    status_tab = (status or "all").lower().strip()
    if status_tab == "active":
        orders_query = orders_query.filter(status__in=active_statuses)
    elif status_tab == "delivered":
        orders_query = orders_query.filter(status__iexact="delivered")

    # Search Filter
    if search:
        search_query = str(search).strip()
        search_filter = (
            Q(order_number__icontains=search_query) |
            Q(items__product__name__icontains=search_query) |
            Q(items__product__tamil_name__icontains=search_query)
        )
        if search_query.isdigit():
            search_filter |= Q(id=int(search_query))
        orders_query = orders_query.filter(search_filter).distinct()

    orders_query = orders_query.order_by("-id").prefetch_related("items__product", "delivery_slot")

    total_orders_count = orders_query.count()
    total_pages = max(1, math.ceil(total_orders_count / limit))
    offset = (page - 1) * limit
    paginated_orders = orders_query[offset:offset + limit]

    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    today_date = now_ist.date()
    yesterday_date = today_date - timedelta(days=1)

    orders_list = []
    for order in paginated_orders:
        status_clean = order.status.lower().strip()
        status_key = status_clean.replace(" ", "_")
        is_pickup = "pickup" in (order.delivery_mode or "").lower()

        if status_clean == "delivered":
            status_label = "Delivered"
        elif status_clean == "out for delivery":
            status_label = "Active / In Transit"
        elif status_clean == "dispatched":
            status_label = "Ready for Pick Up" if is_pickup else "Farm Fresh Packed"
        elif status_clean == "confirmed":
            status_label = "Confirmed"
        elif status_clean == "waiting":
            status_label = "Waiting"
        elif status_clean == "cancelled":
            status_label = "Cancelled"
        else:
            status_label = order.status.capitalize()

        created_ist = order.created_at.astimezone(ZoneInfo("Asia/Kolkata"))
        time_str = created_ist.strftime("%I:%M %p")
        day_str = created_ist.strftime("%d %b")
        if created_ist.date() == today_date:
            placed_at = f"Today, {day_str} • {time_str}"
        elif created_ist.date() == yesterday_date:
            placed_at = f"Yesterday, {day_str} • {time_str}"
        else:
            placed_at = f"{created_ist.strftime('%d %b %Y')} • {time_str}"

        delivered_at = None
        if status_clean == "delivered":
            delivered_time = None
            if isinstance(order.stage_timestamps, dict) and "delivered" in order.stage_timestamps:
                entry = order.stage_timestamps["delivered"]
                delivered_time = entry.get("time") if isinstance(entry, dict) else entry
            if delivered_time:
                delivered_at = f"Delivered • {delivered_time}"
            else:
                delivered_at = f"Delivered {order.updated_at.strftime('%d %b %Y')}"

        delivery_slot = None
        if order.delivery_slot:
            slot = order.delivery_slot
            start_str = slot.start_time.strftime("%I:%M %p") if slot.start_time else ""
            end_str = slot.end_time.strftime("%I:%M %p") if slot.end_time else ""
            delivery_slot = f"Scheduled Slot: {start_str} - {end_str}"

        mode_clean = (order.delivery_mode or "express").lower()
        if "pickup" in mode_clean:
            delivery_mode = "pickup"
        elif "scheduled" in mode_clean:
            delivery_mode = "scheduled"
        else:
            delivery_mode = "express"

        items_preview = []
        for order_item in order.items.all():
            product = order_item.product
            variant_id = ProductVariant.objects.filter(
                product=product,
                unit_value=order_item.weight
            ).values_list("id", flat=True).first()

            if not variant_id:
                variant_id = product.variants.values_list("id", flat=True).first() or 0

            image_url = ""
            if product.product_img:
                image_url = request.build_absolute_uri(product.product_img.url) if request else product.product_img.url

            items_preview.append({
                "product_id": product.id,
                "variant_id": variant_id,
                "name_en": product.name,
                "name_ta": product.tamil_name or product.name,
                "unit_label": order_item.weight,
                "selling_price": float(order_item.unit_price),
                "qty": order_item.quantity,
                "image_url": image_url
            })

        is_live_tracking = status_clean in ["waiting", "confirmed", "dispatched", "out for delivery"]

        orders_list.append({
            "order_id": order.id,
            "order_number": order.order_number,
            "order_status": status_key,
            "status_label": status_label,
            "is_live_tracking": is_live_tracking,
            "placed_at": placed_at,
            "delivered_at": delivered_at,
            "delivery_mode": delivery_mode,
            "delivery_slot": delivery_slot,
            "total_amount": float(order.total_amount),
            "payment_status": order.payment_status,
            "payment_method": "Online Payment" if order.payment_status else None,
            "total_items_count": len(items_preview),
            "items_preview": items_preview
        })

    return {
        "counts": {
            "all": total_all_orders,
            "active": total_active_orders,
            "delivered": total_delivered_orders
        },
        "pagination": {
            "total_orders": total_orders_count,
            "current_page": page,
            "total_pages": total_pages,
            "has_next": page < total_pages
        },
        "orders": orders_list
    }


def get_order_details(request, user, order_id):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    order = Order.objects.filter(id=order_id, user=profile).first()
    if not order:
        raise serializers.ValidationError(f"Order not found with ID {order_id}.")

    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    today_date = now_ist.date()
    yesterday_date = today_date - timedelta(days=1)

    created_ist = order.created_at.astimezone(ZoneInfo("Asia/Kolkata"))
    time_str = created_ist.strftime("%I:%M %p")
    day_str = created_ist.strftime("%d %b")
    if created_ist.date() == today_date:
        placed_at = f"Today, {day_str} • {time_str}"
    elif created_ist.date() == yesterday_date:
        placed_at = f"Yesterday, {day_str} • {time_str}"
    else:
        placed_at = f"{created_ist.strftime('%d %b %Y')} • {time_str}"

    items_data = []
    items_total = 0.0
    total_mrp = 0.0

    for order_item in order.items.select_related("product").all():
        product = order_item.product
        variant = ProductVariant.objects.filter(product=product, unit_value=order_item.weight).first() or product.variants.first()

        selling_price_val = float(order_item.unit_price)
        mrp_val = float(variant.mrp_price) if (variant and variant.mrp_price) else selling_price_val
        item_total_val = round(selling_price_val * order_item.quantity, 2)
        mrp_total_val = round(mrp_val * order_item.quantity, 2)

        items_total += item_total_val
        total_mrp += mrp_total_val

        image_url = ""
        if product.product_img:
            image_url = request.build_absolute_uri(product.product_img.url) if request else product.product_img.url

        items_data.append({
            "product_id": product.id,
            "variant_id": variant.id if variant else 0,
            "name_en": product.name,
            "name_ta": product.tamil_name or product.name,
            "unit_label": order_item.weight,
            "selling_price": selling_price_val,
            "mrp": mrp_val,
            "qty": order_item.quantity,
            "item_total": item_total_val,
            "image_url": image_url
        })

    items_total = round(items_total, 2)
    total_mrp = round(total_mrp, 2)
    total_savings = round(max(0.0, total_mrp - items_total), 2)
    delivery_fee = float(order.delivery_charge) if order.delivery_charge else 0.0
    handling_fee = 5.0
    total_paid = float(order.total_amount)

    delivery_slot = None
    if order.delivery_slot:
        slot = order.delivery_slot
        start_str = slot.start_time.strftime("%I:%M %p") if slot.start_time else ""
        end_str = slot.end_time.strftime("%I:%M %p") if slot.end_time else ""
        delivery_slot = f"Scheduled Slot: {start_str} - {end_str}"

    delivery_address = None
    if order.address:
        addr = order.address
        address_parts = [addr.house_flat_no, addr.apartment_name, addr.address_line1, addr.address_line2]
        address_line_str = ", ".join([part for part in address_parts if part])

        delivery_address = {
            "id": addr.id,
            "contact_name": addr.name,
            "contact_phone": addr.mobile,
            "address_type": (addr.category or "Home").capitalize(),
            "address_line": address_line_str or addr.address_line1 or "",
            "city": addr.city or "Chennai",
            "pincode": addr.pincode or "",
            "latitude": float(addr.latitude) if addr.latitude else None,
            "longitude": float(addr.longitude) if addr.longitude else None,
        }

    invoice_url = None

    txn = Transaction.objects.filter(order=order).last()
    transaction_id = txn.payment_id if txn else None
    payment_method = "Online Payment" if order.payment_status else None

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "order_status": order.status.lower().replace(" ", "_"),
        "placed_at": placed_at,
        "delivery_mode": order.delivery_mode.lower(),
        "delivery_slot": delivery_slot,
        "invoice_url": invoice_url,
        "items": items_data,
        "bill_summary": {
            "items_total": items_total,
            "total_mrp": total_mrp,
            "total_savings": total_savings,
            "delivery_fee": delivery_fee,
            "handling_fee": handling_fee,
            "coupon_discount": 0.0,
            "total_paid": total_paid,
            "payment_status": order.payment_status,
            "payment_method": payment_method,
            "transaction_id": transaction_id
        },
        "delivery_address": delivery_address
    }


def reorder_order(user, order_id):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    order = Order.objects.filter(id=order_id, user=profile).first()
    if not order:
        raise serializers.ValidationError(f"Order not found with ID {order_id}.")

    active_cart = get_or_create_active_cart(user)

    for order_item in order.items.all():
        product = order_item.product
        variant = ProductVariant.objects.filter(product=product, unit_value=order_item.weight).first() or product.variants.first()
        weight_val = float(variant.weight_in_grams) if variant else 1000.0
        selling_price = float(variant.selling_price) if variant else float(order_item.unit_price)

        cart_item = CartItems.objects.filter(cart=active_cart, product=product).first()
        if not cart_item:
            CartItems.objects.create(
                cart=active_cart,
                product=product,
                weight=weight_val,
                quantity=order_item.quantity,
                unit_price=selling_price,
                total_price=round(selling_price * order_item.quantity, 2)
            )
        else:
            cart_item.quantity += order_item.quantity
            cart_item.total_price = round(cart_item.unit_price * cart_item.quantity, 2)
            cart_item.save()

    active_cart_items = CartItems.objects.filter(cart=active_cart, quantity__gt=0)
    cart_total = round(sum(item.total_price for item in active_cart_items), 2)
    active_cart.total_price = cart_total
    active_cart.save(update_fields=["total_price", "updated_at"])

    return {
        "cart_items_count": active_cart_items.count(),
        "cart_total": cart_total
    }
