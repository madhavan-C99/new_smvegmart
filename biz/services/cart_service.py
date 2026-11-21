import logging
from rest_framework import serializers

from adm.models.customer_profile import CustomerProfile
from adm.models.products import Product
from adm.models.product_variants import ProductVariant
from biz.models.cart import Cart
from biz.models.cart_items import CartItems

logger = logging.getLogger(__name__)


def get_or_create_active_cart(user):
    profile = CustomerProfile.objects.filter(user=user).first()
    if not profile:
        raise serializers.ValidationError("Customer profile not found.")

    cart = Cart.objects.filter(user=profile, is_ordered=False).first()
    if not cart:
        cart = Cart.objects.create(user=profile, total_price=0.0)

    return cart


def get_cart_details(request, user):
    logger.info(f"get_cart_details_call | user_id={user.id}")

    cart = get_or_create_active_cart(user)
    cart_items = CartItems.objects.filter(cart=cart, quantity__gt=0).select_related("product").order_by("id")

    items_list = []
    items_total = 0.0
    total_mrp = 0.0
    total_qty = 0

    for item in cart_items:
        product = item.product

        # Resolve Variant by matching weight or fallback to first available
        variant = product.variants.filter(weight_in_grams=item.weight, is_available=True).first()
        if not variant:
            variant = product.variants.filter(weight_in_grams=item.weight).first()
        if not variant:
            variant = product.variants.filter(is_available=True).order_by("weight_in_grams", "id").first() or product.variants.first()

        selling_price = float(item.unit_price) if item.unit_price else (float(variant.selling_price) if variant else 0.0)
        mrp = float(variant.mrp_price) if (variant and variant.mrp_price) else selling_price
        unit_label = variant.unit_value if variant else f"{item.weight} g"

        item_total = round(selling_price * item.quantity, 2)
        items_total += item_total
        total_mrp += round(mrp * item.quantity, 2)
        total_qty += item.quantity

        image_url = request.build_absolute_uri(product.product_img.url) if (product.product_img and request) else None

        items_list.append({
            "product_id": product.id,
            "variant_id": variant.id if variant else None,
            "name_en": product.name,
            "name_ta": product.tamil_name or "",
            "unit_label": unit_label,
            "selling_price": selling_price,
            "mrp": mrp,
            "qty": item.quantity,
            "item_total": item_total,
            "image_url": image_url
        })

    # Bill Summary
    delivery_fee = 25.0 if total_qty > 0 else 0.0
    handling_fee = 5.0 if total_qty > 0 else 0.0

    total_savings = round(total_mrp - items_total, 2) if total_mrp > items_total else 0.0
    to_pay = round(items_total + delivery_fee + handling_fee, 2) if total_qty > 0 else 0.0

    # Cart total_price Update
    cart.total_price = to_pay
    cart.save(update_fields=["total_price"])

    logger.info(f"get_cart_details_success | user_id={user.id} | items={len(items_list)} | to_pay={to_pay}")

    return {
        "summary": {
            "total_items": total_qty,
            "items_total": round(items_total, 2),
            "total_mrp": round(total_mrp, 2),
            "total_savings": total_savings,
            "delivery_fee": delivery_fee,
            "handling_fee": handling_fee,
            "to_pay": to_pay
        },
        "items": items_list
    }


def update_cart_item(request, user, product_id, qty, variant_id=None):
    logger.info(f"update_cart_item_call | user_id={user.id} | product_id={product_id} | variant_id={variant_id} | qty={qty}")

    # 1. Product check
    product = Product.objects.filter(id=product_id, is_active=True).first()
    if not product:
        raise serializers.ValidationError(f"Product with id {product_id} not found.")

    cart = get_or_create_active_cart(user)

    # 2. Resolve Variant
    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id, product=product).first()
    if not variant:
        variant = product.variants.filter(is_available=True).order_by("weight_in_grams", "id").first() or product.variants.first()

    selling_price = float(variant.selling_price) if variant else 0.0
    weight = float(variant.weight_in_grams) if variant else 1000.0

    # 3. Match Cart Item by product and weight
    cart_item = CartItems.objects.filter(cart=cart, product=product, weight=weight).first()
    if not cart_item:
        cart_item = CartItems.objects.filter(cart=cart, product=product).first()

    # 4. Remove if qty <= 0 using QuerySet delete (bypasses SafeDeleteModel.delete() no-op)
    if qty <= 0:
        if cart_item:
            CartItems.objects.filter(id=cart_item.id).delete()
        else:
            CartItems.objects.filter(cart=cart, product=product).delete()
        logger.info(f"cart_item_removed | product_id={product_id} | variant_id={variant_id}")
    else:
        # 5. Add or Update
        if not cart_item:
            CartItems.objects.create(
                cart=cart,
                product=product,
                weight=weight,
                unit_price=selling_price,
                quantity=qty,
                total_price=round(selling_price * qty, 2)
            )
            logger.info(f"cart_item_created | product_id={product_id} | variant_id={variant_id} | qty={qty}")
        else:
            cart_item.quantity = qty
            cart_item.weight = weight
            cart_item.unit_price = selling_price
            cart_item.total_price = round(selling_price * qty, 2)
            cart_item.save()
            logger.info(f"cart_item_updated | product_id={product_id} | variant_id={variant_id} | qty={qty}")

    return get_cart_details(request, user)
