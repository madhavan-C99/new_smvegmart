import logging
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from huey.contrib.djhuey import task
from ..models.products import Product
from adm.utils.time_utils import format_12h_datetime


logger = logging.getLogger('django')


def get_all_products_orm():
    """
    Fetches all products using Django ORM and formats them for the UI table columns.
    """
    queryset = (
        Product.objects.select_related('category', 'subcategory')
        .prefetch_related('variants')
        .all()
        .order_by('name')
    )
    product_data = []
    for index, p in enumerate(queryset, start=1):
        img_url = None
        if p.product_img:
            try:
                img_url = p.product_img.url
            except Exception:
                img_url = str(p.product_img)

            if getattr(settings, 'CLOUD_FRONT_URL', None) and not img_url.startswith('http'):
                img_url = f"{settings.CLOUD_FRONT_URL.rstrip('/')}/{img_url.lstrip('/')}"

        variants_data = []
        for v in p.variants.all():
            stock_qty = v.stock_quantity if v.stock_quantity is not None else 0
            variants_data.append({
                "id": v.id,
                "weight": v.unit_value or (f"{v.weight_in_grams}g" if v.weight_in_grams else ""),
                "price": f"₹{v.selling_price}" if v.selling_price is not None else "",
                "mrp": f"₹{v.mrp_price}" if v.mrp_price is not None else "",
                "discount": v.discount_percentage or 0,
                "stock": "Out of Stock" if stock_qty <= 0 else f"({stock_qty} In stock)",
                "stock_quantity": stock_qty,
                "is_available": v.is_available,
            })

        if not variants_data:
            stock_qty = getattr(p, 'stock', None) or 0
            unit_val = f"{getattr(p, 'weight', '')} {getattr(p, 'unit', '')}".strip() or "1 unit"
            price_val = getattr(p, 'price', None)
            variants_data.append({
                "id": None,
                "weight": unit_val,
                "price": f"₹{price_val}" if price_val is not None else "₹0",
                "mrp": f"₹{price_val}" if price_val is not None else "₹0",
                "discount": 0,
                "stock": "Out of Stock" if stock_qty <= 0 else f"({stock_qty} In stock)",
                "stock_quantity": stock_qty,
                "is_available": p.is_active,
            })

        first_var = variants_data[0]

        product_data.append({
            "s_no": index,
            "id": p.id,
            "name": p.name,
            "tamil_name": p.tamil_name or "",
            "description": p.description or "",
            "product_img": img_url,
            "image": img_url,
            "category_id": p.category.id if p.category else None,
            "category_name": p.category.name if p.category else "Uncategorized",
            "subcategory_id": p.subcategory.id if p.subcategory else None,
            "subcategory_name": p.subcategory.name if p.subcategory else "General",
            "subcategory": p.subcategory.name if p.subcategory else "General",
            "daily_vegetables": getattr(p, 'daily_vegetables', False),
            "status": "Active" if p.is_active else "Inactive",
            "visibility": p.is_active,
            "variants": variants_data,
            "price": first_var["price"],
            "weight": first_var["weight"],
            "unit": first_var["weight"],
            "stock": first_var["stock"],
            "current_trending_status": getattr(p, 'current_trending_status', False),
            "created_at": p.created_at.strftime("%d-%m-%Y %I:%M %p") if p.created_at else None,
        })
    return product_data


@task()
def fetch_all_product_task():
    try:
        product_data = get_all_products_orm()
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    "fetch_all_product_group", 
                    {
                        "type": "send_all_product_data", 
                        "data": product_data
                    }
                )
            except Exception as layer_err:
                logger.warning(f"Could not broadcast via channel layer: {layer_err}")
        return product_data
    except Exception as e:
        logger.error(f"Error in fetch_all_product_task: {str(e)}", exc_info=True)
        return []