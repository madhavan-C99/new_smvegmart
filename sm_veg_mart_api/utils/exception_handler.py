import uuid
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": _extract_error_message(response.data),
            "errors": response.data,
            "status_code": response.status_code
        }
        response.data = custom_data
        return response

    ref_id = f"ERR-{uuid.uuid4().hex[:6].upper()}"
    request = context.get('request')
    path = request.path if request else "Unknown Path"
    method = request.method if request else "Unknown Method"

    logger.error(
        f"[{ref_id}] 500 Crash on {method} {path} | Exception: {str(exc)}",
        exc_info=True
    )

    return Response(
        {
            "success": False,
            "message": "An unexpected error occurred. Please contact support.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "reference_id": ref_id,
            "status_code": 500
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def _extract_error_message(data):
    if isinstance(data, dict):
        first_val = next(iter(data.values()), None)
        return _extract_error_message(first_val)
    elif isinstance(data, list) and data:
        return _extract_error_message(data[0])
    return str(data) if data else "Validation error"
