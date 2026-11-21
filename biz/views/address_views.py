from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from ..services.address_service import add_address_service, get_user_addresses_service


@permission_classes([IsAuthenticated])
class AddAddressView(APIView):
    class InputSerializer(serializers.Serializer):
        label = serializers.CharField(max_length=50, required=False, default="Home")
        house_flat_no = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
        apartment_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
        landmark = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
        area_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
        full_address = serializers.CharField(max_length=500, required=True)
        pincode = serializers.CharField(max_length=20, required=True)
        latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True, default=None)
        longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True, default=None)
        delivery_mode = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True, default=None)
        is_default = serializers.BooleanField(required=False, default=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_address = add_address_service(user=request.user, **serializer.validated_data)
        return Response({
            "success": True,
            "message": "Address saved successfully",
            "data": saved_address
        }, status=status.HTTP_201_CREATED)


@permission_classes([IsAuthenticated])
class GetUserAddressesView(APIView):
    def get(self, request):
        addresses = get_user_addresses_service(user=request.user)
        return Response({
            "success": True,
            "total_addresses": len(addresses),
            "data": addresses
        }, status=status.HTTP_200_OK)
