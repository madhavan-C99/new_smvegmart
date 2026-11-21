import logging
from django.db.models import Count, Q
from adm.models.products import Product
from adm.models.category import Category
from biz.models.order_items import OrderItems

logger = logging.getLogger(__name__)


def format_variant(v):
    mrp = float(v.mrp_price)
    selling = float(v.selling_price)
    savings = round(mrp - selling, 2) if mrp > selling else 0.0
    if v.discount_percentage > 0:
        discount = v.discount_percentage
    elif mrp > selling and mrp > 0:
        discount = round(((mrp - selling) / mrp) * 100)
    else:
        discount = 0

    return {
        "variant_id": v.id,
        "unit_label": v.unit_value,
        "mrp": mrp,
        "selling_price": selling,
        "discount_percent": discount,
        "savings_amount": savings,
        "is_available": bool(v.is_available and v.stock_quantity > 0),
        "stock_qty": v.stock_quantity,
    }


def get_fresh_today_products(request=None, category_id=0, limit=12):
    logger.info(f"get_fresh_today_products_call | category_id={category_id} | limit={limit}")

    # 1. Category Pills list
    categories_list = []
    for cat in Category.objects.filter(is_active=True).order_by("id"):
        categories_list.append({
            "id": cat.id,
            "name": cat.name,
            "sort_order": cat.id
        })

    # 2. Fresh Today items
    fresh_products = Product.objects.filter(is_active=True, daily_vegetables=True)

    # 3. Category ID Filter
    if category_id:
        fresh_products = fresh_products.filter(category_id=category_id)

    # 4. Limit items (Home Page Carousel/Grid)
    fresh_today_products = fresh_products.select_related("category").prefetch_related("variants").order_by("id")
    if limit:
        fresh_today_products = fresh_today_products[:limit]

    # 5. Products list
    products_list = []
    for product in fresh_today_products:
        variants = list(product.variants.filter(is_available=True).order_by("weight_in_grams", "id"))
        if not variants:
            variants = list(product.variants.all().order_by("weight_in_grams", "id"))

        has_options = len(variants) > 1
        variants_data = [format_variant(v) for v in variants]

        total_stock = sum(v.stock_quantity for v in variants)
        in_stock = any(v.stock_quantity > 0 and v.is_available for v in variants)

        image_url = request.build_absolute_uri(product.product_img.url) if (product.product_img and request) else None

        products_list.append({
            "product_id": product.id,
            "category_id": product.category_id,
            "category_name": product.category.name,
            "sub_category_id": product.subcategory_id,
            "name_en": product.name,
            "name_ta": product.tamil_name or "",
            "in_stock": in_stock,
            "stock_qty": total_stock,
            "image_url": image_url,
            "has_options": has_options,
            "variants": variants_data,
        })

    logger.info(f"get_fresh_today_products_success | categories={len(categories_list)} | products={len(products_list)}")
    return {
        "categories": categories_list,
        "products": products_list
    }


def get_frequently_bought_products(request=None, limit=12):
    logger.info(f"get_frequently_bought_products_call | limit={limit}")

    # 1. Top 12 ordered product IDs
    ordered_product_ids = list(
        OrderItems.objects.values_list("product_id", flat=True)
        .annotate(order_count=Count("id"))
        .order_by("-order_count")[:limit]
    )

    # 2. Products query with fallback for new stores
    if ordered_product_ids:
        frequently_bought_products = Product.objects.filter(
            id__in=ordered_product_ids, 
            is_active=True
        )
    else:
        frequently_bought_products = Product.objects.filter(
            is_active=True
        ).order_by("id")[:limit]

    frequently_bought_products = frequently_bought_products.select_related("category").prefetch_related("variants")

    # 3. Format products list
    formatted_products = []
    for product in frequently_bought_products:
        variants = list(product.variants.filter(is_available=True).order_by("weight_in_grams", "id"))
        if not variants:
            variants = list(product.variants.all().order_by("weight_in_grams", "id"))

        has_options = len(variants) > 1
        variants_data = [format_variant(v) for v in variants]

        total_stock = sum(v.stock_quantity for v in variants)
        in_stock = any(v.stock_quantity > 0 and v.is_available for v in variants)

        image_url = request.build_absolute_uri(product.product_img.url) if (product.product_img and request) else None

        formatted_products.append({
            "product_id": product.id,
            "category_id": product.category_id,
            "category_name": product.category.name,
            "sub_category_id": product.subcategory_id,
            "name_en": product.name,
            "name_ta": product.tamil_name or "",
            "in_stock": in_stock,
            "stock_qty": total_stock,
            "image_url": image_url,
            "has_options": has_options,
            "variants": variants_data,
        })

    logger.info(f"get_frequently_bought_products_success | count={len(formatted_products)}")
    return formatted_products


