import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";

// Headers and Filter Controls
import OrderHeader from "../components/ordermanagement/OrderHeader";
import OrderFilterTabs from "../components/ordermanagement/OrderFilterTabs";
import OrderFilterBar from "../components/ordermanagement/OrderFilterBar";
import OrderDetailsDrawer from "../components/ordermanagement/OrderDetailsDrawer";

// 7 Dedicated Status Table Components (as requested)
import AllOrders from "../components/ordermanagement/AllOrders";
import NewOrders from "../components/ordermanagement/NewOrders";
import ConfirmedOrders from "../components/ordermanagement/ConfirmedOrders";
import ReadyDispatchOrders from "../components/ordermanagement/ReadyDispatchOrders";
import OutForDeliveryOrders from "../components/ordermanagement/OutForDeliveryOrders";
import DeliveredOrders from "../components/ordermanagement/DeliveredOrders";
import CancelledOrders from "../components/ordermanagement/CancelledOrders";

import orderAPI from "../services/orderAPI";
import { useOrderNotifications } from "../context/OrderNotificationContext";
import { useCommonPopup } from "../context/CommonPopupContext";
import { useReminders } from "../context/ReminderContext";

export default function OrderManagement() {
  const { showAlert } = useCommonPopup();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const location = useLocation();
  const { markReminderDone, clearWorkingTarget, activeWorkingTarget } = useReminders();

  const {
    orders,
    setOrders,
    deliveryAgents,
    setDeliveryAgents,
    loading,
    wsRef,
    markOrderAsRead,
    targetOrderId,
    setTargetOrderId,
    recordStatusTransition,
  } = useOrderNotifications();

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Screen Pagination State (for displaying & exporting only current screen items)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset pagination to first page whenever active tab, search, or filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, searchTerm, deliveryMode, dateFilter]);

  // Selected order state
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync selectedOrderId if arriving from reminder "Open Packing Order" or notification "View Order"
  const incomingTarget = targetOrderId || location.state?.targetOrderId;
  const targetTimestamp = location.state?.timestamp;
  const lastHandledKeyRef = useRef(null);

  useEffect(() => {
    const rawTarget = incomingTarget || location.state?.targetOrderId;
    if (!rawTarget) {
      if (!selectedOrderId && orders.length > 0) {
        setSelectedOrderId(orders[0].id);
      }
      return;
    }

    const currentActionKey = `${rawTarget}_${targetTimestamp || location.key || "init"}`;
    if (lastHandledKeyRef.current === currentActionKey && selectedOrderId) {
      return;
    }

    const cleanTarget = String(rawTarget).replace("#SM-", "").replace("#", "").trim();

    // Match order by integer id or order_id (#SM-...)
    const matched = orders.find((o) => {
      const oId = String(o.id || "").replace("#SM-", "").replace("#", "").trim();
      const oNum = String(o.order_id || "").replace("#SM-", "").replace("#", "").trim();
      return oId === cleanTarget || oNum === cleanTarget;
    });

    if (matched) {
      lastHandledKeyRef.current = currentActionKey;
      setSelectedOrderId(matched.id);
      setDrawerOpen(true);
      markOrderAsRead(matched.id);

      // Reset filters so the target order is clearly visible in table!
      setActiveTab("all");
      setSearchTerm("");
      setDeliveryMode("all");
      setDateFilter("all");

      // Auto-paginate to the exact screen page where this order resides!
      const orderIndex = orders.findIndex((o) => o.id === matched.id);
      if (orderIndex >= 0) {
        const targetPage = Math.floor(orderIndex / rowsPerPage);
        setPage(targetPage);
      }

      if (setTargetOrderId) {
        setTargetOrderId(null);
      }
    } else if (orders.length > 0) {
      lastHandledKeyRef.current = currentActionKey;
      setSelectedOrderId(cleanTarget);
      setDrawerOpen(true);
      if (setTargetOrderId) {
        setTargetOrderId(null);
      }
    }
  }, [incomingTarget, location.state, location.key, orders, selectedOrderId, rowsPerPage, markOrderAsRead, setTargetOrderId]);

  // Filter orders by search, delivery mode, and date
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Search filter: matches Order ID, Customer name, Phone, or Basket items
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesId = (o.order_id || String(o.id) || "").toLowerCase().includes(term);
        const matchesCust = (o.customer?.name || "").toLowerCase().includes(term);
        const matchesPhone = (o.customer?.phone || "").includes(term);
        const matchesItems =
          (o.items_preview || "").toLowerCase().includes(term) ||
          (o.basket || []).some((item) => (item.name || "").toLowerCase().includes(term));

        if (!matchesId && !matchesCust && !matchesPhone && !matchesItems) return false;
      }

      // 2. Delivery mode filter (case-insensitive)
      if (deliveryMode !== "all") {
        const modeTerm = deliveryMode.toLowerCase();
        const modeVal = String(o.delivery_mode || "").toLowerCase();
        const badgeVal = String(o.delivery_badge || "").toLowerCase();

        if (modeTerm.includes("express")) {
          if (!modeVal.includes("express") && !badgeVal.includes("express")) return false;
        } else if (modeTerm.includes("schedul")) {
          if (!modeVal.includes("schedul") && !badgeVal.includes("schedul")) return false;
        } else if (modeTerm.includes("pickup") || modeTerm.includes("shop")) {
          if (!modeVal.includes("pickup") && !badgeVal.includes("pickup") && !modeVal.includes("shop")) return false;
        } else {
          if (!modeVal.includes(modeTerm) && !badgeVal.includes(modeTerm)) return false;
        }
      }

      // 3. Date filter
      if (dateFilter !== "all") {
        if (dateFilter === "today") {
          const isToday =
            o.relative_day === "today" ||
            String(o.created_at || "").toLowerCase().includes("today") ||
            String(o.date_formatted || "").toLowerCase().includes("today");
          if (!isToday) return false;
        } else if (dateFilter === "yesterday") {
          const isYesterday =
            o.relative_day === "yesterday" ||
            String(o.created_at || "").toLowerCase().includes("yesterday") ||
            String(o.date_formatted || "").toLowerCase().includes("yesterday");
          if (!isYesterday) return false;
        } else {
          // Specific calendar date picked (YYYY-MM-DD)
          if (o.order_date) {
            if (o.order_date !== dateFilter) return false;
          } else {
            const rawStr = String(o.date_formatted || o.created_at || "");
            if (!rawStr.includes(dateFilter)) return false;
          }
        }
      }

      return true;
    });
  }, [orders, searchTerm, deliveryMode, dateFilter]);

  // Tab counts calculation dynamically based on active search, delivery mode, and date filters
  const tabCounts = useMemo(() => {
    const isMatch = (status, validList) =>
      validList.includes(String(status || "").toLowerCase().trim());

    return {
      all: filteredOrders.length,
      new_order: filteredOrders.filter((o) =>
        isMatch(o.status, ["new_order", "pending", "new order", "waiting", "placed"])
      ).length,
      confirmed: filteredOrders.filter((o) =>
        isMatch(o.status, ["confirmed", "packing", "confirmed & packing", "confirm & packing", "confirm and packing"])
      ).length,
      ready_for_dispatch: filteredOrders.filter((o) =>
        isMatch(o.status, [
          "ready_for_dispatch",
          "ready for dispatch",
          "dispatch",
          "dispatched",
          "ready for pick up",
          "ready_for_pick_up",
          "ready for pickup",
        ])
      ).length,
      out_for_delivery: filteredOrders.filter((o) =>
        isMatch(o.status, ["out_for_delivery", "out for delivery", "ofd"])
      ).length,
      delivered: filteredOrders.filter((o) =>
        isMatch(o.status, ["delivered", "done"])
      ).length,
      cancelled: filteredOrders.filter((o) =>
        isMatch(o.status, ["cancelled", "rejected"])
      ).length,
    };
  }, [filteredOrders]);

  // Selected Order object (matches numeric id or formatted #SM-... order_id)
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return orders[0] || null;
    const cleanTarget = String(selectedOrderId).replace("#SM-", "").replace("#", "").trim();
    return (
      orders.find((o) => {
        const oId = String(o.id).replace("#SM-", "").replace("#", "").trim();
        const oNum = String(o.order_id || "").replace("#SM-", "").replace("#", "").trim();
        return oId === cleanTarget || oNum === cleanTarget;
      }) ||
      orders[0] ||
      null
    );
  }, [orders, selectedOrderId]);

  // Handlers
  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    setDrawerOpen(true);
    // If admin moves away from the target reminder order to another order without changing state:
    if (activeWorkingTarget && String(activeWorkingTarget.targetId) !== String(order.id)) {
      clearWorkingTarget?.();
    }
    if (order?.id) {
      markOrderAsRead(order.id);
    }
  };

  const handleStatusTransition = async (orderId, newStatus) => {
    // Immediately dismiss any active reminder for this order across the dashboard and reduce count!
    if (markReminderDone) {
      const clean = String(orderId).replace("#SM-", "").replace("#", "").trim();
      markReminderDone(`order_${orderId}`);
      markReminderDone(`order_${clean}`);
    }
    clearWorkingTarget?.();

    const now = new Date();
    const nowTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const addMinutes = (date, mins) => {
      const d = new Date(date.getTime() + mins * 60000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isAccepting = ["confirmed", "packing", "confirmed & packing"].includes(
      String(newStatus || "").toLowerCase()
    );

    let updatedTimestamps = null;
    let extraData = {};
    if (isAccepting) {
      updatedTimestamps = {
        1: nowTime,
        2: nowTime,
        3: addMinutes(now, 7),
        4: addMinutes(now, 14),
        5: addMinutes(now, 25),
      };
      extraData = {
        accepted_time: nowTime,
        target_delivery_time: addMinutes(now, 25),
        lifecycle_timestamps: updatedTimestamps,
      };
    }

    const cleanTargetId = String(orderId).replace("#SM-", "").replace("#", "").trim();

    // 1. Lock transition immediately in Context so background sync/init_all cannot revert status!
    recordStatusTransition?.(cleanTargetId, newStatus, extraData);

    // 2. Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => {
        const oId = String(o.id).replace("#SM-", "").replace("#", "").trim();
        const oNum = String(o.order_id || "").replace("#SM-", "").replace("#", "").trim();
        if (oId === cleanTargetId || oNum === cleanTargetId) {
          if (!updatedTimestamps) {
            updatedTimestamps = { ...(o.lifecycle_timestamps || {}) };
          }

          let updatedDeliveryAgent = o.delivery_agent;
          let updatedRider = o.rider;
          const isOutForDelivery = ["out_for_delivery", "out for delivery", "ofd"].includes(
            String(newStatus || "").toLowerCase()
          );
          if (isOutForDelivery && o.delivery_agent) {
            updatedDeliveryAgent = {
              ...o.delivery_agent,
              status: "Busy",
              is_available: false,
            };
            if (o.rider) {
              updatedRider = {
                ...o.rider,
                status: "Busy",
                is_available: false,
              };
            }
          }

          return {
            ...o,
            status: newStatus,
            delivery_agent: updatedDeliveryAgent,
            rider: updatedRider,
            updated_time: nowTime,
            accepted_time: isAccepting ? nowTime : (o.accepted_time || nowTime),
            target_delivery_time: isAccepting ? addMinutes(now, 25) : (o.target_delivery_time || addMinutes(now, 25)),
            lifecycle_timestamps: updatedTimestamps,
          };
        }
        return o;
      })
    );

    // If order moved to 'Out for Delivery', rider moves to busy!
    const isOutForDelivery = ["out_for_delivery", "out for delivery", "ofd"].includes(
      String(newStatus || "").toLowerCase()
    );
    if (isOutForDelivery) {
      const targetOrder = orders.find((o) => {
        const oId = String(o.id).replace("#SM-", "").replace("#", "").trim();
        const oNum = String(o.order_id || "").replace("#SM-", "").replace("#", "").trim();
        return oId === cleanTargetId || oNum === cleanTargetId;
      });
      const riderId = targetOrder?.delivery_agent?.id || targetOrder?.rider?.id;
      if (riderId) {
        setDeliveryAgents((prev) =>
          prev.map((agent) =>
            agent.id === riderId
              ? {
                  ...agent,
                  is_available: false,
                  status: "busy",
                  active_orders_count: (agent.active_orders_count || 0) + 1,
                }
              : agent
          )
        );
      }
    }

    // If order reached 'Delivered' (or Cancelled), release the assigned rider back to Available!
    const isOrderFinished = ["delivered", "done", "cancelled", "rejected"].includes(
      String(newStatus || "").toLowerCase()
    );
    if (isOrderFinished) {
      const targetOrder = orders.find((o) => {
        const oId = String(o.id).replace("#SM-", "").replace("#", "").trim();
        const oNum = String(o.order_id || "").replace("#SM-", "").replace("#", "").trim();
        return oId === cleanTargetId || oNum === cleanTargetId;
      });
      const riderId = targetOrder?.delivery_agent?.id || targetOrder?.rider?.id;
      if (riderId) {
        setDeliveryAgents((prev) =>
          prev.map((agent) =>
            agent.id === riderId
              ? {
                  ...agent,
                  is_available: true,
                  status: "online",
                  active_orders_count: Math.max(0, (agent.active_orders_count || 1) - 1),
                }
              : agent
          )
        );
      }
    }

    try {
      // Send update over WebSocket (replaces HTTP /adm/update_order_status and /adm/cancel_order)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (String(newStatus).toLowerCase() === "cancelled") {
          wsRef.current.send(JSON.stringify({
            action: "cancel_order",
            id: orderId,
            reason: "Cancelled by Admin",
          }));
        } else {
          wsRef.current.send(JSON.stringify({
            action: "update_order_status",
            id: orderId,
            status: newStatus,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update status in backend via WebSocket:", err);
    }
  };

  const handleRemoveBasketItem = async (orderId, itemId) => {
    // 1. Optimistic UI update (instant response on screen)
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedBasket = (o.basket || []).filter((item) => item.id !== itemId);
          const newAmount = updatedBasket.reduce((sum, item) => sum + (item.price || 0), 0);
          return {
            ...o,
            basket: updatedBasket,
            items_count: updatedBasket.length,
            amount: newAmount,
          };
        }
        return o;
      })
    );

    // 2. Persist in Backend Database via WebSocket (replaces HTTP /adm/delete_order_item)
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: "delete_order_item",
          order_id: orderId,
          item_id: itemId,
        }));
      }
    } catch (err) {
      console.error("Failed to delete item from order in backend via WebSocket:", err);
    }
  };

  const handleAssignAgent = async (orderId, deliveryBoyId) => {
    const selectedAgent = deliveryAgents.find((a) => a.id === deliveryBoyId);
    const targetOrder = orders.find((o) => o.id === orderId);
    const isOfd = ["out_for_delivery", "out for delivery", "ofd"].includes(
      String(targetOrder?.status || "").toLowerCase().trim()
    );

    // 1. Optimistic UI update: Assign rider to order
    // In Dispatch / Packing (Instant Express & Scheduled): rider is Available!
    // ONLY when order is Out for Delivery (OFD) does the rider show Busy!
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            delivery_agent: selectedAgent
              ? {
                  id: selectedAgent.id,
                  name: selectedAgent.name,
                  phone: selectedAgent.phone || selectedAgent.mobile,
                  vehicle_number: selectedAgent.vehicle_number,
                  status: isOfd ? "Busy" : "Available",
                  is_available: !isOfd,
                }
              : null,
            rider: selectedAgent,
          };
        }
        return o;
      })
    );

    // 2. Rider in global agent list only becomes Busy if order is already in OFD
    if (isOfd) {
      setDeliveryAgents((prev) =>
        prev.map((agent) =>
          agent.id === deliveryBoyId
            ? {
                ...agent,
                is_available: false,
                status: "busy",
                active_orders_count: (agent.active_orders_count || 0) + 1,
              }
            : agent
        )
      );
    }

    // 3. Call assign API
    try {
      await orderAPI.assignDeliveryAgent(orderId, deliveryBoyId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "init_all" }));
      }
    } catch (err) {
      console.error("Failed to assign delivery agent:", err);
    }
  };

  const handleUnassignAgent = async (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const riderId = targetOrder?.delivery_agent?.id || targetOrder?.rider?.id;

    // 1. Optimistic UI update: Clear rider from order
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            delivery_agent: null,
            rider: null,
          };
        }
        return o;
      })
    );

    // 2. Optimistic UI update: Restore rider to AVAILABLE
    if (riderId) {
      setDeliveryAgents((prev) =>
        prev.map((agent) =>
          agent.id === riderId
            ? {
                ...agent,
                is_available: true,
                status: "online",
                active_orders_count: Math.max(0, (agent.active_orders_count || 1) - 1),
              }
            : agent
        )
      );
    }

    // 3. Call unassign API
    try {
      await orderAPI.unassignDeliveryAgent(orderId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "init_all" }));
      }
    } catch (err) {
      console.error("Failed to unassign delivery agent:", err);
    }
  };

  // Whatever orders are currently showing in the active table (matched by tab, search, delivery mode, and date filters)
  const displayedOrders = useMemo(() => {
    const isMatch = (status, validList) =>
      validList.includes(String(status || "").toLowerCase().trim());

    switch (activeTab) {
      case "new_order":
        return filteredOrders.filter((o) =>
          isMatch(o.status, ["new_order", "pending", "new order", "waiting", "placed"])
        );
      case "confirmed":
        return filteredOrders.filter((o) =>
          isMatch(o.status, ["confirmed", "packing", "confirmed & packing", "confirm & packing", "confirm and packing"])
        );
      case "ready_for_dispatch":
        return filteredOrders.filter((o) =>
          isMatch(o.status, [
            "ready_for_dispatch",
            "ready for dispatch",
            "dispatch",
            "dispatched",
            "ready for pick up",
            "ready_for_pick_up",
            "ready for pickup",
          ])
        );
      case "out_for_delivery":
        return filteredOrders.filter((o) => isMatch(o.status, ["out_for_delivery", "out for delivery", "ofd"]));
      case "delivered":
        return filteredOrders.filter((o) => isMatch(o.status, ["delivered", "done"]));
      case "cancelled":
        return filteredOrders.filter((o) => isMatch(o.status, ["cancelled", "rejected"]));
      case "all":
      default:
        return filteredOrders;
    }
  }, [filteredOrders, activeTab]);

  // Current screen orders slice (the exact rows currently visible on that screen)
  const currentScreenOrders = useMemo(() => {
    const start = page * rowsPerPage;
    return displayedOrders.slice(start, start + rowsPerPage);
  }, [displayedOrders, page, rowsPerPage]);

  const handleExportCSV = async () => {
    try {
      // Export ONLY the items present on the current screen (not items on other pages)
      const ordersToExport = currentScreenOrders.length > 0 ? currentScreenOrders : displayedOrders.slice(0, 10);
      const res = await orderAPI.exportCSV({ orders: ordersToExport });
      if (res?.data) {
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vegmart_orders_page_${page + 1}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export orders Excel from backend:", err);
      showAlert({
        title: "Export Failed",
        message: "Failed to export orders. Please verify backend service.",
        type: "error",
      });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDeliveryMode("all");
    setDateFilter("all");
    setActiveTab("all");
    setPage(0);
  };

  // Render the specific table component corresponding to active tab
  const renderActiveTableComponent = () => {
    const commonProps = {
      orders: displayedOrders,
      loading,
      selectedOrderId,
      onSelectOrder: handleSelectOrder,
      onViewOrder: handleSelectOrder,
      page,
      rowsPerPage,
      onPageChange: (e, newPage) => setPage(newPage),
      onRowsPerPageChange: (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      },
    };

    switch (activeTab) {
      case "new_order":
        return <NewOrders {...commonProps} />;
      case "confirmed":
        return <ConfirmedOrders {...commonProps} />;
      case "ready_for_dispatch":
        return <ReadyDispatchOrders {...commonProps} />;
      case "out_for_delivery":
        return <OutForDeliveryOrders {...commonProps} />;
      case "delivered":
        return <DeliveredOrders {...commonProps} />;
      case "cancelled":
        return <CancelledOrders {...commonProps} />;
      case "all":
      default:
        return <AllOrders {...commonProps} />;
    }
  };

  const isSplitViewActive = isDesktop && drawerOpen && Boolean(selectedOrder);

  return (
    <Box sx={{ p: { xs: 2, md: "32px" }, maxWidth: 1440, mx: "auto" }}>
      {/* 1. Header with Title & Export CSV */}
      <OrderHeader onExportCSV={handleExportCSV} />

      {/* 2. Top Filter Segment (Pill Tabs & Search Toolbar) */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderRadius: "12px",
          p: 2,
          mb: 2.5,
          border: "1px solid #eae7eb",
          boxShadow: "0px 1px 2px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Top Status Tabs */}
        <OrderFilterTabs
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId)}
          tabCounts={tabCounts}
        />

        {/* Search, Delivery Mode & Date toolbar */}
        <OrderFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          deliveryMode={deliveryMode}
          onDeliveryModeChange={setDeliveryMode}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onResetFilters={handleResetFilters}
        />
      </Box>

      {/* 3. Main Content: Split-Screen on Desktop, Full Table on Mobile/Tablet */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2.5,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Table Area (Flex shrinks when Drawer is open on desktop) */}
        <Box
          sx={{
            flex: isSplitViewActive ? "1 1 calc(100% - 460px)" : "1 1 100%",
            minWidth: 0,
            transition: "flex 0.25s ease",
          }}
        >
          {renderActiveTableComponent()}
        </Box>

        {/* Desktop Split-Screen Details Panel */}
        {isSplitViewActive && (
          <Box
            sx={{
              width: 440,
              minWidth: 440,
              height: "calc(100vh - 120px)",
              maxHeight: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              position: "sticky",
              top: 24,
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #dcdfe4",
              boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.08), 0px 8px 10px -6px rgba(0,0,0,0.06)",
              bgcolor: "#ffffff",
            }}
          >
            <OrderDetailsDrawer
              order={selectedOrder}
              deliveryAgents={deliveryAgents}
              onClose={() => {
                setDrawerOpen(false);
                clearWorkingTarget?.();
              }}
              onStatusTransition={handleStatusTransition}
              onRemoveItem={handleRemoveBasketItem}
              onAssignAgent={handleAssignAgent}
              onUnassignAgent={handleUnassignAgent}
            />
          </Box>
        )}
      </Box>

      {/* Overlay Drawer for Mobile & Tablet (< 1200px) */}
      {!isDesktop && (
        <Drawer
          anchor="right"
          open={drawerOpen && Boolean(selectedOrder)}
          onClose={() => {
            setDrawerOpen(false);
            clearWorkingTarget?.();
          }}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 440 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderTopLeftRadius: "16px",
              borderBottomLeftRadius: "16px",
            },
          }}
        >
          <OrderDetailsDrawer
            order={selectedOrder}
            deliveryAgents={deliveryAgents}
            onClose={() => {
              setDrawerOpen(false);
              clearWorkingTarget?.();
            }}
            onStatusTransition={handleStatusTransition}
            onRemoveItem={handleRemoveBasketItem}
            onAssignAgent={handleAssignAgent}
            onUnassignAgent={handleUnassignAgent}
          />
        </Drawer>
      )}
    </Box>
  );
}
