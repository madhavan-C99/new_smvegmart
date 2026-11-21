import api from "./apiClient";

export const customerAPI = {
  // Fetch all customers with search & sorting
  fetchAllCustomers: (params = {}) =>
    api.get("/adm/fetch_all_customers", { params }),

  // Toggle active/inactive status
  toggleStatus: (id) =>
    api.post("/adm/toggle_customer_status", { id }),

  // Export CSV
  exportCSV: (payload = {}) => {
    if (payload && (payload.customers || Array.isArray(payload))) {
      const data = Array.isArray(payload) ? { customers: payload } : payload;
      return api.post("/adm/export_customers_csv", data, { responseType: "blob" });
    }
    return api.get("/adm/export_customers_csv", { responseType: "blob" });
  },
};

export default customerAPI;
