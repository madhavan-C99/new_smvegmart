import { useState, useEffect, useMemo } from "react";
import { Box, Alert, Button } from "@mui/material";
import SubcategoryHeader from "../components/subcategorymanagement/SubcategoryHeader";
import SubcategoryTable from "../components/subcategorymanagement/SubcategoryTable";
import AddSubcategoryModal from "../components/subcategorymanagement/AddSubcategoryModal";
import subcategoryAPI from "../services/subcategoryAPI";
import categoryAPI from "../services/categoryAPI";
import { getMediaUrl } from "../services/apiClient";
import { useCommonPopup } from "../context/CommonPopupContext";

export default function SubcategoryManagement() {
  const { showConfirm, showAlert } = useCommonPopup();
  const [state, setState] = useState({
    subcategories: [],
    categories: [],
    loading: true,
    errorMessage: null,
    searchTerm: "",
    modalOpen: false,
    editingSubcategory: null,
  });

  const {
    subcategories,
    categories,
    loading,
    errorMessage,
    searchTerm,
    modalOpen,
    editingSubcategory,
  } = state;

  // Fetch real subcategories & categories from Backend API
  const loadSubcategories = async () => {
    try {
      const res = await subcategoryAPI.fetchAllSubcategories();
      if (res.data?.data) {
        const rawSubs = res.data.data.subcategories || [];
        const formatted = rawSubs.map((sub) => ({
          ...sub,
          image: getMediaUrl(sub.image),
        }));
        setState((prev) => ({ ...prev, subcategories: formatted, loading: false }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Backend error fetching subcategories:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        errorMessage:
          "Could not load subcategories from backend at http://127.0.0.1:8000. Please ensure Django is running.",
      }));
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.fetchAllcategory();
      if (res.data?.data?.categories) {
        setState((prev) => ({ ...prev, categories: res.data.data.categories }));
      }
    } catch {
      setState((prev) => ({ ...prev, categories: [] }));
    }
  };

  useEffect(() => {
    loadSubcategories();
    loadCategories();
  }, []);

  // Search filter
  const filteredSubcategories = useMemo(() => {
    if (!searchTerm.trim()) return subcategories;
    const term = searchTerm.toLowerCase();
    return subcategories.filter(
      (sub) =>
        sub.name?.toLowerCase().includes(term) ||
        sub.category_name?.toLowerCase().includes(term) ||
        sub.description?.toLowerCase().includes(term)
    );
  }, [subcategories, searchTerm]);

  const handleToggleVisibility = async (id) => {
    const target = subcategories.find((s) => s.id === id);
    const newStatus = target ? !target.visibility : true;

    // Optimistic UI update
    setState((prev) => ({
      ...prev,
      subcategories: prev.subcategories.map((sub) =>
        sub.id === id
          ? { ...sub, visibility: newStatus, status: newStatus ? "Active" : "Inactive" }
          : sub
      ),
    }));

    try {
      await subcategoryAPI.toggleSubcategoryStatus(id, newStatus);
      loadSubcategories();
    } catch (err) {
      console.error("Failed to toggle subcategory status in backend:", err);
      loadSubcategories();
    }
  };

  const handleDelete = (id) => {
    const targetSub = state.subcategories.find((item) => item.id === id);
    const subName = targetSub?.name ? ` "${targetSub.name}"` : "";

    showConfirm({
      title: "Delete Subcategory?",
      message: `Are you sure you want to delete this subcategory${subName}? Products linked to this subcategory may need reassignment.`,
      confirmText: "Delete Subcategory",
      type: "danger",
      onConfirm: async () => {
        try {
          await subcategoryAPI.deleteSubcategory(id);
          loadSubcategories();
        } catch (err) {
          console.error("Failed to delete subcategory in backend:", err);
          setState((prev) => ({
            ...prev,
            subcategories: prev.subcategories.filter((item) => item.id !== id),
          }));
        }
      },
    });
  };

  const handleSaveSubcategory = async (subcategoryData) => {
    try {
      const formData = new FormData();
      if (subcategoryData.id) {
        formData.append("id", subcategoryData.id);
      }
      formData.append("name", subcategoryData.name);
      if (subcategoryData.category_id) {
        formData.append("category_id", subcategoryData.category_id);
      } else if (subcategoryData.category_name) {
        formData.append("category_name", subcategoryData.category_name);
      }
      formData.append("description", subcategoryData.description || "");
      if (subcategoryData.display_order !== undefined && subcategoryData.display_order !== null) {
        formData.append("display_order", subcategoryData.display_order);
      }
      formData.append("is_active", subcategoryData.visibility !== undefined ? subcategoryData.visibility : true);

      if (subcategoryData.imageFile) {
        formData.append("subcategory_img", subcategoryData.imageFile);
      }

      if (editingSubcategory && subcategoryData.id) {
        await subcategoryAPI.updateSubcategoryApi(formData);
      } else {
        await subcategoryAPI.createSubcategoryApi(formData);
      }
      loadSubcategories();
    } catch (err) {
      console.error("Failed to save subcategory in backend:", err);
      showAlert({
        title: "Failed to Save Subcategory",
        message: err.response?.data?.detail || err.message || "An unexpected error occurred while saving the subcategory.",
        type: "error",
      });
    }
    setState((prev) => ({ ...prev, editingSubcategory: null }));
  };

  const handleExportCSV = async (pageSubcategories) => {
    try {
      // Export ONLY the items present on the current screen
      const itemsToExport = Array.isArray(pageSubcategories) && pageSubcategories.length > 0 ? pageSubcategories : state.subcategories.slice(0, 10);
      const res = await subcategoryAPI.exportCSV({ subcategories: itemsToExport });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vegmart_subcategories_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export subcategory Excel from backend:", err);
      showAlert({
        title: "Export Failed",
        message: "Failed to export subcategories. Please ensure the backend server is running.",
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
            <Button color="inherit" size="small" onClick={loadSubcategories}>
              Retry
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      {/* 1. Header with Title & Search */}
      <SubcategoryHeader
        searchTerm={searchTerm}
        onSearchChange={(term) => setState((prev) => ({ ...prev, searchTerm: term }))}
        onAddClick={() => {
          setState((prev) => ({
            ...prev,
            editingSubcategory: null,
            modalOpen: true,
          }));
        }}
      />

      {/* 2. Subcategory Table */}
      <SubcategoryTable
        subcategories={filteredSubcategories}
        totalSubcategories={subcategories.length}
        loading={loading}
        onToggleVisibility={handleToggleVisibility}
        onEdit={(sub) => {
          setState((prev) => ({
            ...prev,
            editingSubcategory: sub,
            modalOpen: true,
          }));
        }}
        onDelete={handleDelete}
        onExportCSV={handleExportCSV}
      />

      {/* 3. Add / Edit Subcategory Modal */}
      <AddSubcategoryModal
        open={modalOpen}
        onClose={() => {
          setState((prev) => ({
            ...prev,
            modalOpen: false,
            editingSubcategory: null,
          }));
        }}
        onSave={handleSaveSubcategory}
        categories={categories}
        editData={editingSubcategory}
        nextOrder={
          subcategories.reduce((max, s) => Math.max(max, s.display_order || 0), 0) + 1
        }
      />
    </Box>
  );
}
