import { Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import CategoryManagement from "../pages/CategoryManagement";
import SubcategoryManagement from "../pages/SubcategoryManagement";
import ProductsManagement from "../pages/ProductsManagement";
import OrderManagement from "../pages/OrderManagement";
import DeliveryBoyManagement from "../pages/DeliveryBoyManagement";
import CustomerManagement from "../pages/CustomerManagement";
import DeliveryOptions from "../pages/DeliveryOptions";

export const adminRoutes = (
  <>
    {/* Public Authentication Route */}
    <Route path="/admin/login" element={<LoginPage />} />

    {/* Protected Admin Console Routes */}
    <Route path="/admin" element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        {/* Default route redirects to Dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Catalog & Master Management */}
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="subcategories" element={<SubcategoryManagement />} />
        <Route path="products" element={<ProductsManagement />} />

        {/* User Management routes */}
        <Route path="users" element={<CustomerManagement />} />
        <Route path="customers" element={<Navigate to="/admin/users" replace />} />
        <Route path="users/customers" element={<Navigate to="/admin/users" replace />} />
        <Route path="users/delivery-boys" element={<Navigate to="/admin/delivery-boys" replace />} />
        <Route path="delivery-boys" element={<DeliveryBoyManagement />} />

        {/* Order Fulfillment & Delivery Configuration */}
        <Route path="orders" element={<OrderManagement />} />
        <Route path="delivery" element={<DeliveryOptions />} />
      </Route>
    </Route>
  </>
);

export default adminRoutes;
