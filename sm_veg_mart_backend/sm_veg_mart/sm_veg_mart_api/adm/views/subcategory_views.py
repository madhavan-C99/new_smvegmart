import csv
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import authentication_classes, permission_classes
from ..models.category import SubCategory
from ..models.products import Product
from ..services.subcategory_service import (
    fetch_all_subcategories,
    fetch_one_subcategory,
    create_subcategory,
    update_subcategory,
    toggle_subcategory_status,
    delete_subcategory
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllSubcategoryView(APIView):
    """
    GET: Returns all subcategories with parent category details and metrics.
    Optional Query Parameters:
      - ?search=<keyword>
      - ?category_id=<int>
      - ?is_active=true/false
    """
    def get(self, request):
        search = request.query_params.get('search')
        category_id = request.query_params.get('category_id')
        is_active_param = request.query_params.get('is_active')
        
        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ['true', '1']

        result = fetch_all_subcategories(search=search, category_id=category_id, is_active=is_active, request=request)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FetchOneSubcategoryView(APIView):
    """
    POST: Fetches single subcategory details by ID.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_subcategory(request=request, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CreateSubcategoryView(APIView):
    """
    POST: Creates a new subcategory linked to a category.
    Supports both JSON and Multipart (image upload) requests.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        category_id = serializers.IntegerField(required=False, allow_null=True)
        category_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        subcategory_img = serializers.ImageField(required=False, allow_null=True)
        display_order = serializers.IntegerField(required=False, allow_null=True)
        is_active = serializers.BooleanField(required=False, default=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = request.user.username if request.user.is_authenticated else "admin"
        result = create_subcategory(created_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class UpdateSubcategoryView(APIView):
    """
    POST: Updates an existing subcategory.
    Supports both JSON and Multipart (image upload) requests.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, allow_blank=True)
        category_id = serializers.IntegerField(required=False, allow_null=True)
        category_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        subcategory_img = serializers.ImageField(required=False, allow_null=True)
        display_order = serializers.IntegerField(required=False, allow_null=True)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = request.user.username if request.user.is_authenticated else "admin"
        result = update_subcategory(updated_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleSubcategoryStatusView(APIView):
    """
    POST: Toggles the is_active status of a subcategory.
    Payload: { "id": 1, "is_active": true/false }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_name = request.user.username if request.user.is_authenticated else "admin"
        result = toggle_subcategory_status(updated_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteSubcategoryView(APIView):
    """
    POST: Deletes/archives a subcategory.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = getattr(request.user, 'id', None)
        result = delete_subcategory(deleted_by=user_id, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


from .excel_utils import build_styled_excel_response


@authentication_classes([])
@permission_classes([])
class ExportSubcategoryCSVView(APIView):
    """
    Exports subcategories as a beautifully styled Excel (.xlsx) file.
    POST: Exports the exact subcategories visible on current screen/page.
    GET: Falls back to exporting all subcategories.
    """
    def _build_excel(self, subcategories):
        headers = [
            'S.No',
            'Subcategory Name',
            'Category Name',
            'Description',
            'Status',
            'Products Count',
        ]

        rows = []
        for index, sub in enumerate(subcategories, start=1):
            sub_name = (sub.name or "").strip() or "-"
            cat_name = sub.category.name if sub.category else "-"
            description = (sub.description or "").strip() or "-"
            status_text = "Active" if sub.is_active else "Inactive"
            prods_count = Product.objects.filter(subcategory=sub).count()
            rows.append([
                f"{index:02d}",
                sub_name,
                cat_name,
                description,
                status_text,
                prods_count,
            ])

        return build_styled_excel_response(
            filename="vegmart_subcategories.xlsx",
            sheet_title="Subcategories",
            headers=headers,
            rows=rows
        )

    def post(self, request):
        subcategories_payload = request.data.get("subcategories")
        if subcategories_payload and isinstance(subcategories_payload, list) and len(subcategories_payload) > 0:
            sub_ids = [s.get("id") for s in subcategories_payload if isinstance(s, dict) and s.get("id")]
            if sub_ids:
                subs = SubCategory.objects.filter(id__in=sub_ids)
                id_map = {s.id: s for s in subs}
                ordered = [id_map[i] for i in sub_ids if i in id_map]
                return self._build_excel(ordered)
        return self._build_excel(SubCategory.objects.all().order_by('display_order', 'id'))

    def get(self, request):
        return self._build_excel(SubCategory.objects.all().order_by('display_order', 'id'))
