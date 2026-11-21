from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from ..services.notification_service import (
    fetch_all_notifications_service,
    mark_notification_read_service,
    mark_all_notifications_read_service,
)
from ..services.order_service import notify_order_subscribers


class FetchNotificationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            notifications = fetch_all_notifications_service()
            return Response({
                "status": "SUCCESS",
                "count": len(notifications),
                "data": notifications
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkNotificationReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            order_id = request.data.get("order_id")
            notification_id = request.data.get("notification_id") or request.data.get("id")

            success = mark_notification_read_service(order_id=order_id, notification_id=notification_id)
            if success:
                notify_order_subscribers()
                return Response({
                    "status": "SUCCESS",
                    "message": "Notification marked as read"
                }, status=status.HTTP_200_OK)
            return Response({
                "status": "ERROR",
                "message": "Could not mark notification as read"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            success = mark_all_notifications_read_service()
            if success:
                notify_order_subscribers()
                return Response({
                    "status": "SUCCESS",
                    "message": "All notifications marked as read"
                }, status=status.HTTP_200_OK)
            return Response({
                "status": "ERROR",
                "message": "Could not mark all notifications as read"
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "status": "ERROR",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
