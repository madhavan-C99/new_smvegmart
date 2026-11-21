from django.contrib import admin
from django.urls import path
from .views.user_views import * 
from .views.otp_verified_views import *
from .views.auth_views import *
from .views.collection_query_views import *
from .views import CreateToken

urlpatterns = [
    path('create_token',CreateToken.as_view()),
    path('create_user',CreateUser.as_view()),
    path('create_role',CreateRole.as_view()),
    path('create_perm',CreatePerm.as_view()),
    path('add_perm_role',AddPermissionRole.as_view()),
    # path('fetch_all_users',FetchallUsers.as_view()), # Fetch all customers and admins
    path('admin_email_verification',EmailVerification.as_view()), # for login authentication for admin users

    path('add_collection_query',AddCollectionQuery.as_view()),
    path('generate_otp',GenerateOtpView.as_view()),  # for generating otp for user
    path('verify_otp',VerifyOtpView.as_view()), # for verifying the entered otp
    #admin crud


    path('get_select_options',GetSelectOption.as_view()),        #dropdown select option in query key 












]
