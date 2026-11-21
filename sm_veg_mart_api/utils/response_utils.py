from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    payload.update(kwargs)
    return Response(payload, status=status_code)


def error_response(message="Something went wrong", errors=None, status_code=status.HTTP_400_BAD_REQUEST, error_code=None, **kwargs):
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
    }
    if error_code:
        payload["error_code"] = error_code
    payload.update(kwargs)
    return Response(payload, status=status_code)
