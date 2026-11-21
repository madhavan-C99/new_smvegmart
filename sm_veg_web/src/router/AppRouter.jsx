import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../apps/adm/context/AuthContext";
import adminRoutes from "../apps/adm/routes/adminRoutes";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Default redirect to admin categories */}
          <Route path="/" element={<Navigate to="/admin/categories" replace />} />

          {/* Shortcut direct auth paths */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          {/* Shortcut direct paths */}
          <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
          <Route path="/subcategories" element={<Navigate to="/admin/subcategories" replace />} />
          <Route path="/products" element={<Navigate to="/admin/products" replace />} />

          {/* Admin Application Routes */}
          {adminRoutes}

          {/* Fallback wildcard route */}
          <Route path="*" element={<Navigate to="/admin/categories" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
