import api from "./apiClient";

export const deliveryAPI = {
  /**
   * Fetch full delivery options configuration (REST fallback)
   */
  fetchConfiguration: () => api.get("/adm/delivery-configuration"),

  /**
   * Toggle order configuration option (express, scheduled, pickup)
   */
  toggleOption: (delivery_option, is_enabled = null) =>
    api.post("/adm/delivery-configuration/toggle-option", {
      delivery_option,
      is_enabled,
    }),

  /**
   * Toggle day availability for scheduled or pickup
   */
  toggleDay: (delivery_option, day_id, is_available = null) =>
    api.post("/adm/delivery-configuration/toggle-day", {
      delivery_option,
      day_id,
      is_available,
    }),

  /**
   * Toggle individual time slot mapping (OrderConfigDayTimings)
   */
  toggleSlot: (mapping_id, is_active = null) =>
    api.post("/adm/delivery-configuration/toggle-slot", {
      mapping_id,
      is_active,
    }),

  /**
   * Helper to compute WebSocket URL
   */
  getWsUrl: () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/delivery_options/`;
  },
};

export default deliveryAPI;
