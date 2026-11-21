import api from "./apiClient";

export const categoryAPI = {
  /**
   * 1. Fetch All Categories with live KPI metrics
   * GET /adm/fetch_all_category
   * Supports optional query params: { search, is_active }
   */
  fetchAllcategory: (params = {}) => api.get("/adm/fetch_all_category", { params }),

  /**
   * 2. Fetch One Category by ID
   * POST /adm/fetch_one_category
   */
  getCategoryById: (id) => api.post("/adm/fetch_one_category", { id }),

  /**
   * 3. Create a new Category (supports image upload)
   * POST /adm/create_category
   */
  createCategoryApi: (formData) =>
    api.post("/adm/create_category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * 4. Update an existing Category (supports image upload)
   * POST /adm/update_category
   */
  updateCategoryApi: (formData) =>
    api.post("/adm/update_category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * 5. Update Category Display Order Priority
   * POST /adm/update_category
   */
  updateDisplayOrder: (id, display_order) =>
    api.post("/adm/update_category", { id, display_order }),

  /**
   * 6. Toggle Category Status (Active <-> Inactive)
   * POST /adm/toggle_category_status
   */
  toggleCategoryStatus: (id, is_active) =>
    api.post("/adm/toggle_category_status", { id, is_active }),

  /**
   * 6. Delete a Category
   * POST /adm/delete_category
   */
  deleteCategory: (id) => api.post("/adm/delete_category", { id }),

  /**
   * 7. Export Categories CSV from Backend
   */
  exportCSV: (payload = {}) => {
    if (payload && (payload.categories || Array.isArray(payload))) {
      const data = Array.isArray(payload) ? { categories: payload } : payload;
      return api.post("/adm/export_category_csv", data, { responseType: "blob" });
    }
    return api.get("/adm/export_category_csv", { responseType: "blob" });
  },
};

export default categoryAPI;
