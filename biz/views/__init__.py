from .category_views import (
    GetAllCategoriesView,
    GetSubCategoriesView,
)
from .product_views import (
    FreshTodayProductsView,
    FrequentlyBoughtProductsView,
    GetCategoryProductsView,
)
from .auth_views import (
    SendOTPView,
    VerifyOTPView,
    GetUserProfileView,
)
from .cart_views import (
    GetCartView,
    UpdateCartItemView,
)
from .address_views import (
    AddAddressView,
    GetUserAddressesView,
)
from .delivery_views import (
    DeliveryOptionsView,
)
from .order_views import (
    PlaceOrderView,
)

