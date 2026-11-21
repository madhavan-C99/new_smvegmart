import logging
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import authentication_classes, permission_classes
from ..services.collection_query_service import collection_query_service

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class AddCollectionQuery(APIView):
    class InputSerializer(serializers.Serializer):
        key = serializers.CharField()
        query = serializers.CharField()
    
    def post(self, request):
        #authorize_request('api_query',request.user)
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Cq = collection_query_service(**serializer.validated_data)
        return Response({'data': {'key': "success"}}, status=status.HTTP_201_CREATED)