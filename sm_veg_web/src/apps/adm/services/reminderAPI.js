import api from "./apiClient";

export const reminderAPI = {
  /**
   * Fetch all operational reminders (REST fallback / initial fetch)
   */
  fetchReminders: () => api.get("/adm/fetch_reminders"),

  /**
   * Request backend to broadcast current reminders to WebSocket subscribers
   */
  triggerBroadcast: () => api.post("/adm/broadcast_reminders"),

  /**
   * Clear all operational reminder messages
   */
  clearAllReminders: () => api.post("/adm/clear_reminders"),

  /**
   * Reset reminder state
   */
  resetReminders: () => api.post("/adm/reset_reminders"),

  /**
   * Dismiss/mute a specific reminder (e.g. Out of Stock alert)
   */
  dismissReminder: (reminder_id) =>
    api.post("/adm/dismiss_reminder", { reminder_id }),

  /**
   * Helper to compute WebSocket URL for the dedicated Reminders socket
   */

  getWsUrl: () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/reminders/`;
  },
};

export default reminderAPI;
