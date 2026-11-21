import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from adm.services.delivery_configuration_service import (
    get_full_delivery_configuration_service,
    toggle_delivery_option_service,
    toggle_delivery_day_service,
    toggle_day_timing_slot_service
)

logger = logging.getLogger('django')


class DeliveryConfigurationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            data = get_full_delivery_configuration_service()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching delivery configuration: {e}", exc_info=True)
            return Response({"status": "ERROR", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ToggleDeliveryOptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            delivery_option = request.data.get("delivery_option")
            is_enabled = request.data.get("is_enabled")
            if not delivery_option:
                return Response({"message": "delivery_option is required."}, status=status.HTTP_400_BAD_REQUEST)

            result = toggle_delivery_option_service(delivery_option, is_enabled)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error toggling delivery option: {e}", exc_info=True)
            return Response({"status": "ERROR", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ToggleDeliveryDayView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            delivery_option = request.data.get("delivery_option", "scheduled")
            day_id = request.data.get("day_id")
            is_available = request.data.get("is_available")

            if not day_id:
                return Response({"message": "day_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            result = toggle_delivery_day_service(delivery_option, day_id, is_available)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error toggling delivery day: {e}", exc_info=True)
            return Response({"status": "ERROR", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ToggleDayTimingSlotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            mapping_id = request.data.get("mapping_id")
            is_active = request.data.get("is_active")

            if not mapping_id:
                return Response({"message": "mapping_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            result = toggle_day_timing_slot_service(mapping_id, is_active)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error toggling slot timing: {e}", exc_info=True)
            return Response({"status": "ERROR", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
