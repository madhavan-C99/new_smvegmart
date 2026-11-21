import logging
from django.db import connection, IntegrityError
from django.db.models import Q, F, Max
from rest_framework.exceptions import APIException, ValidationError
from ..models.category import Category, SubCategory
from ..models.products import Product
from adm.utils.time_utils import format_12h_datetime


logger = logging.getLogger('django')


def sync_table_sequence(table_name='adm_subcategory', pk_col='id'):
    """
    Synchronizes PostgreSQL's auto-increment sequence with the maximum existing ID.
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


def resequence_subcategory_orders():
    """
    Ensures all subcategories have clean, consecutive display_order values (1, 2, 3, ...)
    without starting from 0, and without duplicates or gaps.
    """
    try:
        subcategories = SubCategory.objects.all().order_by('display_order', 'id')
        for index, sub in enumerate(subcategories, start=1):
            if sub.display_order != index:
                SubCategory.objects.filter(id=sub.id).update(display_order=index)
    except Exception as e:
        logger.warning(f"Could not resequence subcategory display orders: {e}")


def fetch_all_subcategories(search=None, category_id=None, is_active=None, request=None):
    """
    Fetches all subcategories with parent category details, KPI metrics, and optional filters.
    Subcategories are ordered by display_order ascending, starting from 1, 2, 3...
    """
    try:
        sync_table_sequence('adm_subcategory', 'id')
        resequence_subcategory_orders()

        queryset = SubCategory.objects.select_related('category').all().order_by('display_order', 'id')

        # 1. Catalog KPI Metrics
        total_subcategories = queryset.count()
        active_subcategories = queryset.filter(is_active=True).count()
        inactive_subcategories = queryset.filter(is_active=False).count()

        # 2. Apply Filters
        filtered = queryset
        if search:
            search = search.strip()
            filtered = filtered.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )

        if category_id:
            filtered = filtered.filter(category_id=category_id)

        if is_active is not None:
            filtered = filtered.filter(is_active=is_active)

        # 3. Serialize Subcategories
        sub_list = []
        for index, sub in enumerate(filtered, start=1):
            image_url = request.build_absolute_uri(sub.subcategory_img.url) if (sub.subcategory_img and request) else (sub.subcategory_img.url if sub.subcategory_img else None)

            sub_list.append({
                "id": sub.id,
                "s_no": f"{index:02d}",
                "name": sub.name,
                "description": sub.description or "",
                "category_id": sub.category.id if sub.category else None,
                "category_name": sub.category.name if sub.category else "Uncategorized",
                "display_order": getattr(sub, 'display_order', 1) or 1,
                "image": image_url,
                "status": "Active" if sub.is_active else "Inactive",
                "visibility": sub.is_active,
                "created_at": format_12h_datetime(sub.created_at) if sub.created_at else None,
            })


        return {
            "subcategories": sub_list,
            "total_count": len(sub_list),
            "metrics": {
                "total_subcategories": total_subcategories,
                "active_subcategories": active_subcategories,
                "inactive_subcategories": inactive_subcategories,
            }
        }

    except Exception as e:
        logger.error(f"Error in fetch_all_subcategories: {str(e)}", exc_info=True)
        raise APIException(str(e))


def fetch_one_subcategory(request=None, **data):
    """
    Fetches single subcategory details by ID.
    """
    try:
        sub_id = data.get('id')
        if not sub_id:
            raise ValidationError("Subcategory ID is required.")

        sub = SubCategory.objects.select_related('category').filter(id=sub_id).first()
        if not sub:
            raise ValidationError("Subcategory not found.")

        image_url = request.build_absolute_uri(sub.subcategory_img.url) if (sub.subcategory_img and request) else (sub.subcategory_img.url if sub.subcategory_img else None)

        return {
            "id": sub.id,
            "name": sub.name,
            "description": sub.description or "",
            "category_id": sub.category.id if sub.category else None,
            "category_name": sub.category.name if sub.category else "",
            "display_order": getattr(sub, 'display_order', 1) or 1,
            "image": image_url,
            "is_active": sub.is_active,
            "status": "Active" if sub.is_active else "Inactive",
            "visibility": sub.is_active,
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in fetch_one_subcategory: {str(e)}", exc_info=True)
        raise APIException(str(e))


def create_subcategory(created_by="admin", **data):
    """
    Creates a new subcategory linked to a parent category.
    If no display_order is specified, it defaults to the last position.
    If an existing priority order is chosen, existing items shift accordingly.
    """
    try:
        name = (data.get('name') or "").strip()
        if not name:
            raise ValidationError("Subcategory Name is required.")

        category_id = data.get('category_id')
        category_name = data.get('category_name')

        cat = None
        if category_id:
            cat = Category.objects.filter(id=category_id).first()
        elif category_name:
            cat = Category.objects.filter(name__iexact=category_name.strip()).first()

        if not cat:
            raise ValidationError("Valid parent category is required.")

        # Check for duplicate subcategory name within the same category
        if SubCategory.objects.filter(name__iexact=name, category=cat).exists():
            raise ValidationError(f"Subcategory '{name}' already exists in '{cat.name}'.")

        description = (data.get('description') or "").strip()
        subcategory_img = data.get('subcategory_img')
        is_active = data.get('is_active', True)

        # Default priority order goes at the last!
        raw_order = data.get('display_order')
        max_order = SubCategory.objects.aggregate(Max('display_order'))['display_order__max'] or 0
        total_count = SubCategory.objects.count()

        if raw_order is None or str(raw_order).strip() == "" or int(raw_order) <= 0:
            display_order = max(max_order, total_count) + 1
        else:
            display_order = int(raw_order)
            # Shift existing subcategories at or above this priority order up by 1
            SubCategory.objects.filter(display_order__gte=display_order).update(
                display_order=F('display_order') + 1
            )

        sync_table_sequence('adm_subcategory', 'id')

        try:
            subcategory = SubCategory.objects.create(
                name=name,
                category=cat,
                description=description,
                subcategory_img=subcategory_img,
                display_order=display_order,
                is_active=is_active,
                created_by=created_by or "admin",
                updated_by=created_by or "admin"
            )
        except IntegrityError as ie:
            if 'duplicate key' in str(ie).lower() or 'pkey' in str(ie).lower():
                logger.warning("adm_subcategory sequence out of sync. Resyncing sequence and retrying...")
                sync_table_sequence('adm_subcategory', 'id')
                subcategory = SubCategory.objects.create(
                    name=name,
                    category=cat,
                    description=description,
                    subcategory_img=subcategory_img,
                    display_order=display_order,
                    is_active=is_active,
                    created_by=created_by or "admin",
                    updated_by=created_by or "admin"
                )
            else:
                raise

        # Resequence to guarantee consecutive 1, 2, 3... order without gaps or duplicates
        resequence_subcategory_orders()
        subcategory.refresh_from_db()

        return {
            "id": subcategory.id,
            "name": subcategory.name,
            "category_id": cat.id,
            "category_name": cat.name,
            "display_order": subcategory.display_order,
            "message": f"Subcategory '{subcategory.name}' created successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in create_subcategory: {str(e)}", exc_info=True)
        raise APIException(str(e))


def update_subcategory(updated_by="admin", **data):
    """
    Updates an existing subcategory, supporting priority order updates that
    automatically resequence other subcategories to avoid duplicates.
    """
    try:
        sub_id = data.get('id')
        if not sub_id:
            raise ValidationError("Subcategory ID is required.")

        sub = SubCategory.objects.filter(id=sub_id).first()
        if not sub:
            raise ValidationError("Subcategory not found.")

        # Update category relationship if provided
        category_id = data.get('category_id')
        category_name = data.get('category_name')
        if category_id:
            cat = Category.objects.filter(id=category_id).first()
            if not cat:
                raise ValidationError("Category not found.")
            sub.category = cat
        elif category_name:
            cat = Category.objects.filter(name__iexact=category_name.strip()).first()
            if cat:
                sub.category = cat

        name = data.get('name')
        if name:
            name = name.strip()
            # Check duplicate in same category
            duplicate = SubCategory.objects.filter(name__iexact=name, category=sub.category).exclude(id=sub_id).first()
            if duplicate:
                raise ValidationError(f"Subcategory '{name}' already exists in '{sub.category.name}'.")
            sub.name = name

        if 'description' in data:
            sub.description = (data.get('description') or "").strip()

        if 'subcategory_img' in data and data.get('subcategory_img'):
            sub.subcategory_img = data.get('subcategory_img')

        # Handle priority order update with automatic shifting
        if 'display_order' in data and data.get('display_order') is not None:
            try:
                target_order = int(data.get('display_order'))
                if target_order < 1:
                    target_order = 1
                old_order = sub.display_order or 1
                if target_order != old_order:
                    if target_order < old_order:
                        # Moving up (higher priority): shift intermediate items down
                        SubCategory.objects.filter(
                            display_order__gte=target_order,
                            display_order__lt=old_order
                        ).exclude(id=sub_id).update(display_order=F('display_order') + 1)
                    else:
                        # Moving down (lower priority): shift intermediate items up
                        SubCategory.objects.filter(
                            display_order__gt=old_order,
                            display_order__lte=target_order
                        ).exclude(id=sub_id).update(display_order=F('display_order') - 1)
                    sub.display_order = target_order
            except (ValueError, TypeError):
                pass

        if 'is_active' in data:
            sub.is_active = data.get('is_active')

        sub.updated_by = updated_by or "admin"
        sub.save()

        # If subcategory is activated and its parent category is inactive, also activate the parent category
        if sub.is_active and sub.category and not sub.category.is_active:
            sub.category.is_active = True
            sub.category.updated_by = updated_by or "admin"
            sub.category.save()

        # Cascade active/inactive status to all child products
        Product.objects.filter(subcategory=sub).update(
            is_active=sub.is_active,
            updated_by=updated_by or "admin"
        )

        # Resequence all subcategories to ensure clean 1, 2, 3, ... consecutive order without duplicates
        resequence_subcategory_orders()
        sub.refresh_from_db()

        return {
            "id": sub.id,
            "name": sub.name,
            "category_id": sub.category.id if sub.category else None,
            "category_name": sub.category.name if sub.category else "",
            "display_order": sub.display_order,
            "is_active": sub.is_active,
            "message": f"Subcategory '{sub.name}' updated successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in update_subcategory: {str(e)}", exc_info=True)
        raise APIException(str(e))


def toggle_subcategory_status(updated_by="admin", **data):
    """
    Toggles the is_active status of a subcategory.
    """
    try:
        sub_id = data.get('id')
        if not sub_id:
            raise ValidationError("Subcategory ID is required.")

        sub = SubCategory.objects.filter(id=sub_id).first()
        if not sub:
            raise ValidationError("Subcategory not found.")

        is_active = data.get('is_active')
        sub.is_active = is_active if is_active is not None else not sub.is_active
        sub.updated_by = updated_by or "admin"
        sub.save()

        # If subcategory is activated and its parent category is inactive, also activate the parent category
        if sub.is_active and sub.category and not sub.category.is_active:
            sub.category.is_active = True
            sub.category.updated_by = updated_by or "admin"
            sub.category.save()

        # Cascade active/inactive status to all child products
        Product.objects.filter(subcategory=sub).update(
            is_active=sub.is_active,
            updated_by=updated_by or "admin"
        )

        return {
            "id": sub.id,
            "is_active": sub.is_active,
            "status": "Active" if sub.is_active else "Inactive",
            "message": f"Subcategory '{sub.name}' status changed to {'Active' if sub.is_active else 'Inactive'}."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in toggle_subcategory_status: {str(e)}", exc_info=True)
        raise APIException(str(e))


def delete_subcategory(deleted_by=None, **data):
    """
    Soft-deletes a subcategory using SafeDeleteModel audit logging.
    """
    try:
        sub_id = data.get('id')
        if not sub_id:
            raise ValidationError("Subcategory ID is required.")

        sub = SubCategory.objects.filter(id=sub_id).first()
        if not sub:
            raise ValidationError("Subcategory not found.")

        sub_name = sub.name

        valid_user_id = None
        if isinstance(deleted_by, int):
            valid_user_id = deleted_by
        elif isinstance(deleted_by, str) and deleted_by.isdigit():
            valid_user_id = int(deleted_by)
        elif hasattr(deleted_by, 'id') and isinstance(deleted_by.id, int):
            valid_user_id = deleted_by.id

        if hasattr(sub, 'save_delete'):
            sub.save_delete(user_id=valid_user_id)
        else:
            sub.delete()

        # Resequence remaining subcategories to ensure continuous 1, 2, 3 sequence
        resequence_subcategory_orders()

        return {
            "id": sub_id,
            "message": f"Subcategory '{sub_name}' deleted successfully."
        }

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error in delete_subcategory: {str(e)}", exc_info=True)
        raise APIException(str(e))
