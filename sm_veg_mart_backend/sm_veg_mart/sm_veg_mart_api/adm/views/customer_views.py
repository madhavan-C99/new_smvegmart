import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from django.http import HttpResponse

from ..services.customer_management_service import (
    fetch_all_customers_service,
    update_customer_service,
    toggle_customer_status_service,
    delete_customer_service,
)
from .excel_utils import build_styled_excel_response

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllCustomersView(APIView):
    """
    GET: Fetches all customers with search, sort, and order parameters.
    """
    def get(self, request):
        search = request.query_params.get("search", "")
        sort_by = request.query_params.get("sort_by", "normal")
        order_by = request.query_params.get("order_by", "asc")

        result = fetch_all_customers_service(search=search, sort_by=sort_by, order_by=order_by)
        return Response({"status": "SUCCESS", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class UpdateCustomerView(APIView):
    """
    POST: Updates customer profile information.
    Payload: { id, name, email, mobile_number, is_active }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        name = serializers.CharField(max_length=100, required=False)
        email = serializers.EmailField(required=False, allow_blank=True)
        mobile_number = serializers.CharField(max_length=25, required=False)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cust_id = serializer.validated_data.pop("id")
        result = update_customer_service(cust_id, serializer.validated_data)
        return Response({"status": "SUCCESS", "message": "Customer updated successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleCustomerStatusView(APIView):
    """
    POST: Toggles a customer's active/inactive status.
    Payload: { id }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_customer_status_service(serializer.validated_data["id"])
        return Response({"status": "SUCCESS", "message": "Customer status updated successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteCustomerView(APIView):
    """
    POST: Deletes a customer profile.
    Payload: { id }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = delete_customer_service(serializer.validated_data["id"])
        return Response({"status": "SUCCESS", "message": "Customer deleted successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ExportCustomersCSVView(APIView):
    """
    Exports customers as a styled Excel (.xlsx) file.
    POST: Exports the exact customers visible on current screen/page.
    GET: Falls back to exporting all customers.
    """
    def _build_excel(self, customers):
        headers = ["S.No", "Name", "Mobile Number", "Role Name", "Status"]
        rows = []
        for idx, c in enumerate(customers, start=1):
            rows.append([
                idx,
                c.get("name", ""),
                c.get("mobile_number", ""),
                c.get("role_name", "Customer"),
                c.get("status", ""),
            ])

        return build_styled_excel_response(
            filename="SM_VegMart_Customers.xlsx",
            sheet_title="Customers",
            headers=headers,
            rows=rows
        )

    def post(self, request):
        customers_payload = request.data.get("customers")
        if customers_payload and isinstance(customers_payload, list) and len(customers_payload) > 0:
            return self._build_excel(customers_payload)
        result = fetch_all_customers_service()
        return self._build_excel(result.get("customers", []))

    def get(self, request):
        result = fetch_all_customers_service()
        return self._build_excel(result.get("customers", []))
