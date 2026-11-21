import logging
from django.db import connection, IntegrityError
from django.db.models import Q, F, Max
from rest_framework.exceptions import APIException, ValidationError
from ..models.category import Category, SubCategory
from ..models.products import Product
from adm.utils.time_utils import format_12h_datetime


logger = logging.getLogger('django')


def sync_table_sequence(table_name='adm_category', pk_col='id'):
    """
    Synchronizes PostgreSQL's auto-increment sequence with the maximum existing ID.
    This prevents 'duplicate key value violates unique constraint' errors when records
    were previously inserted with manual/hardcoded IDs.
    """
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


def resequence_category_orders():
    """
    Ensures all categories have clean, consecutive display_order values (1, 2, 3, ...),
    resolving any duplicates or gaps.
    """
    try:
        categories = Category.objects.all().order_by('display_order', 'id')
        for index, cat in enumerate(categories, start=1):
            if cat.display_order != index:
                Category.objects.filter(id=cat.id).update(display_order=index)
    except Exception as e:
        logger.warning(f"Could not resequence category display orders: {e}")


def fetch_all_categories(search=None, is_active=None, request=None):
    """
    Fetches all categories along with real-time KPI metrics for the Category Management dashboard.
    Supports optional search filtering (by name or description) and status filtering.
    Categories are ordered by display_order ascending, then id.
    """
    try:
        # Preemptively clean sequences and ensure unique consecutive ordering
        sync_table_sequence('adm_category', 'id')
        resequence_category_orders()

        all_categories = Category.objects.all().order_by('display_order', 'id')
        
        # 1. Total counts for KPI cards (based on full catalog)
        total_categories = all_categories.count()
        active_categories = all_categories.filter(is_active=True).count()
        inactive_categories = all_categories.filter(is_active=False).count()
        published_percent = (
            round((active_categories / total_categories) * 100, 1)
            if total_categories > 0 else 0.0
        )
        total_skus = Product.objects.count()

        # 2. Apply query filters if provided
        filtered = all_categories
        if search:
            search = search.strip()
            filtered = filtered.filter(Q(name__icontains=search) | Q(description__icontains=search))

        if is_active is not None:
            filtered = filtered.filter(is_active=is_active)

        # 3. Serialize category rows for the table
        category_list = []
        for index, cat in enumerate(filtered, start=1):
            skus_count = Product.objects.filter(category=cat).count()
            image_url = request.build_absolute_uri(cat.category_img.url) if (cat.category_img and request) else (cat.category_img.url if cat.category_img else None)

            category_list.append({
                "id": cat.id,
                "s_no": f"{index:02d}",
                "name": cat.name,
                "description": cat.description or "",
                "display_order": getattr(cat, 'display_order', 1) or 1,
                "image": image_url,
                "status": "Active" if cat.is_active else "Inactive",
                "visibility": cat.is_active,
                "skus_count": skus_count,
                "created_at": format_12h_datetime(cat.created_at) if cat.created_at else None,
            })


        return {
            "categories": category_list,
            "metrics": {
                "total_categories": total_categories,
                "active_categories": active_categories,
                "inactive_categories": inactive_categories,
                "published_percent": published_percent,
                "total_skus": total_skus
            }
        }

    except Exception as e:
        logger.error(f"Error in fetch_all_categories: {str(e)}", exc_info=True)
        raise APIException(str(e))


