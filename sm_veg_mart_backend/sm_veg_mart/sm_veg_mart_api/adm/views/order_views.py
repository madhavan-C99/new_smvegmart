import logging
import random
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from django.contrib.auth import get_user_model

from biz.models.order import Order
from biz.models.order_items import OrderItems
from biz.models.address import Address
from adm.models.customer_profile import CustomerProfile
from adm.models.products import Product
from adm.models.notification import Notification
from adm.utils.time_utils import get_ist_today
from .excel_utils import build_styled_excel_response
from ..services.order_service import (
    get_all_orders_orm,
    fetch_one_order_service,
    update_order_status_service,
    cancel_order_service,
    delete_order_item_service,
    export_orders_csv_service,
    notify_order_subscribers,
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllOrdersView(APIView):
    """
    GET: Fetches all orders from the database.
    """
    def get(self, request):
        orders = get_all_orders_orm()
        return Response({"status": "SUCCESS", "data": {"orders": orders, "total": len(orders)}}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FetchOneOrderView(APIView):
    """
    POST: Fetches single order details by ID.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_order_service(order_id=serializer.validated_data["id"])
        return Response({"status": "SUCCESS", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class UpdateOrderStatusView(APIView):
    """
    POST: Updates order lifecycle status (e.g. 'Pending' -> 'Confirmed' -> 'Ready for Dispatch' -> 'Out for Delivery' -> 'Delivered').
    Payload: { "id": 1, "status": "Confirmed" }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        status = serializers.CharField(max_length=50, required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = update_order_status_service(
            order_id=serializer.validated_data["id"],
            status=serializer.validated_data["status"]
        )
        return Response({"status": "SUCCESS", "message": f"Order status updated to {serializer.validated_data['status']}", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CancelOrderView(APIView):
    """
    POST: Cancels or rejects an order.
    Payload: { "id": 1, "reason": "Customer requested" }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        reason = serializers.CharField(max_length=255, required=False, default="")

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = cancel_order_service(
            order_id=serializer.validated_data["id"],
            reason=serializer.validated_data.get("reason", "")
        )
        return Response({"status": "SUCCESS", "message": "Order cancelled successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteOrderItemView(APIView):
    """
    POST: Deletes a specific item from an order and recalculates the order total amount.
    Payload: { "order_id": 1, "item_id": 5 }
    """
    class InputSerializer(serializers.Serializer):
        order_id = serializers.IntegerField(required=True)
        item_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = delete_order_item_service(
            order_id=serializer.validated_data["order_id"],
            item_id=serializer.validated_data["item_id"]
        )
        return Response({"status": "SUCCESS", "message": "Item removed from order", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ExportOrderCSVView(APIView):
    """
    Exports orders as a beautifully styled Microsoft Excel (.xlsx) spreadsheet:
    - POST: Takes currently filtered & displayed orders from the frontend.
    - GET: Falls back to exporting all orders from the database.
    - Uses the exact corporate VegMart green theme and auto-fitted columns.
    """

    def _generate_excel_response(self, orders_list):
        headers = [
            "S.No",
            "Order ID",
            "Customer Name",
            "Phone Number",
            "Date & Time",
            "Items Count",
            "Items Summary",
            "Amount (INR)",
            "Delivery Mode",
            "Status",
            "Delivery Agent",
            "Delivery Address",
        ]

        rows = []
        for index, o in enumerate(orders_list, start=1):
            cust = o.get("customer") or {}
            cust_name = (cust.get("name") or "").strip() or "-"
            cust_phone = (cust.get("phone") or "").strip() or "-"
            cust_addr = (cust.get("address") or "").strip() or "-"

            order_id_str = o.get("order_number") or o.get("order_id") or f"SMV-{o.get('id')}"
            date_time_str = o.get("created_at") or o.get("date_formatted") or "-"

            # Items count & preview
            items_cnt = o.get("items_count")
            if not items_cnt and o.get("basket"):
                items_cnt = len(o.get("basket", []))
            items_count_str = f"{items_cnt} items" if items_cnt else "0 items"

            items_preview = o.get("items_preview")
            if not items_preview and o.get("basket"):
                items_preview = ", ".join([b.get("name", "") for b in o.get("basket", []) if b.get("name")])
            items_preview_str = items_preview or "-"

            # Amount formatting
            try:
                amt_val = float(o.get("amount") or 0.0)
                amount_str = f"₹{amt_val:.2f}"
            except (ValueError, TypeError):
                amount_str = f"₹{o.get('amount') or 0}"

            delivery_mode_str = o.get("delivery_mode") or "Express 25m"
            status_str = o.get("status") or "Pending"

            # Delivery Agent
            agent_obj = o.get("delivery_agent") or o.get("rider") or {}
            agent_name = (agent_obj.get("name") or "").strip()
            if agent_name:
                agent_phone = agent_obj.get("phone") or ""
                agent_str = f"{agent_name} ({agent_phone})".strip() if agent_phone else agent_name
            else:
                agent_str = "Unassigned"

            rows.append([
                f"{index:02d}",
                order_id_str,
                cust_name,
                cust_phone,
                date_time_str,
                items_count_str,
                items_preview_str,
                amount_str,
                delivery_mode_str,
                status_str,
                agent_str,
                cust_addr,
            ])

        return build_styled_excel_response(
            filename="vegmart_orders.xlsx",
            sheet_title="Orders",
            headers=headers,
            rows=rows
        )

    def post(self, request):
        orders_payload = request.data.get("orders")
        if orders_payload and isinstance(orders_payload, list) and len(orders_payload) > 0:
            return self._generate_excel_response(orders_payload)

        # Fallback to all orders from database
        orders = get_all_orders_orm()
        return self._generate_excel_response(orders)

    def get(self, request):
        orders = get_all_orders_orm()
        return self._generate_excel_response(orders)


@authentication_classes([])
@permission_classes([])
class CreateTestOrderView(APIView):
    """
    Creates a new incoming Express Order for live notification & popup alert testing.
    Triggered via POST or GET /adm/create_test_order
    """
    def _create_order(self):
        user = CustomerProfile.objects.filter(name__iexact="Rajesh Verma").first()
        if not user:
            user = CustomerProfile.objects.first()
        if not user:
            User = get_user_model()
            base_user = User.objects.first()
            user = CustomerProfile.objects.create(
                user=base_user,
                name="Rajesh Verma",
                email="rajesh.verma@example.com",
                is_active=True,
                created_by="system",
                updated_by="system"
            )

        address = Address.objects.filter(user=user).first()
        if not address:
            address = Address.objects.create(
                user=user,
                name="Rajesh Verma",
                mobile="9845028194",
                category="home",
                address_line1="Flat 402, Green Glen Layout, 100ft Road",
                city="Indiranagar, Bengaluru",
                state="Karnataka",
                country="India",
                pincode="560038",
                is_default=True
            )

        today = get_ist_today()
        rand_num = random.randint(100, 999)
        order_num = f"SMV-{today.strftime('%Y%m%d')}-{rand_num:03d}"

        order = Order.objects.create(
            user=user,
            address=address,
            order_number=order_num,
            status="New Order",
            order_date=today,
            delivery_date=today,
            delivery_mode="Express 25m",
            total_amount=135.0,
            delivery_charge=0.0,
            payment_status=True,
            created_by="system",
            updated_by="system"
        )

        products = list(Product.objects.all()[:3])
        items_total = 0.0
        if products:
            for p in products:
                unit_p = float(getattr(p, 'price', 45.0) or 45.0)
                items_total += unit_p
                OrderItems.objects.create(
                    order=order,
                    product=p,
                    weight=getattr(p, 'weight', '1 kg') or '1 kg',
                    quantity=1,
                    unit_price=unit_p,
                    total_price=unit_p
                )
        else:
            items_total = 135.0

        if items_total != order.total_amount:
            order.total_amount = items_total
            order.save(update_fields=['total_amount'])

        notif = Notification.objects.create(
            title="Incoming Express Order",
            message=f"New order {order_num} placed by Rajesh Verma",
            order=order,
            is_read=False,
            created_by="system",
            updated_by="system"
        )

        # Broadcast instantly via WebSocket to all connected browser clients!
        notify_order_subscribers()

        return {
            "status": "SUCCESS",
            "message": f"New Live Express Order {order_num} created and broadcasted!",
            "order_number": order_num,
            "order_id": order.id,
            "notification_id": notif.id,
            "delivery_mode": "Instant Express (25m)",
            "customer": "Rajesh Verma",
            "amount": items_total
        }

    def post(self, request):
        result = self._create_order()
        return Response(result, status=status.HTTP_201_CREATED)

    def get(self, request):
        result = self._create_order()
        return Response(result, status=status.HTTP_201_CREATED)


