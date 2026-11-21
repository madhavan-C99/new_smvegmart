import csv
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import authentication_classes, permission_classes
from ..models.category import Category
from ..models.products import Product
from ..services.category_service import (
    fetch_all_categories,
    fetch_one_category,
    create_category,
    update_category,
    toggle_category_status,
    delete_category
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllCategoryView(APIView):
    """
    GET: Returns all categories and summary KPI metrics for Category Management.
    Optional Query Parameters:
      - ?search=<keyword> (filters by name or description)
      - ?is_active=true/false (filters by visibility)
    """
    def get(self, request):
        search = request.query_params.get('search')
        is_active_param = request.query_params.get('is_active')
        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ['true', '1']

        result = fetch_all_categories(search=search, is_active=is_active, request=request)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FetchOneCategoryView(APIView):
    """
    POST: Fetches single category details by ID.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_category(request=request, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CreateCategoryView(APIView):
    """
    POST: Creates a new category.
    Supports both JSON and Multipart (image upload) requests.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        category_img = serializers.ImageField(required=False, allow_null=True)
        display_order = serializers.IntegerField(required=False, allow_null=True)
        is_active = serializers.BooleanField(required=False, default=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_name = (
            getattr(request.user, 'first_name', None) or 
            getattr(request.user, 'username', None) or 
            "admin"
        )
        result = create_category(created_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class UpdateCategoryView(APIView):
    """
    POST: Updates an existing category.
    Supports both JSON and Multipart (image upload) requests.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, allow_blank=True)
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        category_img = serializers.ImageField(required=False, allow_null=True)
        display_order = serializers.IntegerField(required=False)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = (
            getattr(request.user, 'first_name', None) or 
            getattr(request.user, 'username', None) or 
            "admin"
        )
        result = update_category(updated_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleCategoryStatusView(APIView):
    """
    POST: Toggles or explicitly updates the is_active status of a category.
    Payload: { "id": 1, "is_active": true/false }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = (
            getattr(request.user, 'first_name', None) or 
            getattr(request.user, 'username', None) or 
            "admin"
        )
        result = toggle_category_status(updated_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteCategoryView(APIView):
    """
    POST: Soft-deletes a category.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = getattr(request.user, 'id', None)
        result = delete_category(deleted_by=user_id, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


from .excel_utils import build_styled_excel_response


@authentication_classes([])
@permission_classes([])
class ExportCategoryCSVView(APIView):
    """
    Exports categories as a beautifully styled Excel (.xlsx) file.
    POST: Exports the exact categories visible on current screen/page.
    GET: Falls back to exporting all categories.
    """
    def _build_excel(self, categories):
        headers = [
            'S.No',
            'Category Name',
            'Description',
            'Status',
            'SKUs Count',
        ]

        rows = []
        for index, cat in enumerate(categories, start=1):
            skus_count = Product.objects.filter(category=cat).count()
            cat_name = (cat.name or "").strip() or "-"
            description = (cat.description or "").strip() or "-"
            status_text = "Active" if cat.is_active else "Inactive"
            rows.append([
                f"{index:02d}",
                cat_name,
                description,
                status_text,
                skus_count,
            ])

        return build_styled_excel_response(
            filename="vegmart_categories.xlsx",
            sheet_title="Categories",
            headers=headers,
            rows=rows
        )

    def post(self, request):
        categories_payload = request.data.get("categories")
        if categories_payload and isinstance(categories_payload, list) and len(categories_payload) > 0:
            cat_ids = [c.get("id") for c in categories_payload if isinstance(c, dict) and c.get("id")]
            if cat_ids:
                categories = Category.objects.filter(id__in=cat_ids)
                id_map = {c.id: c for c in categories}
                ordered = [id_map[i] for i in cat_ids if i in id_map]
                return self._build_excel(ordered)
        return self._build_excel(Category.objects.all().order_by('display_order', 'id'))

    def get(self, request):
        return self._build_excel(Category.objects.all().order_by('display_order', 'id'))
