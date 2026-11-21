from django.urls import path
from .views.dashboard_views import FetchDashboardDataView
from .views.auth_views import (
    CreateToken,
    GenerateOtpView,
    VerifyOtpView,
    CreateAdminUserView,
)
from .views.category_views import (
    FetchAllCategoryView,
    FetchOneCategoryView,
    CreateCategoryView,
    UpdateCategoryView,
    ToggleCategoryStatusView,
    DeleteCategoryView,
    ExportCategoryCSVView,
)
from .views.subcategory_views import (
    FetchAllSubcategoryView,
    FetchOneSubcategoryView,
    CreateSubcategoryView,
    UpdateSubcategoryView,
    ToggleSubcategoryStatusView,
    DeleteSubcategoryView,
    ExportSubcategoryCSVView,
)
from .views.product_views import (
    FetchAllProductView,
    FetchOneProductView,
    CreateProductView,
    UpdateProductView,
    ToggleProductStatusView,
    ToggleDailyVegetablesView,
    DeleteProductView,
    ExportProductCSVView,
)
from .views.order_views import (
    FetchAllOrdersView,
    FetchOneOrderView,
    UpdateOrderStatusView,
    CancelOrderView,
    DeleteOrderItemView,
    ExportOrderCSVView,
    CreateTestOrderView,
)
from .views.delivery_agent_views import (
    FetchDeliveryAgentsView,
    AssignDeliveryAgentView,
    UnassignDeliveryAgentView,
)
from .views.delivery_boy_views import (
    FetchAllDeliveryBoysView,
    CreateDeliveryBoyView,
    UpdateDeliveryBoyView,
    DeleteDeliveryBoyView,
    ToggleDeliveryBoyStatusView,
    FetchDeliveryBoyDetailsView,
)
from .views.customer_views import (
    FetchAllCustomersView,
    ToggleCustomerStatusView,
    ExportCustomersCSVView,
)
from .views.notification_views import (
    FetchNotificationsView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)
from .views.delivery_configuration_views import (
    DeliveryConfigurationView,
    ToggleDeliveryOptionView,
    ToggleDeliveryDayView,
    ToggleDayTimingSlotView,
)
from .views.reminder_views import (
    FetchRemindersView,
    BroadcastRemindersView,
    DismissReminderView,
    ClearAllRemindersView,
    ResetRemindersView,
)


urlpatterns = [
    # Dashboard Analytics APIs
    path('fetch_dashboard_data', FetchDashboardDataView.as_view()),

    # Auth & Users
    path('create_token', CreateToken.as_view()),
    path('generate_otp', GenerateOtpView.as_view()),
    path('verify_otp', VerifyOtpView.as_view()),
    path('create_admin_user', CreateAdminUserView.as_view()),

    # Category Management APIs
    path('fetch_all_category', FetchAllCategoryView.as_view()),
    path('fetch_one_category', FetchOneCategoryView.as_view()),
    path('create_category', CreateCategoryView.as_view()),
    path('update_category', UpdateCategoryView.as_view()),
    path('toggle_category_status', ToggleCategoryStatusView.as_view()),
    path('delete_category', DeleteCategoryView.as_view()),
    path('export_category_csv', ExportCategoryCSVView.as_view()),

    # Subcategory Management APIs
    path('fetch_all_subcategory', FetchAllSubcategoryView.as_view()),
    path('fetch_one_subcategory', FetchOneSubcategoryView.as_view()),
    path('create_subcategory', CreateSubcategoryView.as_view()),
    path('update_subcategory', UpdateSubcategoryView.as_view()),
    path('toggle_subcategory_status', ToggleSubcategoryStatusView.as_view()),
    path('delete_subcategory', DeleteSubcategoryView.as_view()),
    path('export_subcategory_csv', ExportSubcategoryCSVView.as_view()),

    # Product Management APIs (Both REST HTTP and WebSocket ws/fetch_all_product/ supported)
    path('fetch_all_product', FetchAllProductView.as_view()),
    path('fetch_one_product', FetchOneProductView.as_view()),
    path('create_product', CreateProductView.as_view()),
    path('update_product', UpdateProductView.as_view()),
    path('toggle_product_status', ToggleProductStatusView.as_view()),
    path('toggle_daily_vegetables', ToggleDailyVegetablesView.as_view()),
    path('delete_product', DeleteProductView.as_view()),
    path('export_product_csv', ExportProductCSVView.as_view()),

    # Order Management APIs (Both REST HTTP and WebSocket supported)
    path('fetch_orders', FetchAllOrdersView.as_view()),
    path('fetch_one_order', FetchOneOrderView.as_view()),
    path('update_order_status', UpdateOrderStatusView.as_view()),
    path('cancel_order', CancelOrderView.as_view()),
    path('delete_order_item', DeleteOrderItemView.as_view()),
    path('export_orders_csv', ExportOrderCSVView.as_view()),
    path('create_test_order', CreateTestOrderView.as_view()),

    # Delivery Agent Management APIs
    path('fetch_delivery_agents', FetchDeliveryAgentsView.as_view()),
    path('assign_delivery_agent', AssignDeliveryAgentView.as_view()),
    path('unassign_delivery_agent', UnassignDeliveryAgentView.as_view()),

    # Delivery Boy Full CRUD Management APIs
    path('fetch_all_delivery_boys', FetchAllDeliveryBoysView.as_view()),
    path('create_delivery_boy', CreateDeliveryBoyView.as_view()),
    path('update_delivery_boy', UpdateDeliveryBoyView.as_view()),
    path('delete_delivery_boy', DeleteDeliveryBoyView.as_view()),
    path('toggle_delivery_boy_status', ToggleDeliveryBoyStatusView.as_view()),
    path('fetch_delivery_boy_details', FetchDeliveryBoyDetailsView.as_view()),

    # Customer Management APIs
    path('fetch_all_customers', FetchAllCustomersView.as_view()),
    # path('update_customer', UpdateCustomerView.as_view()),
    path('toggle_customer_status', ToggleCustomerStatusView.as_view()),
    # path('delete_customer', DeleteCustomerView.as_view()),
    path('export_customers_csv', ExportCustomersCSVView.as_view()),

    # Notification APIs
    path('fetch_notifications', FetchNotificationsView.as_view()),
    path('mark_notification_read', MarkNotificationReadView.as_view()),
    path('mark_all_notifications_read', MarkAllNotificationsReadView.as_view()),

    # Delivery Configuration & Schedule APIs
    path('delivery-configuration', DeliveryConfigurationView.as_view()),
    path('delivery-configuration/toggle-option', ToggleDeliveryOptionView.as_view()),
    path('delivery-configuration/toggle-day', ToggleDeliveryDayView.as_view()),
    path('delivery-configuration/toggle-slot', ToggleDayTimingSlotView.as_view()),

    # Operational Reminders APIs (WebSocket: ws/reminders/, HTTP: fetch_reminders)
    path('fetch_reminders', FetchRemindersView.as_view()),
    path('broadcast_reminders', BroadcastRemindersView.as_view()),
    path('dismiss_reminder', DismissReminderView.as_view()),
    path('clear_reminders', ClearAllRemindersView.as_view()),
    path('reset_reminders', ResetRemindersView.as_view()),
]
