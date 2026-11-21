import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.exceptions import ValidationError

from ..services.delivery_boy_management_service import (
    fetch_all_delivery_boys_service,
    create_delivery_boy_service,
    update_delivery_boy_service,
    delete_delivery_boy_service,
    toggle_delivery_boy_status_service,
    get_delivery_boy_details_service
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllDeliveryBoysView(APIView):
    """
    GET: Fetches all delivery boys with search, sort, and order parameters.
    """
    def get(self, request):
        search = request.query_params.get("search", "")
        sort_by = request.query_params.get("sort_by", "normal")
        order_by = request.query_params.get("order_by", "asc")

        result = fetch_all_delivery_boys_service(search=search, sort_by=sort_by, order_by=order_by)
        return Response({"status": "SUCCESS", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CreateDeliveryBoyView(APIView):
    """
    POST: Adds a new delivery boy to the system.
    Payload: { name, email, mobile_number, password, address_line1, address_line2 }
    """
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(max_length=150, required=True)
        email = serializers.EmailField(required=True)
        mobile_number = serializers.CharField(max_length=25, required=True)
        password = serializers.CharField(max_length=128, required=True)
        address_line1 = serializers.CharField(max_length=255, required=True)
        address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
        vehicle_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
        driving_license_no = serializers.CharField(max_length=100, required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = create_delivery_boy_service(serializer.validated_data)
        return Response({"status": "SUCCESS", "message": "Delivery boy added successfully", "data": result}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class UpdateDeliveryBoyView(APIView):
    """
    POST: Updates an existing delivery boy's information.
    Payload: { id, name, email, mobile_number, address_line1, address_line2, status }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        name = serializers.CharField(max_length=150, required=False)
        email = serializers.EmailField(required=False)
        mobile_number = serializers.CharField(max_length=25, required=False)
        password = serializers.CharField(max_length=128, required=False, allow_blank=True)
        address_line1 = serializers.CharField(max_length=255, required=False, allow_blank=True)
        address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
        vehicle_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
        driving_license_no = serializers.CharField(max_length=100, required=False, allow_blank=True)
        status = serializers.CharField(max_length=20, required=False)
        is_available = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        boy_id = serializer.validated_data.pop("id")
        result = update_delivery_boy_service(boy_id, serializer.validated_data)
        return Response({"status": "SUCCESS", "message": "Delivery boy updated successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteDeliveryBoyView(APIView):
    """
    POST: Deactivates / removes a delivery boy.
    Payload: { id }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = delete_delivery_boy_service(serializer.validated_data["id"])
        return Response({"status": "SUCCESS", "message": "Delivery boy deleted successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleDeliveryBoyStatusView(APIView):
    """
    POST: Toggles active/available status of a delivery boy.
    Payload: { id }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_delivery_boy_status_service(serializer.validated_data["id"])
        return Response({"status": "SUCCESS", "message": "Status updated successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FetchDeliveryBoyDetailsView(APIView):
    """
    GET: Retrieves complete profile and metrics for a delivery boy.
    Query Params: ?id=1
    """
    def get(self, request):
        boy_id = request.query_params.get("id")
        if not boy_id:
            raise ValidationError({"id": "Delivery boy ID is required."})
        result = get_delivery_boy_details_service(int(boy_id))
        return Response({"status": "SUCCESS", "data": result}, status=status.HTTP_200_OK)
