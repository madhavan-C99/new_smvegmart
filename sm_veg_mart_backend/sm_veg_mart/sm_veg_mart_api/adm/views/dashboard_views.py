import csv
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import authentication_classes, permission_classes
from ..services.dashboard_service import get_dashboard_summary_service
from .excel_utils import build_styled_dashboard_excel_response

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchDashboardDataView(APIView):
    """
    API endpoint to retrieve complete analytics, metrics, top products,
    and active dispatch queue for the Admin Dashboard.
    Supports styled Microsoft Excel (.xlsx) export matching the VegMart corporate theme.
    GET /adm/fetch_dashboard_data?period=yearly[&export=csv|excel|xlsx]
    POST /adm/fetch_dashboard_data (exports live frontend data as styled .xlsx)
    """
    def get(self, request):
        try:
            period = request.query_params.get('period', 'yearly')
            year = request.query_params.get('year')
            month = request.query_params.get('month')
            export_format = request.query_params.get('export', '').lower().strip()
            data = get_dashboard_summary_service(period=period, year=year, month=month, request=request)

            # Handle Styled Excel / CSV Export
            if export_format in ['csv', 'excel', 'xlsx']:
                filename_suffix = period
                if year:
                    filename_suffix += f"_{year}"
                if month and period == 'monthly':
                    filename_suffix += f"_{month}"
                
                return build_styled_dashboard_excel_response(
                    period=period,
                    data=data,
                    filename=f"vegmart_dashboard_report_{filename_suffix}.xlsx"
                )

            return Response({"status": "SUCCESS", "data": data}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in FetchDashboardDataView (GET): {e}", exc_info=True)
            return Response(
                {"status": "ERROR", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """
        Accepts currently filtered & displayed dashboard data from the frontend
        and returns a beautifully styled Microsoft Excel (.xlsx) file with VegMart green headers,
        alternating rows, colored status pills, and full Tamil/Unicode font support.
        """
        try:
            period = request.data.get('period', 'yearly')
            frontend_data = request.data.get('dashboardData') or {}
            active_orders = request.data.get('activeOrders')
            if active_orders is not None:
                frontend_data['active_dispatch_queue'] = active_orders

            return build_styled_dashboard_excel_response(
                period=period,
                data=frontend_data,
                filename=f"vegmart_dashboard_report_{period}.xlsx"
            )
        except Exception as e:
            logger.error(f"Error in FetchDashboardDataView (POST): {e}", exc_info=True)
            return Response(
                {"status": "ERROR", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
