from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import authentication_classes, permission_classes
from ..services.delivery_service import get_delivery_options_service


@authentication_classes([])
@permission_classes([])
class DeliveryOptionsView(APIView):
    def get(self, request):
        data = get_delivery_options_service()
        return Response({
            "success": True,
            "data": data
        }, status=status.HTTP_200_OK)
