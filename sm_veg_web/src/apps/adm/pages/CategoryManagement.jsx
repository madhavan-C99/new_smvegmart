import { useState, useEffect, useMemo } from "react";
import { Box, Alert, Button } from "@mui/material";
import CategoryHeader from "../components/categorymanagement/CategoryHeader";
import CategoryStats from "../components/categorymanagement/CategoryStats";
import CategoryTable from "../components/categorymanagement/CategoryTable";
import AddCategoryModal from "../components/categorymanagement/AddCategoryModal";
import categoryAPI from "../services/categoryAPI";
import { getMediaUrl } from "../services/apiClient";
import { useCommonPopup } from "../context/CommonPopupContext";

export default function CategoryManagement() {
  const { showConfirm, showAlert } = useCommonPopup();
  const [state, setState] = useState({
    categories: [],
    metrics: {
      total_categories: 0,
      active_categories: 0,
      inactive_categories: 0,
      published_percent: 0,
      total_skus: 0,
    },
    loading: false,
    errorMessage: null,
    searchTerm: "",
    modalOpen: false,
    editingCategory: null,
  });

  const {
    categories,
    metrics,
    loading,
    errorMessage,
    searchTerm,
    modalOpen,
    editingCategory,
  } = state;

  // Fetch real categories & metrics exclusively from Backend API
  const loadCategories = async () => {
    try {
      const res = await categoryAPI.fetchAllcategory();
      if (res.data?.data) {
        const rawCategories = res.data.data.categories || [];
        const formatted = rawCategories.map((cat) => ({
          ...cat,
          image: getMediaUrl(cat.image),
        }));
        setState((prev) => ({
          ...prev,
          categories: formatted,
          metrics: res.data.data.metrics || prev.metrics,
          loading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, categories: [], loading: false }));
      }
    } catch (err) {
      console.error("Backend connection error:", err);
      setState((prev) => ({
        ...prev,
        categories: [],
        loading: false,
        errorMessage:
          "Could not connect to Django backend at http://127.0.0.1:8000. Please start your server using: python manage.py runserver 8000",
      }));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.description?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Live Metrics directly from backend or calculated from real database rows
  const totalCategories = metrics.total_categories !== undefined ? metrics.total_categories : categories.length;
  const activeCount =
    metrics.active_categories !== undefined
      ? metrics.active_categories
      : categories.filter((c) => c.visibility).length;
  const inactiveCount =
    metrics.inactive_categories !== undefined
      ? metrics.inactive_categories
      : categories.filter((c) => !c.visibility).length;
  const publishedPercent =
    metrics.published_percent !== undefined
      ? metrics.published_percent
      : totalCategories > 0
      ? ((activeCount / totalCategories) * 100).toFixed(1)
      : 0;
  const totalSkus =
    metrics.total_skus !== undefined
      ? metrics.total_skus
      : categories.reduce((sum, c) => sum + (c.skus_count || 0), 0);

  // Toggle Visibility in Backend
  const handleToggleVisibility = async (id) => {
    const target = categories.find((c) => c.id === id);
    const newStatus = target ? !target.visibility : true;

    // Optimistic UI update
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === id
          ? { ...cat, visibility: newStatus, status: newStatus ? "Active" : "Inactive" }
          : cat
      ),
    }));

    try {
      await categoryAPI.toggleCategoryStatus(id, newStatus);
      loadCategories();
    } catch (err) {
      console.error("Failed to toggle status in backend:", err);
      loadCategories();
    }
  };

  // Delete Category in Backend
  const handleDelete = (id) => {
    const targetCategory = state.categories.find((c) => c.id === id);
    const categoryName = targetCategory?.name ? ` "${targetCategory.name}"` : "";

    showConfirm({
      title: "Delete Category?",
      message: `Are you sure you want to delete this category${categoryName}? This action will permanently remove it from the catalog.`,
      confirmText: "Delete Category",
      type: "danger",
      onConfirm: async () => {
        try {
          await categoryAPI.deleteCategory(id);
          loadCategories();
        } catch (err) {
          console.error("Failed to delete category in backend:", err);
          setState((prev) => ({
            ...prev,
            categories: prev.categories.filter((cat) => cat.id !== id),
          }));
        }
      },
    });
  };


  // Create / Update Category in Backend
  const handleSaveCategory = async (categoryData) => {
    try {
      const formData = new FormData();
      if (categoryData.id) {
        formData.append("id", categoryData.id);
      }
      formData.append("name", categoryData.name);
      formData.append("description", categoryData.description || "");
      if (categoryData.display_order !== undefined && categoryData.display_order !== null) {
        formData.append("display_order", categoryData.display_order);
      }
      formData.append("is_active", categoryData.visibility);

      if (categoryData.imageFile) {
        formData.append("category_img", categoryData.imageFile);
      }

      if (editingCategory && categoryData.id) {
        await categoryAPI.updateCategoryApi(formData);
      } else {
        await categoryAPI.createCategoryApi(formData);
      }

      loadCategories();
    } catch (err) {
      console.error("Failed to save category to backend:", err);
      showAlert({
        title: "Failed to Save Category",
        message: err.response?.data?.detail || err.message || "An unexpected error occurred while saving the category.",
        type: "error",
      });
    }
    setState((prev) => ({ ...prev, editingCategory: null }));
  };

  const handleExportCSV = async (pageCategories) => {
    try {
      // Export ONLY the items present on the current screen
      const itemsToExport = Array.isArray(pageCategories) && pageCategories.length > 0 ? pageCategories : state.categories.slice(0, 10);
      const res = await categoryAPI.exportCSV({ categories: itemsToExport });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vegmart_categories_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export category Excel from backend:", err);
      showAlert({
        title: "Export Failed",
        message: "Failed to export categories. Please ensure the backend server is running.",
        type: "error",
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: "32px" }, maxWidth: 1440, mx: "auto" }}>
      {/* Error Alert when Backend is Offline */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "10px", fontSize: "13px" }}
          action={
            <Button color="inherit" size="small" onClick={loadCategories}>
              Retry
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* 1. Header with Title & Search */}
      <CategoryHeader
        searchTerm={searchTerm}
        onSearchChange={(term) => setState((prev) => ({ ...prev, searchTerm: term }))}
        onAddClick={() => {
          setState((prev) => ({ ...prev, editingCategory: null, modalOpen: true }));
        }}
      />

      {/* 2. 4 Summary Metric Cards (reflecting real database values) */}
      <CategoryStats
        totalCategories={totalCategories}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        publishedPercent={publishedPercent}
        totalSkus={totalSkus}
      />

      {/* 3. Table Component */}
      <CategoryTable
        categories={filteredCategories}
        totalCategories={totalCategories}
        loading={loading}
        onToggleVisibility={handleToggleVisibility}
        onEdit={(cat) => {
          setState((prev) => ({ ...prev, editingCategory: cat, modalOpen: true }));
        }}
        onDelete={handleDelete}
        onExportCSV={handleExportCSV}
      />

      {/* 4. Add / Edit Modal */}
      <AddCategoryModal
        open={modalOpen}
        onClose={() => {
          setState((prev) => ({ ...prev, modalOpen: false, editingCategory: null }));
        }}
        onSave={handleSaveCategory}
        editData={editingCategory}
        nextOrder={
          categories.reduce((max, c) => Math.max(max, c.display_order || 0), 0) + 1
        }
      />
    </Box>
  );
}
