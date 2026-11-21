import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

// Dashboard Sub-components matching Figma Frame 537:14882
import DashboardHeader from "../components/dashboard/DashboardHeader";
import MetricKpiGrid from "../components/dashboard/MetricKpiGrid";
import RevenueDistributionChart from "../components/dashboard/RevenueDistributionChart";
import TopSellingProductsCard from "../components/dashboard/TopSellingProductsCard";
import ActiveDispatchQueueTable from "../components/dashboard/ActiveDispatchQueueTable";

// Order Details Drawer for live management directly from the dashboard
import OrderDetailsDrawer from "../components/ordermanagement/OrderDetailsDrawer";

// Frontend Export Utility for PDF (with charts) & CSV
import {
  exportDashboardToPdf,
  exportDashboardToCsv,
} from "../utils/dashboardExportUtil";

// APIs & Contexts
import dashboardAPI from "../services/dashboardAPI";
import orderAPI from "../services/orderAPI";
import deliveryBoyAPI from "../services/deliveryBoyAPI";
import { useOrderNotifications } from "../context/OrderNotificationContext";

export default function Dashboard() {
  const [period, setPeriod] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      total_products: 0,
      products_delta: "+0",
      total_revenue: 0,
      revenue_delta: "0.0%",
      total_orders: 0,
      orders_delta: "0.0%",
      new_orders: 0,
    },
    revenue_distribution: [],
    top_selling_products: [],
    active_dispatch_queue: [],
    available_years: [2026, 2025, 2024],
  });

  // Drawer & Order Inspection State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deliveryAgents, setDeliveryAgents] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  // Exporting state
  const [isExporting, setIsExporting] = useState(false);

  // Real-time notifications context
  const { unreadOrders, recordStatusTransition } = useOrderNotifications();

  // 1. Fetch Dashboard Analytics Data
  const loadDashboardData = useCallback(async (
    selectedPeriod = period,
    year = selectedYear,
    month = selectedMonth,
    showSpinner = false
  ) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await dashboardAPI.fetchDashboardData(selectedPeriod, year, month);
      if (res?.data?.status === "SUCCESS" && res?.data?.data) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch dashboard data from server, using local defaults:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [period, selectedYear, selectedMonth]);

  // Initial & Filter change load
  useEffect(() => {
    loadDashboardData(period, selectedYear, selectedMonth, true);
  }, [period, selectedYear, selectedMonth, loadDashboardData]);

  // 2. Fetch Active Delivery Boys for the Drawer assignment
  useEffect(() => {
    const loadDeliveryBoys = async () => {
      try {
        const res = await deliveryBoyAPI.fetchAllDeliveryBoys();
        if (res?.data?.delivery_boys) {
          setDeliveryAgents(
            res.data.delivery_boys.map((boy) => ({
              id: boy.id,
              name: boy.name,
              phone: boy.phone,
              vehicle_number: boy.vehicle_number || "TN-01-AB-1234",
              is_available: boy.is_active && !boy.has_active_order,
              active_orders_count: boy.active_orders_count || 0,
            }))
          );
        }
      } catch (err) {
        console.warn("Delivery boys API fallback in dashboard:", err);
      }
    };
    loadDeliveryBoys();
  }, []);

  // 3. Auto-refresh: 15s interval matching Figma UI ("Auto-refresh: 15s")
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData(period, selectedYear, selectedMonth, false);
    }, 15000);
    return () => clearInterval(timer);
  }, [period, selectedYear, selectedMonth, loadDashboardData]);

  // 4. Merge incoming live orders from WebSocket into Active Dispatch Queue
  const mergedDispatchQueue = useMemo(() => {
    const baseQueue = dashboardData.active_dispatch_queue || [];
    if (!unreadOrders || unreadOrders.length === 0) return baseQueue;

    // Prepend newly arrived orders that are in pending/packing state
    const newLiveItems = unreadOrders
      .filter(
        (o) =>
          !baseQueue.some((b) => b.order_id === o.order_id || b.id === o.id)
      )
      .map((o) => ({
        id: o.id,
        order_id: o.order_id,
        customer_name: o.customer?.name || "Customer",
        customer_hub_zone: o.customer?.address || "Indiranagar, Sector 2",
        phone: o.customer?.phone || "+91 98450 28194",
        delivery_mode: o.delivery_badge || o.delivery_mode || "Express 25-Min",
        amount: o.amount || 0.0,
        status: o.status || "New Order",
        created_at: o.created_time || "Just now",
        rawOrder: o,
      }));

    return [...newLiveItems, ...baseQueue];
  }, [dashboardData.active_dispatch_queue, unreadOrders]);

  // 5. Handle Filter Controls (Period, Year, Month)
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
  };

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
  };

  // 6. Handle Export Report (100% Frontend - captures live charts, KPIs, products & table)
  const handleExportReport = async (format = "pdf") => {
    try {
      setIsExporting(true);
      if (format === "csv") {
        setToast({ open: true, message: "Exporting CSV report...", severity: "info" });
        exportDashboardToCsv({
          period,
          year: selectedYear,
          month: selectedMonth,
          dashboardData,
          activeOrders: mergedDispatchQueue,
        });
        setToast({ open: true, message: "Dashboard CSV exported successfully!", severity: "success" });
      } else {
        setToast({ open: true, message: "Generating PDF report with live charts and data...", severity: "info" });
        await exportDashboardToPdf({
          period,
          year: selectedYear,
          month: selectedMonth,
          dashboardData,
          activeOrders: mergedDispatchQueue,
        });
        setToast({ open: true, message: "Dashboard PDF report exported successfully!", severity: "success" });
      }
    } catch (err) {
      console.error("Export report error:", err);
      setToast({ open: true, message: "Failed to export report. Please try again.", severity: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  // 7. Handle Order Click to open Drawer
  const handleOrderClick = async (row) => {
    try {
      if (row.rawOrder) {
        setSelectedOrder(row.rawOrder);
      } else {
        try {
          const res = await orderAPI.getOrderById(row.id);
          if (res?.data?.order) {
            setSelectedOrder(res.data.order);
          } else {
            setSelectedOrder(row);
          }
        } catch {
          setSelectedOrder(row);
        }
      }
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error opening order details:", err);
    }
  };

  // 8. Drawer Actions Handlers
  const handleStatusTransition = async (orderId, newStatus) => {
    try {
      recordStatusTransition?.(orderId, newStatus);
      await orderAPI.updateOrderStatus(orderId, newStatus);
      setToast({
        open: true,
        message: `Order #${orderId} moved to ${newStatus}`,
        severity: "success",
      });
      loadDashboardData(period, false);
    } catch (err) {
      console.error("Status transition error:", err);
    }
  };

  const handleAssignAgent = async (orderId, deliveryBoyId) => {
    try {
      await orderAPI.assignRider(orderId, deliveryBoyId);
      setToast({ open: true, message: "Delivery agent assigned successfully!", severity: "success" });
      loadDashboardData(period, false);
    } catch (err) {
      console.error("Assign agent error:", err);
    }
  };

  const handleUnassignAgent = async (orderId) => {
    try {
      await orderAPI.assignRider(orderId, null);
      setToast({ open: true, message: "Delivery agent unassigned.", severity: "info" });
      loadDashboardData(period, false);
    } catch (err) {
      console.error("Unassign agent error:", err);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await orderAPI.cancelOrder(orderId, reason);
      setToast({ open: true, message: `Order #${orderId} cancelled.`, severity: "warning" });
      setDrawerOpen(false);
      loadDashboardData(period, false);
    } catch (err) {
      console.error("Cancel order error:", err);
    }
  };

  const handleDeleteOrderItem = async (orderId, itemId) => {
    try {
      await orderAPI.deleteOrderItem(orderId, itemId);
      setToast({ open: true, message: "Item removed from basket.", severity: "info" });
    } catch (err) {
      console.error("Delete order item error:", err);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1600,
        margin: "0 auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2.5, md: 3.5 },
      }}
    >
      {/* 1. Header Bar */}
      <DashboardHeader
        period={period}
        onPeriodChange={handlePeriodChange}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        availableYears={dashboardData.available_years || [2026, 2025, 2024]}
        onExportReport={handleExportReport}
        isExporting={isExporting}
      />

      {loading && !dashboardData.metrics ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#16a34a" }} />
        </Box>
      ) : (
        <Box id="dashboard-content" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* 2. Top Analytics Section (KPIs + Chart + Leaderboard) */}
          <Box id="dashboard-analytics-section" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Top Metric KPI Grid (4 Cards) */}
            <MetricKpiGrid metrics={dashboardData.metrics} />

            {/* Visual Analytics: Revenue Distribution (7 cols) + Top Products (5 cols) */}
            <Grid container spacing={3} alignItems="stretch">
              {/* Revenue Distribution 12-Month Stacked Bar Chart */}
              <Grid item xs={12} lg={7.2}>
                <RevenueDistributionChart
                  data={dashboardData.revenue_distribution}
                  period={period}
                  year={selectedYear}
                  month={selectedMonth}
                />
              </Grid>

              {/* Top-Selling Products Leaderboard Card */}
              <Grid item xs={12} lg={4.8}>
                <TopSellingProductsCard
                  products={dashboardData.top_selling_products}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 3. Bottom Active Dispatch Queue Table */}
          <Box id="dashboard-dispatch-section">
            <ActiveDispatchQueueTable
              orders={mergedDispatchQueue}
              totalActiveCount={dashboardData.metrics?.new_orders || 0}
              onOrderClick={handleOrderClick}
            />
          </Box>
        </Box>
      )}

      {/* Slide-out Order Details Drawer for live fulfillment & rider assignment */}
      <OrderDetailsDrawer
        order={selectedOrder}
        deliveryAgents={deliveryAgents}
        onClose={() => setDrawerOpen(false)}
        onStatusTransition={handleStatusTransition}
        onAssignAgent={handleAssignAgent}
        onUnassignAgent={handleUnassignAgent}
        onCancelOrder={handleCancelOrder}
        onDeleteOrderItem={handleDeleteOrderItem}
      />

      {/* Toast Feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
