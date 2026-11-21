import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from adm.services.reminder_service import (
    get_all_reminders_service,
    broadcast_reminders_data,
    clear_all_reminders_service,
    dismiss_reminder_service,
    reset_reminders_service,
)


logger = logging.getLogger('django')


class FetchRemindersView(APIView):
    """
    Returns the real-time operational reminders for SLA, packing prep, and stock refills.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            reminders = get_all_reminders_service()
            return Response({
                "status": "SUCCESS",
                "data": {
                    "reminders": reminders,
                    "total": len(reminders)
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching reminders: {e}", exc_info=True)
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BroadcastRemindersView(APIView):
    """
    Trigger manual broadcast of current reminders over WebSocket.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            broadcast_reminders_data()
            return Response({
                "status": "SUCCESS",
                "message": "Reminders broadcast triggered successfully."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error triggering reminders broadcast: {e}", exc_info=True)
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClearAllRemindersView(APIView):
    """
    Clears all active operational reminder messages.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            result = clear_all_reminders_service()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error clearing all reminders: {e}", exc_info=True)
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetRemindersView(APIView):
    """
    Resets reminder state so active reminders can re-evaluate.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            result = reset_reminders_service()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error resetting reminders: {e}", exc_info=True)
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DismissReminderView(APIView):
    """
    Dismisses/mutes a specific reminder (e.g. an Out-of-Stock product alert)
    so the admin will not receive it again.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            reminder_id = request.data.get('reminder_id') or request.data.get('id')
            result = dismiss_reminder_service(reminder_id)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error dismissing reminder: {e}", exc_info=True)
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


