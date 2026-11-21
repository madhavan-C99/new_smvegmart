import api from "./apiClient";

export const dashboardAPI = {
  /**
   * Fetch complete Dashboard data (Metrics, Top Products, Revenue Distribution, Active Dispatch Queue)
   * GET /adm/fetch_dashboard_data?period=yearly|monthly|today&year=...&month=...
   */
  fetchDashboardData: (period = "yearly", year = null, month = null) => {
    const params = { period };
    if (year !== null && year !== undefined) params.year = year;
    if (month !== null && month !== undefined) params.month = month;
    return api.get("/adm/fetch_dashboard_data", { params });
  },

  /**
   * Export Dashboard Excel (.xlsx) / CSV with corporate green styling
   */
  exportReport: (period = "yearly", year = null, month = null) => {
    const params = { period, export: "xlsx" };
    if (year !== null && year !== undefined) params.year = year;
    if (month !== null && month !== undefined) params.month = month;
    return api.get("/adm/fetch_dashboard_data", {
      params,
      responseType: "blob",
    });
  },

  /**
   * Export live frontend dashboard data directly via POST
   */
  exportReportPost: (payload) => {
    return api.post("/adm/fetch_dashboard_data", payload, {
      responseType: "blob",
    });
  },
};

export default dashboardAPI;
