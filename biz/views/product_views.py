from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.product_service import (
    get_fresh_today_products,
    get_frequently_bought_products,
    get_category_products,
    search_products_service,
)


@authentication_classes([])
@permission_classes([])
class FreshTodayProductsView(APIView):
    class InputSerializer(serializers.Serializer):
        category_id = serializers.IntegerField(required=False, default=0, allow_null=True)
        limit = serializers.IntegerField(required=False, default=12, min_value=1, max_value=100)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = get_fresh_today_products(request, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FrequentlyBoughtProductsView(APIView):
    def get(self, request):
        data = get_frequently_bought_products(request)
        return Response({"data": data}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class GetCategoryProductsView(APIView):
    class InputSerializer(serializers.Serializer):
        category_id = serializers.IntegerField(required=True)
        sub_category_id = serializers.IntegerField(required=False, allow_null=True, default=None)
        page = serializers.IntegerField(required=False, default=1, min_value=1)
        limit = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response_data = get_category_products(request=request, **serializer.validated_data)
        return Response(response_data, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class SearchProductsView(APIView):
    class InputSerializer(serializers.Serializer):
        search_text = serializers.CharField(required=True, allow_blank=False, max_length=100)
        limit = serializers.IntegerField(required=False, default=8, min_value=1, max_value=50)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = search_products_service(request=request, **serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_200_OK)

