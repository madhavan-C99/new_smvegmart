import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.validators import UniqueValidator
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from django.utils import timezone
from ..services.user_service import *
from ..models import *

logger = logging.getLogger('django')

@authentication_classes([])
@permission_classes([])
class CreateUser(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True)
        email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all())])
        mobile_number = serializers.CharField(required=True, allow_null=True)
        role_id = serializers.IntegerField()
        password = serializers.CharField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usr = create_user(request.user.username, **serializer.validated_data)
        return Response({'data': {'user': usr}}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class CreatePerm(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True, validators=[UniqueValidator(queryset=Perm.objects.all())])
        display_value = serializers.CharField(required=True)
        code = serializers.CharField(required=True, validators=[UniqueValidator(queryset=Perm.objects.all())])
        perm_group = serializers.CharField(required=False)
        perm_cat = serializers.CharField(required=False, allow_null=True)

    def post(self, request):
        # authorize_request('api_perm_create_user', request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        perm_code = create_permission(request.user.username, **serializer.validated_data)
        return Response({'data': {'perm_code': perm_code}}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class CreateRole(APIView):
    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(required=True, validators=[UniqueValidator(queryset=Role.objects.all())])
        display_value = serializers.CharField(required=True)
        code = serializers.CharField(required=True, validators=[UniqueValidator(queryset=Role.objects.all())])
        description = serializers.CharField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_code = create_role(request.user.username, **serializer.validated_data)
        return Response({'data': {'role_code': role_code}}, status=status.HTTP_200_OK)
    
@authentication_classes([])
@permission_classes([])  
class AddPermissionRole(APIView):
    class InputSerializers(serializers.Serializer):
        role_id=serializers.IntegerField(required=True)
        perm_id=serializers.IntegerField(required=True)
        
    def post(self,request):
        serializer=self.InputSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data=add_perm_to_role(**serializer.validated_data)
        
        return Response({"data":data},status=status.HTTP_201_CREATED)



class GetSelectOption(APIView):
    class InputSerializers(serializers.Serializer):
        fields=serializers.CharField(required=True)
    
    def post(self,request):
        print(1)
        serializer=self.InputSerializers(data=request.data)
        serializer.is_valid(raise_exception=True)
        data=get_select_options(**serializer.validated_data)
        
        return Response({"data":data},status=status.HTTP_202_ACCEPTED)
    