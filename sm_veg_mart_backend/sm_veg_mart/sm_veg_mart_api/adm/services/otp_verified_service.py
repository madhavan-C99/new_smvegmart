from ..models.user import User
from ..models.otp_verification import OTPVerification
from rest_framework.exceptions import APIException
import random
from adm.utils.time_utils import get_ist_now

def validate_email(**data):
    try:
        user=User.objects.filter(email=data.get('email'),is_active=True).first()
        if user:
            new_otp=random.randint(100000, 999999)
            current_time=get_ist_now()

            new_entry=OTPVerification.objects.create(user_id=data.get('user_id'),email_id=data.get('email'),
                                                otp=int(new_otp),expired_in_min=5,verified_otp_time=current_time,
                                                created_by=data.get('username'))
            data={}
            data.update({
                'message':'OTP sent Successfully & please your Email',
                'otp':new_otp,'user_id':user.id,
                'otp_id':new_entry.id
            })
            return data
        else:
            raise APIException('This Email is not registered on our site')
    except Exception as e:
        raise APIException(e)