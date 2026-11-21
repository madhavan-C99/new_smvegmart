import api from "./apiClient";

export const deliveryBoyAPI = {
  // Fetch all delivery boys with search & sorting
  fetchAllDeliveryBoys: (params = {}) =>
    api.get("/adm/fetch_all_delivery_boys", { params }),

  // Fetch single delivery boy details with delivery stats
  fetchDeliveryBoyDetails: (id) =>
    api.get("/adm/fetch_delivery_boy_details", { params: { id } }),

  // Add new delivery boy
  createDeliveryBoy: (payload) =>
    api.post("/adm/create_delivery_boy", payload),

  // Update existing delivery boy
  updateDeliveryBoy: (payload) =>
    api.post("/adm/update_delivery_boy", payload),

  // Delete delivery boy
  deleteDeliveryBoy: (id) =>
    api.post("/adm/delete_delivery_boy", { id }),

  // Toggle active/online status
  toggleStatus: (id) =>
    api.post("/adm/toggle_delivery_boy_status", { id }),
};

export default deliveryBoyAPI;
