import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from ..services.delivery_agent_service import (
    fetch_all_delivery_agents_service,
    assign_delivery_agent_service,
    unassign_delivery_agent_service
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class FetchDeliveryAgentsView(APIView):
    """
    GET: Fetches all registered delivery agents with their status and active orders.
    """
    def get(self, request):
        agents = fetch_all_delivery_agents_service()
        return Response({"status": "SUCCESS", "data": agents}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class AssignDeliveryAgentView(APIView):
    """
    POST: Assigns a delivery agent to an order.
    Payload: { "order_id": 1, "delivery_boy_id": 2 }
    """
    class InputSerializer(serializers.Serializer):
        order_id = serializers.IntegerField(required=True)
        delivery_boy_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = assign_delivery_agent_service(
            order_id=serializer.validated_data["order_id"],
            delivery_boy_id=serializer.validated_data["delivery_boy_id"]
        )
        return Response({"status": "SUCCESS", "message": "Delivery Agent assigned successfully", "data": result}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class UnassignDeliveryAgentView(APIView):
    """
    POST: Unassigns delivery agent from an order.
    Payload: { "order_id": 1 }
    """
    class InputSerializer(serializers.Serializer):
        order_id = serializers.IntegerField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = unassign_delivery_agent_service(order_id=serializer.validated_data["order_id"])
        return Response({"status": "SUCCESS", "message": "Delivery Agent unassigned", "data": result}, status=status.HTTP_200_OK)
