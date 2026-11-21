import logging
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Q
from django.db.models.functions import ExtractYear
from django.utils import timezone
from biz.models.order import Order
from biz.models.order_items import OrderItems
from adm.models.products import Product
from adm.services.order_service import get_all_orders_orm
from adm.utils.time_utils import get_ist_now, get_ist_today

logger = logging.getLogger('django')


def get_dashboard_summary_service(period="yearly", year=None, month=None, request=None):
    """
    Computes analytics and operational metrics for the Admin Dashboard
    dynamically from the live PostgreSQL database based on period, year, and month.
    """
    try:
        if request:
            period = request.query_params.get('period', period)
            year = request.query_params.get('year', year)
            month = request.query_params.get('month', month)

        ist_now = get_ist_now()
        ist_today = ist_now.date()
        current_year = ist_today.year
        current_month = ist_today.month

        # Parse year & month
        try:
            target_year = int(year) if year is not None and str(year).isdigit() else current_year
        except (ValueError, TypeError):
            target_year = current_year

        try:
            target_month = int(month) if month is not None and str(month).isdigit() else current_month
        except (ValueError, TypeError):
            target_month = current_month

        target_month = max(1, min(12, target_month))
        period = str(period or "yearly").lower().strip()

        # -------------------------------------------------------------
        # Date filtering based on period
        # -------------------------------------------------------------
        if period == "today":
            orders_filter = Q(created_at__date=ist_today)
            yesterday = ist_today - timedelta(days=1)
            prev_orders_filter = Q(created_at__date=yesterday)
            comparison_label = "vs yesterday"
            products_delta_count = Product.objects.filter(created_at__date=ist_today).count()
            products_delta_label = "added today"

        elif period == "monthly":
            orders_filter = Q(created_at__year=target_year, created_at__month=target_month)
            if target_month == 1:
                prev_year = target_year - 1
                prev_month = 12
            else:
                prev_year = target_year
                prev_month = target_month - 1
            prev_orders_filter = Q(created_at__year=prev_year, created_at__month=prev_month)
            comparison_label = f"vs {prev_month:02d}/{prev_year}"
            products_delta_count = Product.objects.filter(created_at__year=target_year, created_at__month=target_month).count()
            products_delta_label = "added this month"

        elif period == "yearly":
            orders_filter = Q(created_at__year=target_year)
            prev_orders_filter = Q(created_at__year=target_year - 1)
            comparison_label = f"vs {target_year - 1}"
            products_delta_count = Product.objects.filter(created_at__year=target_year).count()
            products_delta_label = f"added in {target_year}"

        else: # "all"
            orders_filter = Q()
            prev_orders_filter = Q(created_at__lt=ist_now - timedelta(days=30))
            comparison_label = "vs previous period"
            products_delta_count = Product.objects.filter(created_at__gte=ist_now - timedelta(days=30)).count()
            products_delta_label = "added last 30 days"

        # -------------------------------------------------------------
        # 1. KPI Cards (Filtered by Selected Period)
        # -------------------------------------------------------------
        total_products_count = Product.objects.filter(is_active=True).count()

        # Revenue in period
        revenue_agg = Order.objects.filter(orders_filter).exclude(status__iexact='cancelled').aggregate(total=Sum('total_amount'))
        display_total_revenue = float(revenue_agg['total'] or 0.0)

        # Revenue Delta calculation
        prev_rev_agg = Order.objects.filter(prev_orders_filter).exclude(status__iexact='cancelled').aggregate(total=Sum('total_amount'))
        prev_rev = float(prev_rev_agg['total'] or 0.0)

        if prev_rev > 0:
            rev_growth = ((display_total_revenue - prev_rev) / prev_rev) * 100
            revenue_delta = f"{'+' if rev_growth >= 0 else ''}{rev_growth:.1f}%"
        elif display_total_revenue > 0:
            revenue_delta = "+100%"
        else:
            revenue_delta = "0.0%"

        # Total Orders in period
        display_total_orders = Order.objects.filter(orders_filter).count()
        prev_orders_count = Order.objects.filter(prev_orders_filter).count()

        if prev_orders_count > 0:
            orders_growth = ((display_total_orders - prev_orders_count) / prev_orders_count) * 100
            orders_delta = f"{'+' if orders_growth >= 0 else ''}{orders_growth:.1f}%"
        elif display_total_orders > 0:
            orders_delta = "+100%"
        else:
            orders_delta = "0.0%"

        # New Orders in period
        new_orders_queryset = Order.objects.filter(orders_filter).filter(
            status__in=['Pending', 'Waiting', 'Confirmed', 'Packing', 'New Order', 'new_order']
        )
        new_orders_count = new_orders_queryset.count()

        # -------------------------------------------------------------
        # 2. Top-Selling Products (Filtered by Selected Period)
        # -------------------------------------------------------------
        top_selling = []
        try:
            matched_orders = Order.objects.filter(orders_filter).exclude(status__iexact='cancelled')
            top_items_agg = (
                OrderItems.objects
                .filter(order__in=matched_orders)
                .select_related('product', 'product__subcategory')
                .values(
                    'product__id',
                    'product__name',
                    'product__tamil_name',
                    'product__product_img',
                    'product__subcategory__name'
                )
                .annotate(
                    total_sold_qty=Sum('quantity'),
                    total_sales_amount=Sum('total_price')
                )
                .order_by('-total_sales_amount')[:5]
            )
            for item in top_items_agg:
                if item['product__name']:
                    p_name = item['product__name']
                    tamil_name = item.get('product__tamil_name') or ''
                    display_name = f"{p_name} / {tamil_name}" if tamil_name else p_name
                    sub_name = item.get('product__subcategory__name') or 'Produce'
                    sold_qty = item.get('total_sold_qty') or 1
                    img_path = item.get('product__product_img')
                    img_url = None
                    if img_path:
                        img_url = f"/media/{img_path}" if not str(img_path).startswith('http') else str(img_path)

                    top_selling.append({
                        "id": item['product__id'],
                        "name": display_name,
                        "english_name": p_name,
                        "tamil_name": tamil_name,
                        "subtitle": f"{sub_name} • {sold_qty} sold",
                        "revenue": float(item['total_sales_amount'] or 0.0),
                        "image": img_url,
                    })
        except Exception as e:
            logger.warning(f"Error computing top items from OrderItems: {e}")

        # Fill remaining slots with active database products if fewer than 5
        if len(top_selling) < 5:
            try:
                existing_pids = {p['id'] for p in top_selling}
                active_db_products = (
                    Product.objects.filter(is_active=True)
                    .exclude(id__in=existing_pids)
                    .select_related('subcategory')
                    .order_by('id')[: (5 - len(top_selling))]
                )
                for prod in active_db_products:
                    p_name = prod.name
                    tamil_name = prod.tamil_name or ''
                    display_name = f"{p_name} / {tamil_name}" if tamil_name else p_name
                    sub_name = prod.subcategory.name if prod.subcategory else 'Produce'
                    img_url = None
                    if prod.product_img:
                        try:
                            img_url = prod.product_img.url
                        except Exception:
                            img_url = f"/media/{prod.product_img}"

                    top_selling.append({
                        "id": prod.id,
                        "name": display_name,
                        "english_name": p_name,
                        "tamil_name": tamil_name,
                        "subtitle": f"{sub_name} • In Stock",
                        "revenue": 0.0,
                        "image": img_url,
                    })
            except Exception as e:
                logger.warning(f"Error pulling real products from Product table: {e}")

        # -------------------------------------------------------------
        # 3. Monthly Revenue Distribution (12 Months of target_year)
        # -------------------------------------------------------------
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_buckets = {
            m: {"vegetables": 0.0, "exotics": 0.0, "fruits": 0.0, "total": 0.0}
            for m in range(1, 13)
        }

        try:
            item_sales_agg = (
                OrderItems.objects
                .filter(order__created_at__year=target_year)
                .exclude(order__status__iexact='cancelled')
                .select_related('order', 'product__category')
                .values('order__created_at__month', 'product__category__name')
                .annotate(cat_total=Sum('total_price'))
            )

            for row in item_sales_agg:
                m_num = row.get('order__created_at__month')
                if not m_num or not (1 <= m_num <= 12):
                    continue
                cat_name = str(row.get('product__category__name') or '').lower()
                amount = float(row.get('cat_total') or 0.0)

                if any(k in cat_name for k in ['veg', 'green', 'leaf', 'root', 'sprout', 'herb', 'onion', 'tomato']):
                    bucket = 'vegetables'
                elif any(k in cat_name for k in ['exotic', 'hydro', 'dairy', 'curd', 'milk', 'paneer', 'mushroom', 'special']):
                    bucket = 'exotics'
                else:
                    bucket = 'fruits'

                monthly_buckets[m_num][bucket] += amount
                monthly_buckets[m_num]['total'] += amount

        except Exception as e:
            logger.warning(f"Error computing monthly revenue distribution: {e}")

        # Find peak month
        peak_m_num = None
        max_month_sales = 0.0
        for m_num, data in monthly_buckets.items():
            if data['total'] > max_month_sales:
                max_month_sales = data['total']
                peak_m_num = m_num

        months_distribution = []
        for m_num in range(1, 13):
            m_name = month_names[m_num - 1]
            data = monthly_buckets[m_num]
            is_peak = (m_num == peak_m_num and max_month_sales > 0)
            is_selected = (period == "monthly" and m_num == target_month)
            months_distribution.append({
                "month": f"{m_name} ★" if is_peak else m_name,
                "vegetables": round(data['vegetables'], 2),
                "exotics": round(data['exotics'], 2),
                "fruits": round(data['fruits'], 2),
                "total": round(data['total'], 2),
                "is_peak": is_peak,
                "is_selected": is_selected,
            })

        # -------------------------------------------------------------
        # 4. Active Dispatch Queue (Real Live Orders)
        # -------------------------------------------------------------
        all_real_orders = get_all_orders_orm()
        active_queue = []
        for o in all_real_orders:
            st = str(o.get('status', '')).lower().strip()
            if st not in ['delivered', 'done', 'cancelled', 'rejected']:
                raw_addr = str(o.get("customer", {}).get("address") or "").strip()
                parts = [p.strip() for p in raw_addr.split(",") if p.strip()]
                if len(parts) >= 3:
                    hub_zone = f"{parts[-4]}, {parts[-3]}" if len(parts) >= 4 else f"{parts[0]}, {parts[1]}"
                elif parts:
                    hub_zone = ", ".join(parts[:2])
                else:
                    hub_zone = "Local Zone"

                active_queue.append({
                    "id": o.get("id"),
                    "order_id": o.get("order_id"),
                    "customer_name": o.get("customer", {}).get("name") or "Customer",
                    "customer_hub_zone": hub_zone,
                    "full_address": raw_addr or hub_zone,
                    "phone": o.get("customer", {}).get("phone") or "",
                    "delivery_mode": o.get("delivery_badge") or o.get("delivery_mode") or "Express 25-Min",
                    "amount": float(o.get("amount") or 0.0),
                    "status": o.get("status") or "New Order",
                    "created_at": o.get("created_at") or "Just now",
                })

        # Find distinct years in DB
        db_years = list(Order.objects.annotate(y=ExtractYear('created_at')).values_list('y', flat=True).distinct())
        valid_years = [y for y in db_years if y is not None]
        all_years = sorted(list(set(valid_years + [2024, 2025, current_year])), reverse=True)

        return {
            "metrics": {
                "total_products": total_products_count,
                "products_delta": f"+{products_delta_count}",
                "products_delta_label": products_delta_label,
                "total_revenue": display_total_revenue,
                "revenue_delta": revenue_delta,
                "comparison_label": comparison_label,
                "total_orders": display_total_orders,
                "orders_delta": orders_delta,
                "new_orders": new_orders_count,
            },
            "revenue_distribution": months_distribution,
            "top_selling_products": top_selling,
            "active_dispatch_queue": active_queue,
            "period": period,
            "selection": {
                "period": period,
                "year": target_year,
                "month": target_month,
                "comparison_label": comparison_label,
            },
            "available_years": all_years,
        }
    except Exception as e:
        logger.error(f"Error in get_dashboard_summary_service: {e}", exc_info=True)
        return {
            "metrics": {
                "total_products": 0,
                "products_delta": "+0",
                "products_delta_label": "added",
                "total_revenue": 0.0,
                "revenue_delta": "0.0%",
                "total_orders": 0,
                "orders_delta": "0.0%",
                "new_orders": 0,
            },
            "revenue_distribution": [],
            "top_selling_products": [],
            "active_dispatch_queue": [],
            "period": period,
            "selection": {
                "period": period,
                "year": 2026,
                "month": 11,
                "comparison_label": "vs prev period",
            },
            "available_years": [2026, 2025, 2024],
        }
