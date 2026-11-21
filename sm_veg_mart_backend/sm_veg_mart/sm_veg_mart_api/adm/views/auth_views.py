import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from ..services.auth_service import (
    create_token,
    generate_otp,
    verify_otp_and_create_token,
    create_admin_user_service,
)

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class CreateToken(APIView):
    class InputSerializer(serializers.Serializer):
        username = serializers.CharField()
        password = serializers.CharField(write_only=True)
        source = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token, user_details = create_token(**serializer.validated_data)
        return Response(
            {"data": {"token": token, "user": user_details}},
            status=status.HTTP_200_OK
        )


@authentication_classes([])
@permission_classes([])
class GenerateOtpView(APIView):
    class InputSerializers(serializers.Serializer):
        mobile = serializers.CharField(required=True)
        # email=serializers.EmailField(required=True)
    def post(self, request):
        serializer = self.InputSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        generateotp = generate_otp(serializer.validated_data)
        return Response({'data': generateotp}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class VerifyOtpView(APIView):
    class InputSerializer(serializers.Serializer):
        otp = serializers.CharField()
        otp_id = serializers.IntegerField()
    def post(self, request):
        # authorize_request('api_perm_verify_otp',request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = verify_otp_and_create_token(**serializer.validated_data)
        return Response({"data": data}, status=status.HTTP_202_ACCEPTED)


@authentication_classes([])
@permission_classes([])
class CreateAdminUserView(APIView):
    """
    API endpoint to create a new Admin user with credentials and permissions.
    POST /adm/create_admin_user
    POST /adm/create_admin_user/
    """
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True, max_length=100)
        email = serializers.EmailField(required=True)
        password = serializers.CharField(required=True, min_length=6, write_only=True)
        mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        is_superuser = serializers.BooleanField(required=False, default=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        creator = getattr(request.user, 'username', 'system') if request.user and request.user.is_authenticated else 'system'
        admin_data = create_admin_user_service(serializer.validated_data, creator=creator)
        return Response(
            {
                "status": "SUCCESS",
                "message": "Admin user created successfully.",
                "data": admin_data
            },
            status=status.HTTP_201_CREATED
        )

