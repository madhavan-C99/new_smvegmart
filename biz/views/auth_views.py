from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes

from ..services.auth_service import send_otp_service, verify_otp_service, update_profile_service, get_user_profile_service


@authentication_classes([])
@permission_classes([AllowAny])
class SendOTPView(APIView):
    class InputSerializer(serializers.Serializer):
        phone = serializers.CharField(max_length=15, required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = send_otp_service(**serializer.validated_data)
        return Response(response_data, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([AllowAny])
class VerifyOTPView(APIView):
    class InputSerializer(serializers.Serializer):
        otp = serializers.CharField(max_length=6, required=True)
        otp_id = serializers.IntegerField(required=False, allow_null=True, default=None)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = verify_otp_service(**serializer.validated_data)
        return Response(response_data, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class UpdateProfileView(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(max_length=100, required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = update_profile_service(user=request.user, **serializer.validated_data)
        return Response(response_data, status=status.HTTP_200_OK)

    def patch(self, request):
        return self.post(request)


@permission_classes([IsAuthenticated])
class GetUserProfileView(APIView):
    def get(self, request):
        data = get_user_profile_service(request.user)
        return Response({"data": data}, status=status.HTTP_200_OK)
