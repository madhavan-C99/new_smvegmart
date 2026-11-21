"""
sm_veg_mart_api/utils/log_utils.py
API Logging Utilities (Strictly for GET & POST methods)
- Sensitive data masking (Password, OTP, Token)
- Safe payload extraction
"""

import json

# Log-ல் தெரியக்கூடாத முக்கியமான Keys (Masking)
SENSITIVE_KEYS = {
    "password", "old_password", "new_password", 
    "otp", "token", "access", "refresh", 
    "authorization", "secret"
}


def mask_sensitive_data(data):
    """
    Dict அல்லது List-ல் உள்ள password, otp போன்ற sensitive fields-ஐ 
    '******' என மாற்றி தரும்.
    """
    if isinstance(data, dict):
        masked = {}
        for key, value in data.items():
            if str(key).lower() in SENSITIVE_KEYS:
                masked[key] = "******"
            elif isinstance(value, (dict, list)):
                masked[key] = mask_sensitive_data(value)
            else:
                masked[key] = value
        return masked
    elif isinstance(data, list):
        return [mask_sensitive_data(item) for item in data]
    return data


def extract_request_payload(request):
    """
    Only GET & POST முறைகளுக்கு மட்டும் Payload-ஐ எடுக்கும்.
    - POST: JSON body அல்லது Form Data
    - GET: Query Parameters (?search=tomato&page=1)
    """
    # 1. POST Request
    if request.method == "POST":
        if "application/json" in getattr(request, "content_type", ""):
            try:
                raw_body = request.body.decode("utf-8")
                data = json.loads(raw_body) if raw_body else {}
                return mask_sensitive_data(data)
            except Exception:
                return {}
        elif request.POST:
            return mask_sensitive_data(request.POST.dict())

    # 2. GET Request
    elif request.method == "GET" and request.GET:
        return mask_sensitive_data(request.GET.dict())

    return {}


def extract_response_payload(response):
    """
    API Response-ல் இருந்து data-வை எடுத்து mask செய்து தரும்.
    """
    try:
        # DRF Response object (response.data)
        if hasattr(response, 'data') and response.data is not None:
            return mask_sensitive_data(response.data)
        
        # Standard JSON HttpResponse
        if "application/json" in response.get("Content-Type", ""):
            content = response.content.decode("utf-8")
            return mask_sensitive_data(json.loads(content))
    except Exception:
        pass
    
    return {}
