import logging
import json
import re
from django.db import connection
from django.db.models import Q
from rest_framework.exceptions import APIException, ValidationError
from ..models.products import Product
from ..models.product_variants import ProductVariant
from ..models.category import Category, SubCategory
from adm.utils.time_utils import format_12h_datetime
from .reminder_service import broadcast_reminders_data
from ..tasks import trendtask


logger = logging.getLogger('django')


def sync_table_sequence(table_name='adm_product', pk_col='id'):
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table_name}', '{pk_col}'),
                    COALESCE((SELECT MAX({pk_col}) FROM {table_name}), 1)
                );
            """)
    except Exception as e:
        logger.warning(f"Could not synchronize sequence for table {table_name}: {e}")


def notify_product_subscribers():
    try:
        trendtask.fetch_all_product_task.call_local()
    except Exception as e:
        logger.warning(f"Could not notify product subscribers: {e}")

    try:
        broadcast_reminders_data()
    except Exception as e:
        logger.warning(f"Could not notify reminder subscribers: {e}")




def fetch_all_products(search=None, category_id=None, subcategory_id=None, is_active=None, request=None):
    """
    Fetches all products with category, subcategory, and variant details.
    Supports filtering by search query, category, subcategory, and visibility.
    """
    try:
        sync_table_sequence('adm_product', 'id')
        sync_table_sequence('adm_product_variants', 'id')

        queryset = (
            Product.objects.select_related('category', 'subcategory')
            .prefetch_related('variants')
            .all()
            .order_by('-id')
        )

        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(tamil_name__icontains=search) | 
                Q(description__icontains=search)
            )

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        product_list = []
        for index, prod in enumerate(queryset, start=1):
            image_url = request.build_absolute_uri(prod.product_img.url) if (prod.product_img and request) else (prod.product_img.url if prod.product_img else None)

            # Map all variants for this product
            variants_data = []
            for v in prod.variants.all():
                variants_data.append({
                    "id": v.id,
                    "weight": v.unit_value or f"{v.weight_in_grams}g",
                    "price": f"₹{v.selling_price}",
                    "mrp": f"₹{v.mrp_price}",
                    "discount": v.discount_percentage,
                    "stock": "Out of Stock" if (v.stock_quantity is not None and v.stock_quantity <= 0) else f"({v.stock_quantity} In stock)",
                    "stock_quantity": v.stock_quantity,
                    "is_available": v.is_available,
                })

            product_list.append({
                "id": prod.id,
                "s_no": f"{index}",
                "name": prod.name,
                "tamil_name": prod.tamil_name or "",
                "description": prod.description or "",
                "category_id": prod.category.id if prod.category else None,
                "category_name": prod.category.name if prod.category else "Uncategorized",
                "subcategory_id": prod.subcategory.id if prod.subcategory else None,
                "subcategory_name": prod.subcategory.name if prod.subcategory else "General",
                "image": image_url,
                "daily_vegetables": getattr(prod, 'daily_vegetables', False),
                "status": "Active" if prod.is_active else "Inactive",
                "visibility": prod.is_active,
                "variants": variants_data,
                "created_at": format_12h_datetime(prod.created_at) if prod.created_at else None,
            })


        return {
            "products": product_list,
            "total_count": len(product_list),
        }

    except Exception as e:
        logger.error(f"Error in fetch_all_products: {str(e)}", exc_info=True)
        raise APIException(str(e))


def fetch_one_product(request=None, **data):
    """
    Fetches single product details by ID.
    """
    try:
        prod_id = data.get('id')
        if not prod_id:
            raise ValidationError("Product ID is required.")

        prod = Product.objects.filter(id=prod_id).first()
        if not prod:
            raise ValidationError("Product not found.")

        variants_data = [
            {
                "id": v.id,
                "weight": v.unit_value,
                "price": f"₹{v.selling_price}",
                "mrp": f"₹{v.mrp_price}",
                "discount": v.discount_percentage,
                "stock": "Out of Stock" if (v.stock_quantity is not None and v.stock_quantity <= 0) else f"({v.stock_quantity} In stock)",
                "stock_quantity": v.stock_quantity,
                "is_available": v.is_available,
            }
            for v in prod.variants.all()
        ]

        image_url = request.build_absolute_uri(prod.product_img.url) if (prod.product_img and request) else (prod.product_img.url if prod.product_img else None)

        return {
            "id": prod.id,
            "name": prod.name,
            "tamil_name": prod.tamil_name or "",
            "description": prod.description or "",
            "category_id": prod.category.id if prod.category else None,
            "category_name": prod.category.name if prod.category else "",
            "subcategory_id": prod.subcategory.id if prod.subcategory else None,
            "subcategory_name": prod.subcategory.name if prod.subcategory else "",
            "image": image_url,
            "daily_vegetables": getattr(prod, 'daily_vegetables', False),
            "status": "Active" if prod.is_active else "Inactive",
            "visibility": prod.is_active,
            "variants": variants_data,
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in fetch_one_product: {str(e)}", exc_info=True)
        raise APIException(str(e))


def toggle_product_status(**data):
    """
    Toggles product is_active status.
    """
    try:
        prod_id = data.get('id')
        is_active = data.get('is_active')
        if prod_id is None:
            raise ValidationError("Product ID is required.")

        prod = Product.objects.filter(id=prod_id).first()
        if not prod:
            raise ValidationError("Product not found.")

        prod.is_active = is_active if is_active is not None else not prod.is_active
        prod.save()

        if prod.is_active:
            if prod.subcategory and not prod.subcategory.is_active:
                prod.subcategory.is_active = True
                prod.subcategory.save()
            if prod.category and not prod.category.is_active:
                prod.category.is_active = True
                prod.category.save()
        notify_product_subscribers()
        return {"id": prod.id, "is_active": prod.is_active}

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in toggle_product_status: {str(e)}", exc_info=True)
        raise APIException(str(e))


def toggle_daily_vegetables(**data):
    """
    Toggles product daily_vegetables flag.
    """
    try:
        prod_id = data.get('id')
        daily_vegetables = data.get('daily_vegetables')
        if prod_id is None:
            raise ValidationError("Product ID is required.")

        prod = Product.objects.filter(id=prod_id).first()
        if not prod:
            raise ValidationError("Product not found.")

        prod.daily_vegetables = daily_vegetables if daily_vegetables is not None else not prod.daily_vegetables
        prod.save()
        notify_product_subscribers()
        return {"id": prod.id, "daily_vegetables": prod.daily_vegetables}

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in toggle_daily_vegetables: {str(e)}", exc_info=True)
        raise APIException(str(e))


def delete_product(**data):
    """
    Soft-deletes a product.
    """
    try:
        prod_id = data.get('id')
        if not prod_id:
            raise ValidationError("Product ID is required.")

        prod = Product.objects.filter(id=prod_id).first()
        if not prod:
            raise ValidationError("Product not found.")

        if hasattr(prod, 'save_delete'):
            prod.save_delete()
        else:
            prod.delete()

        notify_product_subscribers()
        return {"message": "Product deleted successfully", "id": prod_id}

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in delete_product: {str(e)}", exc_info=True)
        raise APIException(str(e))


def parse_weight_in_grams(val):
    if not val:
        return 1000
    try:
        s = str(val).lower().strip()
        match = re.search(r'([\d.]+)', s)
        if not match:
            return 1000
        num = float(match.group(1))
        # Match kg or ltr (1 kg = 1000g, 1 ltr = 1000ml)
        if re.search(r'\b(kg|kgs|kilogram|kilograms|ltr|liter|litres|litre)\b', s) or re.search(r'(?:\d|\s)(kg|ltr)(?:\s|$)', s):
            return int(num * 1000)
        return int(num)
    except Exception:
        return 1000


def create_product(created_by="admin", **data):
    """
    Creates a new product with one base variant.
    """
    try:
        name = (data.get('name') or "").strip()
        if not name:
            raise ValidationError("Product Name is required.")

        category_id = data.get('category_id')
        subcategory_id = data.get('subcategory_id')

        cat = Category.objects.filter(id=category_id).first() if category_id else None
        sub = SubCategory.objects.filter(id=subcategory_id).first() if subcategory_id else None

        sync_table_sequence('adm_products', 'id')

        product = Product.objects.create(
            name=name,
            tamil_name=(data.get('tamil_name') or "").strip(),
            description=(data.get('description') or "").strip(),
            product_img=data.get('product_img'),
            category=cat,
            subcategory=sub,
            is_active=data.get('is_active', True),
            daily_vegetables=data.get('daily_vegetables', False),
            created_by=created_by or "admin",
            updated_by=created_by or "admin",
        )

        variants_data = data.get('variants')
        if isinstance(variants_data, str):
            try:
                variants_data = json.loads(variants_data)
            except Exception:
                variants_data = None

        if variants_data and isinstance(variants_data, list):
            sync_table_sequence('adm_product_variants', 'id')
            for v_item in variants_data:
                uv = v_item.get('unit_value') or v_item.get('weight')
                sp = v_item.get('selling_price') or v_item.get('price')
                if isinstance(sp, str):
                    sp = sp.replace('₹', '').strip()
                mp = v_item.get('mrp_price') or sp
                disc = v_item.get('discount') if v_item.get('discount') is not None else v_item.get('discount_percentage', 0)
                sq = int(v_item.get('stock_quantity') or v_item.get('stock') or 0)
                if uv and sp:
                    ProductVariant.objects.create(
                        product=product,
                        unit_value=str(uv),
                        weight_in_grams=parse_weight_in_grams(uv),
                        selling_price=sp,
                        mrp_price=mp,
                        discount_percentage=int(disc or 0),
                        stock_quantity=sq,
                        is_available=sq > 0,
                        created_by=created_by or "admin",
                        updated_by=created_by or "admin",
                    )
        else:
            unit_value = data.get('unit_value') or data.get('weight')
            selling_price = data.get('selling_price') or data.get('price')
            mrp_price = data.get('mrp_price') or selling_price
            discount = data.get('discount') if data.get('discount') is not None else data.get('discount_percentage', 0)
            raw_stock = data.get('stock_quantity') if data.get('stock_quantity') is not None else data.get('stock')
            stock_quantity = int(raw_stock or 0)

            if unit_value and selling_price is not None:
                sync_table_sequence('adm_product_variants', 'id')
                ProductVariant.objects.create(
                    product=product,
                    unit_value=str(unit_value),
                    weight_in_grams=parse_weight_in_grams(unit_value),
                    selling_price=selling_price,
                    mrp_price=mrp_price,
                    discount_percentage=int(discount or 0),
                    stock_quantity=stock_quantity,
                    is_available=stock_quantity > 0,
                    created_by=created_by or "admin",
                    updated_by=created_by or "admin",
                )

        notify_product_subscribers()
        return {"id": product.id, "name": product.name, "message": f"Product '{product.name}' created successfully."}

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in create_product: {str(e)}", exc_info=True)
        raise APIException(str(e))


def update_product(updated_by="admin", **data):
    """
    Updates an existing product and its variant.
    """
    try:
        prod_id = data.get('id')
        if not prod_id:
            raise ValidationError("Product ID is required.")

        prod = Product.objects.filter(id=prod_id).first()
        if not prod:
            raise ValidationError("Product not found.")

        if data.get('name'):
            prod.name = data['name'].strip()
        if 'tamil_name' in data:
            prod.tamil_name = (data.get('tamil_name') or "").strip()
        if 'description' in data:
            prod.description = (data.get('description') or "").strip()
        if data.get('product_img'):
            prod.product_img = data['product_img']
        if 'is_active' in data:
            val = data['is_active']
            if isinstance(val, str):
                prod.is_active = val.lower() in ('true', '1', 'yes')
            else:
                prod.is_active = bool(val)
        if 'daily_vegetables' in data:
            val_dv = data['daily_vegetables']
            if isinstance(val_dv, str):
                prod.daily_vegetables = val_dv.lower() in ('true', '1', 'yes')
            else:
                prod.daily_vegetables = bool(val_dv)

        if data.get('category_id'):
            cat = Category.objects.filter(id=data['category_id']).first()
            if cat:
                prod.category = cat

        if data.get('subcategory_id'):
            sub = SubCategory.objects.filter(id=data['subcategory_id']).first()
            if sub:
                prod.subcategory = sub

        prod.updated_by = updated_by or "admin"
        prod.save()

        if prod.is_active:
            if prod.subcategory and not prod.subcategory.is_active:
                prod.subcategory.is_active = True
                prod.subcategory.save()
            if prod.category and not prod.category.is_active:
                prod.category.is_active = True
                prod.category.save()

        # Update or create variants
        variants_data = data.get('variants')
        if isinstance(variants_data, str):
            try:
                variants_data = json.loads(variants_data)
            except Exception:
                variants_data = None

        if variants_data and isinstance(variants_data, list):
            sync_table_sequence('adm_product_variants', 'id')
            existing_variants = list(prod.variants.all())
            for idx, v_item in enumerate(variants_data):
                uv = v_item.get('unit_value') or v_item.get('weight')
                sp = v_item.get('selling_price') or v_item.get('price')
                if isinstance(sp, str):
                    sp = sp.replace('₹', '').strip()
                mp = v_item.get('mrp_price') or sp
                disc = v_item.get('discount') if v_item.get('discount') is not None else v_item.get('discount_percentage', 0)
                sq = int(v_item.get('stock_quantity') or v_item.get('stock') or 0)
                if not uv or not sp:
                    continue
                if idx < len(existing_variants):
                    v = existing_variants[idx]
                    v.unit_value = str(uv)
                    v.weight_in_grams = parse_weight_in_grams(uv)
                    v.selling_price = sp
                    v.mrp_price = mp
                    v.discount_percentage = int(disc or 0)
                    v.stock_quantity = sq
                    v.is_available = sq > 0
                    v.updated_by = updated_by or "admin"
                    v.save()
                else:
                    ProductVariant.objects.create(
                        product=prod,
                        unit_value=str(uv),
                        weight_in_grams=parse_weight_in_grams(uv),
                        selling_price=sp,
                        mrp_price=mp,
                        discount_percentage=int(disc or 0),
                        stock_quantity=sq,
                        is_available=sq > 0,
                        created_by=updated_by or "admin",
                        updated_by=updated_by or "admin",
                    )
            if len(existing_variants) > len(variants_data):
                for v in existing_variants[len(variants_data):]:
                    v.delete()
        else:
            unit_value = data.get('unit_value') or data.get('weight')
            selling_price = data.get('selling_price') or data.get('price')
            mrp_price = data.get('mrp_price') or selling_price
            stock_quantity = data.get('stock_quantity')
            discount = data.get('discount') if data.get('discount') is not None else data.get('discount_percentage')

            if unit_value or selling_price is not None or stock_quantity is not None or discount is not None:
                variant = prod.variants.first()
                if not variant:
                    sync_table_sequence('adm_product_variants', 'id')
                    variant = ProductVariant(
                        product=prod,
                        unit_value=str(unit_value or "1kg"),
                        weight_in_grams=parse_weight_in_grams(unit_value),
                        selling_price=selling_price or 0,
                        mrp_price=mrp_price or selling_price or 0,
                        discount_percentage=int(discount or 0),
                        stock_quantity=int(stock_quantity or 0),
                        is_available=int(stock_quantity or 0) > 0,
                        created_by=updated_by or "admin",
                        updated_by=updated_by or "admin"
                    )
                    variant.save()
                else:
                    if unit_value:
                        variant.unit_value = str(unit_value)
                        variant.weight_in_grams = parse_weight_in_grams(unit_value)
                    if selling_price is not None:
                        variant.selling_price = selling_price
                        variant.mrp_price = mrp_price or selling_price
                    if discount is not None:
                        variant.discount_percentage = int(discount or 0)
                    if stock_quantity is not None:
                        qty = int(stock_quantity)
                        variant.stock_quantity = qty
                        variant.is_available = qty > 0
                    variant.updated_by = updated_by or "admin"
                    variant.save()

        notify_product_subscribers()
        return {"id": prod.id, "name": prod.name, "message": f"Product '{prod.name}' updated successfully."}

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in update_product: {str(e)}", exc_info=True)
        raise APIException(str(e))
