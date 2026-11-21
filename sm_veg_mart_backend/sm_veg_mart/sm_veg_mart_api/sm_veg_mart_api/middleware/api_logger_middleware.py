"""
sm_veg_mart_api/middleware/api_logger_middleware.py
Global Request/Response Logger (Only for GET & POST)
"""

import logging
from adm.models.api_log import Api_Log
from sm_veg_mart_api.utils.log_utils import extract_request_payload, extract_response_payload

logger = logging.getLogger(__name__)

# Log செய்யத் தேவையில்லாத URL பாதைகள்
EXCLUDED_PATHS = [
    "/admin/",
    "/static/",
    "/media/",
    "/favicon.ico",
    "/ws/",
]


class APILoggerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        method = request.method

        # 1. GET & POST அல்லாத பிற முறைகளையும் (OPTIONS, HEAD), Static URL-களையும் Skip செய்கிறோம்
        if method not in ["GET", "POST"] or any(path.startswith(prefix) for prefix in EXCLUDED_PATHS):
            return self.get_response(request)

        # 2. Request Payload எடுத்தல் (Sensitive data masked)
        request_payload = extract_request_payload(request)

        # 3. View Execute ஆகுதல்
        response = self.get_response(request)

        # 4. Response Payload & Status Code எடுத்தல்
        response_payload = extract_response_payload(response)
        status_code = str(response.status_code)

        # 5. User விவரம் (Login செய்த பயனராக இருந்தால்)
        user = None
        if hasattr(request, "user") and request.user.is_authenticated:
            user = request.user

        # 6. adm_api_log டேபிளில் பாதுகாப்பாக சேமித்தல் (Fail-safe)
        try:
            Api_Log.objects.create(
                user=user,
                api_name=path[:100],
                method=method,
                request_payload=request_payload,
                response_payload=response_payload,
                status=status_code
            )
        except Exception as e:
            logger.error(f"api_logger_middleware_error | path={path} | err={str(e)}")

        return response
