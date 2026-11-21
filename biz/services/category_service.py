import logging
from django.utils.text import slugify
from adm.models.category import Category, SubCategory
from adm.models.products import Product

logger = logging.getLogger(__name__)


def get_all_categories(request=None):
    logger.info("get_all_categories_call")

    categories = Category.objects.filter(is_active=True).order_by("id")

    categories_list = []
    for cat in categories:
        # Converts ("Dairy Product" -> "dairy-product")
        slug = slugify(cat.name)

        # Converts ("/media/veg.jpg" -> "http://127.0.0.1:8000/media/veg.jpg")
        image_url = request.build_absolute_uri(cat.category_img.url) if (cat.category_img and request) else None

        categories_list.append({
            "id": cat.id,
            "name": cat.name,
            "icon_url": image_url,
            "image_url": image_url,
            "sort_order": cat.id
        })

    logger.info(f"get_all_categories_success | count={len(categories_list)}")
    return categories_list


def get_sub_categories(request=None, category_id=None):
    logger.info(f"get_sub_categories_call | category_id={category_id}")

    if not category_id:
        return []

    subcategories = SubCategory.objects.filter(
        category_id=category_id,
        is_active=True
    ).order_by("id")

    sub_list = []
    for sub in subcategories:
        # Counts active products under this subcategory
        product_count = Product.objects.filter(subcategory=sub, is_active=True).count()

        # Converts ("/media/sub.png" -> "http://domain.com/media/sub.png")
        image_url = request.build_absolute_uri(sub.subcategory_img.url) if (sub.subcategory_img and request) else None

        sub_list.append({
            "id": sub.id,
            "category_id": sub.category_id,
            "name": sub.name,
            "image_url": image_url,
            "product_count": product_count,
            "sort_order": sub.id
        })

    logger.info(f"get_sub_categories_success | count={len(sub_list)}")
    return sub_list