def fetch_one_category(request=None, **data):
    """
    Fetches details of a single category by ID.
    """
    try:
        cat_id = data.get('id')
        if not cat_id:
            raise ValidationError("Category ID is required.")

        cat = Category.objects.filter(id=cat_id).first()
        if not cat:
            raise ValidationError("Category not found.")

        image_url = request.build_absolute_uri(cat.category_img.url) if (cat.category_img and request) else (cat.category_img.url if cat.category_img else None)

        return {
            "id": cat.id,
            "name": cat.name,
            "description": cat.description or "",
            "display_order": getattr(cat, 'display_order', 1) or 1,
            "image": image_url,
            "is_active": cat.is_active,
            "status": "Active" if cat.is_active else "Inactive",
            "visibility": cat.is_active,
            "skus_count": Product.objects.filter(category=cat).count()
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in fetch_one_category: {str(e)}", exc_info=True)
        raise APIException(str(e))


def create_category(created_by="admin", **data):
    """
    Creates a new category with duplicate validation and optional image upload.
    If no display_order is specified, it defaults to the last position.
    If an existing priority order is chosen, existing items shift accordingly.
    Safely recovers if PostgreSQL sequence is out of sync with existing records.
    """
    try:
        name = (data.get('name') or "").strip()
        if not name:
            raise ValidationError("Category Name is required.")

        # Check for duplicate category name
        if Category.objects.filter(name__iexact=name).exists():
            raise ValidationError(f"Category with name '{name}' already exists.")

        description = (data.get('description') or "").strip()
        category_img = data.get('category_img')
        is_active = data.get('is_active', True)
        
        # Calculate display_order: default priority order goes at the last!
        raw_order = data.get('display_order')
        max_order = Category.objects.aggregate(Max('display_order'))['display_order__max'] or 0
        total_count = Category.objects.count()

        if raw_order is None or str(raw_order).strip() == "" or int(raw_order) <= 0:
            display_order = max(max_order, total_count) + 1
        else:
            display_order = int(raw_order)
            # Shift existing categories at or above this priority order up by 1
            Category.objects.filter(display_order__gte=display_order).update(
                display_order=F('display_order') + 1
            )

        sync_table_sequence('adm_category', 'id')

        try:
            category = Category.objects.create(
                name=name,
                description=description,
                category_img=category_img,
                display_order=display_order,
                is_active=is_active,
                created_by=created_by or "admin",
                updated_by=created_by or "admin"
            )
        except IntegrityError as ie:
            # If duplicate key constraint was hit, resync sequence and retry
            if 'duplicate key' in str(ie).lower() or 'pkey' in str(ie).lower():
                logger.warning("adm_category primary key collision detected. Resyncing sequence and retrying...")
                sync_table_sequence('adm_category', 'id')
                category = Category.objects.create(
                    name=name,
                    description=description,
                    category_img=category_img,
                    display_order=display_order,
                    is_active=is_active,
                    created_by=created_by or "admin",
                    updated_by=created_by or "admin"
                )
            else:
                raise

        # Resequence all categories to ensure strict 1, 2, 3, ... consecutive order
        resequence_category_orders()
        category.refresh_from_db()

        return {
            "id": category.id,
            "name": category.name,
            "display_order": category.display_order,
            "message": f"Category '{category.name}' created successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in create_category: {str(e)}", exc_info=True)
        raise APIException(str(e))


def update_category(updated_by="admin", **data):
    """
    Updates an existing category, supporting priority order updates that
    automatically resequence other categories to avoid duplicates.
    """
    try:
        cat_id = data.get('id')
        if not cat_id:
            raise ValidationError("Category ID is required.")

        category = Category.objects.filter(id=cat_id).first()
        if not category:
            raise ValidationError("Category not found.")

        name = data.get('name')
        if name:
            name = name.strip()
            # If changing name, ensure uniqueness
            duplicate = Category.objects.filter(name__iexact=name).exclude(id=cat_id).first()
            if duplicate:
                raise ValidationError(f"Category with name '{name}' already exists.")
            category.name = name

        if 'description' in data:
            category.description = (data.get('description') or "").strip()

        if 'category_img' in data and data.get('category_img'):
            category.category_img = data.get('category_img')

        # Handle priority order update with automatic shifting
        if 'display_order' in data and data.get('display_order') is not None:
            try:
                target_order = int(data.get('display_order'))
                if target_order < 1:
                    target_order = 1
                old_order = category.display_order or 1
                if target_order != old_order:
                    if target_order < old_order:
                        # Moving up (higher priority): shift intermediate items down
                        Category.objects.filter(
                            display_order__gte=target_order,
                            display_order__lt=old_order
                        ).exclude(id=cat_id).update(display_order=F('display_order') + 1)
                    else:
                        # Moving down (lower priority): shift intermediate items up
                        Category.objects.filter(
                            display_order__gt=old_order,
                            display_order__lte=target_order
                        ).exclude(id=cat_id).update(display_order=F('display_order') - 1)
                    category.display_order = target_order
            except (ValueError, TypeError):
                pass

        if 'is_active' in data:
            category.is_active = data.get('is_active')

        category.updated_by = updated_by or "admin"
        category.save()

        # Cascade active/inactive status to all child subcategories and products
        SubCategory.objects.filter(category=category).update(
            is_active=category.is_active,
            updated_by=updated_by or "admin"
        )
        Product.objects.filter(
            Q(category=category) | Q(subcategory__category=category)
        ).update(
            is_active=category.is_active,
            updated_by=updated_by or "admin"
        )

        # Resequence all categories to ensure clean 1, 2, 3, ... consecutive order without duplicates
        resequence_category_orders()
        category.refresh_from_db()

        return {
            "id": category.id,
            "name": category.name,
            "display_order": category.display_order,
            "is_active": category.is_active,
            "message": f"Category '{category.name}' updated successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in update_category: {str(e)}", exc_info=True)
        raise APIException(str(e))


def toggle_category_status(updated_by="admin", **data):
    """
    Toggles the active/inactive storefront visibility of a category.
    """
    try:
        cat_id = data.get('id')
        if not cat_id:
            raise ValidationError("Category ID is required.")

        category = Category.objects.filter(id=cat_id).first()
        if not category:
            raise ValidationError("Category not found.")

        # If is_active is provided, use it; otherwise flip current value
        if 'is_active' in data and data.get('is_active') is not None:
            category.is_active = bool(data.get('is_active'))
        else:
            category.is_active = not category.is_active

        category.updated_by = updated_by or "admin"
        category.save()

        # Cascade active/inactive status to all child subcategories and products
        SubCategory.objects.filter(category=category).update(
            is_active=category.is_active,
            updated_by=updated_by or "admin"
        )
        Product.objects.filter(
            Q(category=category) | Q(subcategory__category=category)
        ).update(
            is_active=category.is_active,
            updated_by=updated_by or "admin"
        )

        return {
            "id": category.id,
            "is_active": category.is_active,
            "status": "Active" if category.is_active else "Inactive",
            "message": f"Category status changed to {'Active' if category.is_active else 'Inactive'}."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in toggle_category_status: {str(e)}", exc_info=True)
        raise APIException(str(e))


def delete_category(deleted_by=None, **data):
    """
    Soft-deletes a category using SafeDeleteModel audit logging.
    """
    try:
        cat_id = data.get('id')
        if not cat_id:
            raise ValidationError("Category ID is required.")

        category = Category.objects.filter(id=cat_id).first()
        if not category:
            raise ValidationError("Category not found.")

        cat_name = category.name
        
        # Sanitize deleted_by to pass valid integer user id or None
        valid_user_id = None
        if isinstance(deleted_by, int):
            valid_user_id = deleted_by
        elif isinstance(deleted_by, str) and deleted_by.isdigit():
            valid_user_id = int(deleted_by)
        elif hasattr(deleted_by, 'id') and isinstance(deleted_by.id, int):
            valid_user_id = deleted_by.id

        # Uses SafeDeleteModel method to log and soft delete
        if hasattr(category, 'save_delete'):
            category.save_delete(user_id=valid_user_id)
        else:
            category.delete()

        # Resequence remaining categories to ensure continuous 1, 2, 3 sequence
        resequence_category_orders()

        return {
            "id": cat_id,
            "message": f"Category '{cat_name}' deleted successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in delete_category: {str(e)}", exc_info=True)
        raise APIException(str(e))
