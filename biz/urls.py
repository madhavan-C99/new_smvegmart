from django.urls import path
from .views.auth_views import *
from .views.category_views import *
from .views.product_views import *
from .views.cart_views import *
from .views.address_views import *
from .views.delivery_views import *
from .views.order_views import *

urlpatterns = [

    # Authentication APIs
    path("send_otp", SendOTPView.as_view()),
    path("verify_otp", VerifyOTPView.as_view()),
    path("update_profile", UpdateProfileView.as_view()),
    path("get_user_profile", GetUserProfileView.as_view()),

    # Address Management APIs
    path("add_address", AddAddressView.as_view()),
    path("get_user_addresses", GetUserAddressesView.as_view()),

    # Category and Subcategory APIs
    path("get_navbar_categories", GetAllCategoriesView.as_view()),
    path("get_sidebar_sub_categories", GetSubCategoriesView.as_view()),
    path("get_category_right_grid_products", GetCategoryProductsView.as_view()),

    # Home Page & Product APIs
    path("get_fresh_today_products", FreshTodayProductsView.as_view()),
    path("get_frequently_bought_products", FrequentlyBoughtProductsView.as_view()),
    path("search_products", SearchProductsView.as_view()),

    # Cart APIs
    path("get_cart", GetCartView.as_view()),
    path("update_cart_item", UpdateCartItemView.as_view()),

    # Delivery Options API
    path("get_delivery_options", DeliveryOptionsView.as_view()),

    # Order APIs
    path("place_order", PlaceOrderView.as_view()),
    path("get_orders", GetUserOrdersView.as_view()),
    path("get_order_details", GetOrderDetailsView.as_view()),
    path("reorder_order", ReorderOrderView.as_view()),
]
