import api from "./apiClient";

export const productsAPI = {
  fetchAllProducts: (params = {}) => api.get("/adm/fetch_all_product", { params }),
  getProductById: (id) => api.post("/adm/fetch_one_product", { id }),
  deleteProductApi: (id) => api.post("/adm/delete_product", { id }),
  toggleProductStatus: (id, is_active) =>
    api.post("/adm/toggle_product_status", { id, is_active }),
  toggleDailyVegetables: (id, daily_vegetables) =>
    api.post("/adm/toggle_daily_vegetables", { id, daily_vegetables }),
  updateProduct: (formData) =>
    api.post("/adm/update_product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  addProductApi: (formData) =>
    api.post("/adm/create_product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  exportCSV: (payload = {}) => {
    if (payload && (payload.products || Array.isArray(payload))) {
      const data = Array.isArray(payload) ? { products: payload } : payload;
      return api.post("/adm/export_product_csv", data, { responseType: "blob" });
    }
    return api.get("/adm/export_product_csv", { responseType: "blob" });
  },
};

export default productsAPI;
