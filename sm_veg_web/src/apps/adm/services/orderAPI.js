import api from "./apiClient";

export const orderAPI = {
  /**
   * 1. Fetch Orders (REST HTTP + WebSocket fallback)
   */
  fetchOrders: (params = {}) => api.get("/adm/fetch_orders", { params }),

  /**
   * 2. Fetch One Order by ID
   */
  getOrderById: (id) => api.post("/adm/fetch_one_order", { id }),

  /**
   * 3. Update Order Status
   */
  updateOrderStatus: (id, status, notes = "") =>
    api.post("/adm/update_order_status", { id, status, notes }),

  /**
   * 4. Assign Rider to Order
   */
  assignRider: (id, rider_id) =>
    api.post("/adm/assign_order_rider", { id, rider_id }),

  /**
   * 5. Cancel / Reject Order
   */
  cancelOrder: (id, reason = "") =>
    api.post("/adm/cancel_order", { id, reason }),

  /**
   * 6. Delete Order Item from Basket
   */
  deleteOrderItem: (order_id, item_id) =>
    api.post("/adm/delete_order_item", { order_id, item_id }),

  /**
   * WebSocket Helper Functions for Order Operations
   */
  sendFetchOneOrder: (socket, id) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "fetch_one_order", id }));
    }
  },

  sendUpdateOrderStatus: (socket, id, status, notes = "") => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "update_order_status", id, status, notes }));
    }
  },

  sendCancelOrder: (socket, id, reason = "") => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "cancel_order", id, reason }));
    }
  },

  sendDeleteOrderItem: (socket, order_id, item_id) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "delete_order_item", order_id, item_id }));
    }
  },

  /**
   * 7. Export Orders Excel (.xlsx)
   */
  exportCSV: (payload = {}) => {
    if (payload && (payload.orders || Array.isArray(payload))) {
      const data = Array.isArray(payload) ? { orders: payload } : payload;
      return api.post("/adm/export_orders_csv", data, { responseType: "blob" });
    }
    return api.get("/adm/export_orders_csv", { responseType: "blob" });
  },

  /**
   * 8. Delivery Agent Management
   */
  fetchDeliveryAgents: () => api.get("/adm/fetch_delivery_agents"),
  assignDeliveryAgent: (order_id, delivery_boy_id) =>
    api.post("/adm/assign_delivery_agent", { order_id, delivery_boy_id }),
  unassignDeliveryAgent: (order_id) =>
    api.post("/adm/unassign_delivery_agent", { order_id }),

  /**
   * 9. Notification Model APIs
   */
  fetchNotifications: () => api.get("/adm/fetch_notifications"),
  markNotificationRead: (order_id) => api.post("/adm/mark_notification_read", { order_id }),
  markAllNotificationsRead: () => api.post("/adm/mark_all_notifications_read"),
};

export default orderAPI;
