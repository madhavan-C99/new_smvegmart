from .auth_views import CreateToken, GenerateOtpView, VerifyOtpView
from .category_views import (
    FetchAllCategoryView,
    FetchOneCategoryView,
    CreateCategoryView,
    UpdateCategoryView,
    ToggleCategoryStatusView,
    DeleteCategoryView,
    ExportCategoryCSVView,
)
from .subcategory_views import (
    FetchAllSubcategoryView,
    FetchOneSubcategoryView,
    CreateSubcategoryView,
    UpdateSubcategoryView,
    ToggleSubcategoryStatusView,
    DeleteSubcategoryView,
    ExportSubcategoryCSVView,
)
from .product_views import (
    FetchAllProductView,
    FetchOneProductView,
    ToggleProductStatusView,
    DeleteProductView,
    ToggleDailyVegetablesView,
    CreateProductView,
    UpdateProductView,
    ExportProductCSVView,
)
from .order_views import (
    FetchAllOrdersView,
    FetchOneOrderView,
    UpdateOrderStatusView,
    CancelOrderView,
    DeleteOrderItemView,
    ExportOrderCSVView,
    CreateTestOrderView,
)
from .delivery_agent_views import (
    FetchDeliveryAgentsView,
    AssignDeliveryAgentView,
    UnassignDeliveryAgentView,
)
from .delivery_boy_views import (
    FetchAllDeliveryBoysView,
    CreateDeliveryBoyView,
    UpdateDeliveryBoyView,
    DeleteDeliveryBoyView,
    ToggleDeliveryBoyStatusView,
    FetchDeliveryBoyDetailsView,
)
from .customer_views import (
    FetchAllCustomersView,
    UpdateCustomerView,
    ToggleCustomerStatusView,
    DeleteCustomerView,
    ExportCustomersCSVView,
)
from .dashboard_views import FetchDashboardDataView
from .delivery_configuration_views import (
    DeliveryConfigurationView,
    ToggleDeliveryOptionView,
    ToggleDeliveryDayView,
    ToggleDayTimingSlotView,
)
from .notification_views import (
    FetchNotificationsView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)
from .reminder_views import (
    FetchRemindersView,
    BroadcastRemindersView,
    ClearAllRemindersView,
    ResetRemindersView,
    DismissReminderView,
)
from .user_views import CreateUser, CreatePerm, CreateRole, AddPermissionRole
from .otp_verified_views import EmailVerification
from .collection_query_views import AddCollectionQuery
