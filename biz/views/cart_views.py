from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from ..services.cart_service import get_cart_details, update_cart_item


@permission_classes([IsAuthenticated])
class GetCartView(APIView):
    def get(self, request):
        data = get_cart_details(request=request, user=request.user)
        return Response({
            "data": data
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class UpdateCartItemView(APIView):
    class InputSerializer(serializers.Serializer):
        product_id = serializers.IntegerField(required=True, min_value=1)
        variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
        qty = serializers.IntegerField(required=True, min_value=0)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_cart = update_cart_item(
            request=request,
            user=request.user,
            **serializer.validated_data
        )

        return Response({
            "message": "Cart updated successfully",
            "data": updated_cart
        }, status=status.HTTP_200_OK)
