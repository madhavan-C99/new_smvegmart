import api from "./apiClient";

export const subcategoryAPI = {
  /**
   * 1. Fetch All Subcategories with metrics
   * GET /adm/fetch_all_subcategory
   * Supports optional query params: { search, category_id, is_active }
   */
  fetchAllSubcategories: (params = {}) => api.get("/adm/fetch_all_subcategory", { params }),

  /**
   * 2. Fetch One Subcategory by ID
   * POST /adm/fetch_one_subcategory
   */
  getSubcategoryById: (id) => api.post("/adm/fetch_one_subcategory", { id }),

  /**
   * 3. Create a new Subcategory (supports image upload)
   * POST /adm/create_subcategory
   */
  createSubcategoryApi: (formData) =>
    api.post("/adm/create_subcategory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * 4. Update an existing Subcategory (supports image upload)
   * POST /adm/update_subcategory
   */
  updateSubcategoryApi: (formData) =>
    api.post("/adm/update_subcategory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * 5. Toggle Subcategory Status (Active <-> Inactive)
   * POST /adm/toggle_subcategory_status
   */
  toggleSubcategoryStatus: (id, is_active) =>
    api.post("/adm/toggle_subcategory_status", { id, is_active }),

  /**
   * 6. Delete a Subcategory
   * POST /adm/delete_subcategory
   */
  deleteSubcategory: (id) => api.post("/adm/delete_subcategory", { id }),

  /**
   * 7. Export Subcategories CSV from Backend
   */
  exportCSV: (payload = {}) => {
    if (payload && (payload.subcategories || Array.isArray(payload))) {
      const data = Array.isArray(payload) ? { subcategories: payload } : payload;
      return api.post("/adm/export_subcategory_csv", data, { responseType: "blob" });
    }
    return api.get("/adm/export_subcategory_csv", { responseType: "blob" });
  },
};

export default subcategoryAPI;
