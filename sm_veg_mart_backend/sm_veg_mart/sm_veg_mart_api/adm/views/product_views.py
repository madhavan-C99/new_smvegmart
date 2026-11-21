import csv
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import authentication_classes, permission_classes
from ..models.products import Product
from ..services.product_service import (
    fetch_all_products,
    fetch_one_product,
    toggle_product_status,
    toggle_daily_vegetables,
    delete_product,
    create_product,
    update_product,
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchAllProductView(APIView):
    """
    GET: Returns all products with categories, subcategories, and variants.
    Both REST and WebSocket (ws/fetch_all_product/) supported.
    """
    def get(self, request):
        search = request.query_params.get('search')
        category_id = request.query_params.get('category_id')
        subcategory_id = request.query_params.get('subcategory_id')
        is_active_param = request.query_params.get('is_active')
        is_active = None
        if is_active_param is not None:
            is_active = is_active_param.lower() in ['true', '1']

        result = fetch_all_products(
            search=search,
            category_id=category_id,
            subcategory_id=subcategory_id,
            is_active=is_active,
            request=request
        )
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class FetchOneProductView(APIView):
    """
    POST: Fetches single product details by ID.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = fetch_one_product(request=request, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleProductStatusView(APIView):
    """
    POST: Toggles product Active / Inactive status.
    Payload: { "id": 1, "is_active": true/false }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        is_active = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_product_status(**serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class DeleteProductView(APIView):
    """
    POST: Deletes/archives a product.
    Payload: { "id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = delete_product(**serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class ToggleDailyVegetablesView(APIView):
    """
    POST: Toggles product daily_vegetables status.
    Payload: { "id": 1, "daily_vegetables": true/false }
    """
    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        daily_vegetables = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_daily_vegetables(**serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CreateProductView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        tamil_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
        product_img = serializers.ImageField(required=False, allow_null=True)
        category_id = serializers.IntegerField(required=False, allow_null=True)
        subcategory_id = serializers.IntegerField(required=False, allow_null=True)
        unit_value = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        selling_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
        mrp_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
        discount = serializers.IntegerField(required=False, allow_null=True, default=0)
        stock_quantity = serializers.IntegerField(required=False, allow_null=True, default=0)
        variants = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        is_active = serializers.BooleanField(required=False, default=True)
        daily_vegetables = serializers.BooleanField(required=False, default=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_name = getattr(request.user, 'username', None) or "admin"
        result = create_product(created_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class UpdateProductView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    class InputSerializer(serializers.Serializer):
        id = serializers.IntegerField(required=True)
        name = serializers.CharField(required=False, allow_blank=True)
        tamil_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        product_img = serializers.ImageField(required=False, allow_null=True)
        category_id = serializers.IntegerField(required=False, allow_null=True)
        subcategory_id = serializers.IntegerField(required=False, allow_null=True)
        unit_value = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        selling_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
        mrp_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
        discount = serializers.IntegerField(required=False, allow_null=True)
        stock_quantity = serializers.IntegerField(required=False, allow_null=True)
        variants = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        is_active = serializers.BooleanField(required=False)
        daily_vegetables = serializers.BooleanField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_name = getattr(request.user, 'username', None) or "admin"
        result = update_product(updated_by=user_name, **serializer.validated_data)
        return Response({"data": result}, status=status.HTTP_200_OK)


from .excel_utils import build_styled_excel_response


@authentication_classes([])
@permission_classes([])
class ExportProductCSVView(APIView):
    """
    Exports products and their variants as a beautifully styled Excel (.xlsx) file.
    POST: Exports the exact products visible on current screen/page.
    GET: Falls back to exporting all products.
    """
    def _build_excel(self, products):
        headers = [
            'S.No',
            'Product Name',
            'Tamil Name',
            'Category',
            'Subcategory',
            'Selling Price (₹)',
            'MRP (₹)',
            'Discount (%)',
            'Weight/Unit',
            'Stock Quantity',
            'Status',
            'Daily Vegetables',
        ]

        rows = []
        s_no = 1
        for prod in products:
            prod_name = (prod.name or "").strip() or "-"
            tamil_name = (prod.tamil_name or "").strip() or "-"
            cat_name = prod.category.name if prod.category else "-"
            sub_name = prod.subcategory.name if prod.subcategory else "-"
            status_text = "Active" if prod.is_active else "Inactive"
            daily_veg = "Yes" if getattr(prod, 'daily_vegetables', False) else "No"

            variants = list(prod.variants.all())
            if variants:
                for v in variants:
                    v_status = "Out of Stock" if v.stock_quantity <= 0 else status_text
                    selling_price = f"{v.selling_price:.2f}" if v.selling_price is not None else "-"
                    mrp_price = f"{v.mrp_price:.2f}" if v.mrp_price is not None else "-"
                    discount = f"{v.discount_percentage}%" if (v.discount_percentage and v.discount_percentage > 0) else "-"
                    unit = v.unit_value or (f"{v.weight_in_grams}g" if v.weight_in_grams else "-")
                    stock = v.stock_quantity if v.stock_quantity is not None else "-"

                    rows.append([
                        s_no,
                        prod_name,
                        tamil_name,
                        cat_name,
                        sub_name,
                        selling_price,
                        mrp_price,
                        discount,
                        unit,
                        stock,
                        v_status,
                        daily_veg,
                    ])
                    s_no += 1
            else:
                rows.append([
                    s_no,
                    prod_name,
                    tamil_name,
                    cat_name,
                    sub_name,
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    status_text,
                    daily_veg,
                ])
                s_no += 1

        return build_styled_excel_response(
            filename="vegmart_products.xlsx",
            sheet_title="Products",
            headers=headers,
            rows=rows
        )

    def post(self, request):
        products_payload = request.data.get("products")
        if products_payload and isinstance(products_payload, list) and len(products_payload) > 0:
            prod_ids = [p.get("id") for p in products_payload if isinstance(p, dict) and p.get("id")]
            if prod_ids:
                products = Product.objects.filter(id__in=prod_ids)
                id_map = {p.id: p for p in products}
                ordered_products = [id_map[i] for i in prod_ids if i in id_map]
                return self._build_excel(ordered_products)
        return self._build_excel(Product.objects.all().order_by('id'))

    def get(self, request):
        return self._build_excel(Product.objects.all().order_by('id'))
