from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.category_service import (
    get_all_categories,
    get_sub_categories,
)


@authentication_classes([])
@permission_classes([])
class GetAllCategoriesView(APIView):
    def get(self, request):
        data = get_all_categories(request)
        return Response({"data": data}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class GetSubCategoriesView(APIView):
    class InputSerializer(serializers.Serializer):
        category_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = get_sub_categories(request=request, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)
