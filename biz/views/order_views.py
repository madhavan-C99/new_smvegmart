from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from ..services.order_service import (
    place_order_service,
    get_user_orders_service,
    get_order_details,
    reorder_order
)


@permission_classes([IsAuthenticated])
class PlaceOrderView(APIView):
    class InputSerializer(serializers.Serializer):
        address_id = serializers.IntegerField(required=True, allow_null=True)
        delivery_mode = serializers.CharField(required=True)
        order_config_id = serializers.IntegerField(required=True, allow_null=True)
        order_day_config_timings_id = serializers.IntegerField(required=True, allow_null=True)
        scheduled_date = serializers.DateField(required=True, allow_null=True)
        items = serializers.ListField(required=True, allow_empty=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_data = place_order_service(user=request.user, validated_data=serializer.validated_data)

        return Response({
            "success": True,
            "message": "Order placed successfully",
            "data": order_data
        }, status=status.HTTP_201_CREATED)


@permission_classes([IsAuthenticated])
class GetUserOrdersView(APIView):
    class InputSerializer(serializers.Serializer):
        status = serializers.ChoiceField(
            choices=["all", "active", "delivered"],
            default="all",
            required=False
        )
        page = serializers.IntegerField(default=1, required=False, min_value=1)
        limit = serializers.IntegerField(default=10, required=False, min_value=1)
        search = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = get_user_orders_service(
            request=request,
            user=request.user,
            **serializer.validated_data
        )
        return Response({
            "success": True,
            "message": "Orders fetched successfully",
            "data": data
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class GetOrderDetailsView(APIView):
    class InputSerializer(serializers.Serializer):
        order_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_details = get_order_details(
            request=request,
            user=request.user,
            **serializer.validated_data
        )
        return Response({
            "success": True,
            "message": "Order details fetched successfully",
            "data": order_details
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class ReorderOrderView(APIView):
    class InputSerializer(serializers.Serializer):
        order_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reordered_data = reorder_order(
            user=request.user,
            **serializer.validated_data
        )
        return Response({
            "success": True,
            "message": "Items reordered and added to cart successfully",
            "data": reordered_data
        }, status=status.HTTP_200_OK)