def get_category_products(request=None, category_id=None, sub_category_id=None, page=1, limit=20):
    logger.info(f"get_category_products_call | cat={category_id} | sub={sub_category_id} | page={page} | limit={limit}")

    if not category_id:
        return {
            "data": [],
            "pagination": {
                "current_page": page,
                "total_pages": 0,
                "total_products": 0,
                "has_next": False
            }
        }

    category_products = Product.objects.filter(
        category_id=category_id,
        is_active=True
    ).select_related("category", "subcategory").prefetch_related("variants")

    # Optional filter: If sub_category_id is passed, filter products for that subcategory
    if sub_category_id:
        category_products = category_products.filter(subcategory_id=sub_category_id)

    category_products = category_products.order_by("id")

    # Pagination calculation
    total_products = category_products.count()
    total_pages = (total_products + limit - 1) // limit if total_products > 0 else 0
    has_next = page < total_pages

    # Database Query: LIMIT and OFFSET
    offset = (page - 1) * limit
    paged_products = category_products[offset : offset + limit]

    products_list = []
    for product in paged_products:
        variants = list(product.variants.filter(is_available=True).order_by("weight_in_grams", "id"))
        if not variants:
            variants = list(product.variants.all().order_by("weight_in_grams", "id"))

        has_options = len(variants) > 1
        variants_data = [format_variant(v) for v in variants]

        total_stock = sum(v.stock_quantity for v in variants)
        in_stock = any(v.stock_quantity > 0 and v.is_available for v in variants)

        # Converts ("/media/snap.jpg" -> "http://domain.com/media/snap.jpg")
        image_url = request.build_absolute_uri(product.product_img.url) if (product.product_img and request) else None

        products_list.append({
            "product_id": product.id,
            "category_id": product.category_id,
            "category_name": product.category.name,
            "sub_category_id": product.subcategory_id,
            "name_en": product.name,
            "name_ta": product.tamil_name or "",
            "in_stock": in_stock,
            "stock_qty": total_stock,
            "image_url": image_url,
            "has_options": has_options,
            "variants": variants_data,
        })

    logger.info(f"get_category_products_success | count={len(products_list)} | total={total_products}")
    return {
        "data": products_list,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_products": total_products,
            "has_next": has_next
        }
    }


def search_products_service(request=None, search_text="", limit=8):
    clean_text = search_text.strip()
    logger.info(f"search_products_call | search_text='{clean_text}' | limit={limit}")

    if not clean_text:
        return []

    # English Name, Tamil Name, Category, Subcategory search
    search_filter = (
        Q(name__icontains=clean_text) |
        Q(tamil_name__icontains=clean_text) |
        Q(category__name__icontains=clean_text) |
        Q(subcategory__name__icontains=clean_text)
    )

    matching_products = (
        Product.objects.filter(is_active=True)
        .filter(search_filter)
        .select_related("category", "subcategory")
        .prefetch_related("variants")
        .order_by("id")
    )

    products_to_show = matching_products[:limit]

    products_list = []
    for product in products_to_show:
        variants = list(product.variants.filter(is_available=True).order_by("weight_in_grams", "id"))
        if not variants:
            variants = list(product.variants.all().order_by("weight_in_grams", "id"))

        has_options = len(variants) > 1
        variants_data = [format_variant(v) for v in variants]
        total_stock = sum(v.stock_quantity for v in variants)
        in_stock = any(v.stock_quantity > 0 and v.is_available for v in variants)

        image_url = request.build_absolute_uri(product.product_img.url) if (product.product_img and request) else None

        products_list.append({
            "product_id": product.id,
            "product_name": product.name,
            "name_en": product.name,
            "name_ta": product.tamil_name or "",
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else "",
            "sub_category_id": product.subcategory_id,
            "image_url": image_url,
            "in_stock": in_stock,
            "stock_qty": total_stock,
            "has_options": has_options,
            "variants": variants_data,
        })

    logger.info(f"search_products_success | search_text='{clean_text}' | count={len(products_list)}")
    return products_list

