import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NewOrderAlertModal from "../components/notification/NewOrderAlertModal";
import orderAlertSound from "../utils/orderAlertSound";
import orderAPI from "../services/orderAPI";

const OrderNotificationContext = createContext(null);

export const SAMPLE_ORDERS_PREVIEW = [
  {
    id: 93001,
    order_id: "#SM-93001",
    customer: { name: "Karthik Raman", phone: "+91 98401 11223", address: "SM Store Counter (Pickup)" },
    status: "pending",
    delivery_mode: "pickup",
    delivery_badge: "Shop Pickup",
    amount: 135.0,
    items_count: 2,
    items_preview: "Button Mushroom, Guava",
    basket: [
      { id: 1, name: "Button Mushroom", weight: "200g", price: 65, quantity: 1 },
      { id: 2, name: "Guava", weight: "1kg", price: 70, quantity: 1 },
    ],
    order_date: new Date().toISOString().split("T")[0],
    created_time: "06:15 AM",
    relative_day: "today",
  },
  {
    id: 92001,
    order_id: "#SM-92001",
    customer: { name: "Deepa Nair", phone: "+91 98401 44556", address: "Besant Nagar, Chennai" },
    status: "pending",
    delivery_mode: "scheduled",
    delivery_badge: "Scheduled",
    amount: 240.0,
    items_count: 3,
    items_preview: "Mangosteen, Papaya, Sweet Corn",
    basket: [
      { id: 1, name: "Mangosteen", weight: "500g", price: 120, quantity: 1 },
      { id: 2, name: "Papaya", weight: "1 pc", price: 80, quantity: 1 },
      { id: 3, name: "Sweet Corn", weight: "2 pcs", price: 40, quantity: 1 },
    ],
    order_date: new Date().toISOString().split("T")[0],
    created_time: "06:15 AM",
    relative_day: "today",
  },
  {
    id: 91001,
    order_id: "#SM-91001",
    customer: { name: "Kavitha Raman", phone: "+91 98401 23456", address: "Anna Nagar East, Chennai" },
    rider: { id: 101, name: "Karthik", phone: "+91 98401 23456", vehicle_number: "TN-01-AB-1234" },
    status: "ready_for_dispatch",
    delivery_mode: "express",
    amount: 285.0,
    items_count: 4,
    items_preview: "Tomatoes 1kg, Onions 1kg, Coriander, Mint",
    basket: [
      { id: 1, name: "Tomatoes", weight: "1kg", price: 40, quantity: 1 },
      { id: 2, name: "Onions", weight: "1kg", price: 45, quantity: 1 },
      { id: 3, name: "Coriander", weight: "1 bunch", price: 20, quantity: 1 },
      { id: 4, name: "Mint", weight: "1 bunch", price: 15, quantity: 1 },
    ],
    order_date: new Date().toISOString().split("T")[0],
    created_time: "10:30 AM",
    relative_day: "today",
  },
  {
    id: 91002,
    order_id: "#SM-91002",
    customer: { name: "Suresh Kumar", phone: "+91 98401 77889", address: "Anna Nagar West, Chennai" },
    status: "confirm_and_packing",
    delivery_mode: "express",
    amount: 195.0,
    items_count: 3,
    items_preview: "Tomatoes 1kg, Onions 1kg, Coriander",
    basket: [
      { id: 1, name: "Tomatoes", weight: "1kg", price: 40, quantity: 1 },
      { id: 2, name: "Onions", weight: "1kg", price: 45, quantity: 1 },
      { id: 3, name: "Coriander", weight: "1 bunch", price: 20, quantity: 1 },
    ],
    order_date: new Date().toISOString().split("T")[0],
    created_time: "10:35 AM",
    relative_day: "today",
  },
  {
    id: 91003,
    order_id: "#SM-91003",
    customer: { name: "Meena Sundaram", phone: "+91 98401 33221", address: "Kilpauk, Chennai" },
    status: "ready_for_dispatch",
    delivery_mode: "express",
    amount: 220.0,
    items_count: 3,
    items_preview: "Carrots 500g, Beans 500g, Potatoes 1kg",
    basket: [
      { id: 1, name: "Carrots", weight: "500g", price: 40, quantity: 1 },
      { id: 2, name: "Beans", weight: "500g", price: 50, quantity: 1 },
      { id: 3, name: "Potatoes", weight: "1kg", price: 40, quantity: 1 },
    ],
    order_date: new Date().toISOString().split("T")[0],
    created_time: "10:40 AM",
    relative_day: "today",
  },
];

export function mergeOrdersWithSamples(rawList = []) {
  const result = Array.isArray(rawList) ? [...rawList] : [];
  SAMPLE_ORDERS_PREVIEW.forEach((sample) => {
    const exists = result.some(
      (o) => o.id === sample.id || String(o.order_id).includes(String(sample.id))
    );
    if (!exists) {
      result.push(sample);
    }
  });
  return result;
}

export function OrderNotificationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isOrderManagementPage =
    location.pathname.includes("/admin/orders") ||
    location.pathname.endsWith("/orders");

  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetOrderId, setTargetOrderId] = useState(null);

  // Active popup modal alert state (for the 1st new incoming order)
  const [activeAlertOrder, setActiveAlertOrder] = useState(null);

  // Track alert IDs dismissed by user closing the modal in current session
  const [dismissedAlertOrderIds, setDismissedAlertOrderIds] = useState([]);

  // Ref to prevent old historical notifications from flashing an alert modal on page reload
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const wsRef = useRef(null);
  const pendingTransitionsRef = useRef(new Map());

  // Rank helper to compare order lifecycle advancement
  const getStageRank = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "cancelled" || s === "rejected") return 99;
    if (s === "delivered" || s === "done") return 5;
    if (s === "out_for_delivery" || s === "out for delivery" || s === "ofd") return 4;
    if (
      s === "ready_for_dispatch" ||
      s === "ready for dispatch" ||
      s === "dispatch" ||
      s === "dispatched" ||
      s === "ready for pick up" ||
      s === "ready_for_pick_up" ||
      s === "ready for pickup"
    ) {
      return 3;
    }
    if (
      s === "confirmed" ||
      s === "packing" ||
      s === "confirmed & packing" ||
      s === "confirm & packing" ||
      s === "confirm and packing"
    ) {
      return 2;
    }
    return 1;
  };

  // Register an optimistic status transition to lock it against stale incoming syncs
  const recordStatusTransition = useCallback((orderId, newStatus, extraData = {}) => {
    const key = cleanId(orderId);
    if (!key) return;
    pendingTransitionsRef.current.set(key, {
      status: newStatus,
      timestamp: Date.now(),
      extra: extraData,
    });
  }, []);

  // Merge incoming server orders with active pending transitions to prevent UI status bounce
  const applyPendingTransitions = useCallback((rawOrders) => {
    if (!Array.isArray(rawOrders)) return [];
    const now = Date.now();
    return rawOrders.map((o) => {
      const idKey = cleanId(o.id);
      const numKey = cleanId(o.order_id || o.order_number);
      const pending = pendingTransitionsRef.current.get(idKey) || (numKey ? pendingTransitionsRef.current.get(numKey) : null);
      if (pending) {
        const age = now - pending.timestamp;
        if (age < 12000) {
          const serverRank = getStageRank(o.status);
          const pendingRank = getStageRank(pending.status);
          if (serverRank < pendingRank) {
            // Keep optimistic status to prevent bounce back to older status!
            return {
              ...o,
              status: pending.status,
              ...(pending.extra || {}),
            };
          } else {
            // Server has confirmed or advanced beyond pending status
            pendingTransitionsRef.current.delete(idKey);
            if (numKey) pendingTransitionsRef.current.delete(numKey);
          }
        } else {
          // Expired after 12s
          pendingTransitionsRef.current.delete(idKey);
          if (numKey) pendingTransitionsRef.current.delete(numKey);
        }
      }
      return o;
    });
  }, []);

  // Dual Data Loading Strategy: 1. HTTP REST API immediately on load
  const fetchInitialData = useCallback(async () => {
    try {
      const [ordersRes, agentsRes, notifsRes] = await Promise.allSettled([
        orderAPI.fetchOrders(),
        orderAPI.fetchDeliveryAgents(),
        orderAPI.fetchNotifications(),
      ]);

      let isConnected = false;

      if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
        const d = ordersRes.value.data;
        const payload = d.data?.orders || d.orders || d.payload || d.data;
        if (Array.isArray(payload)) {
          setOrders(applyPendingTransitions(payload));
          isConnected = true;
        }
      }

      if (agentsRes.status === "fulfilled" && agentsRes.value?.data) {
        const d = agentsRes.value.data;
        const agents = d.data?.delivery_agents || d.delivery_agents || d.data || d.payload;
        if (Array.isArray(agents) && agents.length > 0) {
          setDeliveryAgents(agents);
          isConnected = true;
        }
      }

      if (notifsRes.status === "fulfilled" && notifsRes.value?.data) {
        const d = notifsRes.value.data;
        const notifs = d.data?.notifications || d.notifications || d.data || d.payload;
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
          isConnected = true;
        }
      }

      setIsBackendConnected(isConnected);
      if (!isConnected) {
        setOrders([]);
        setNotifications([]);
        setDeliveryAgents([]);
      }
    } catch (err) {
      console.warn("⚠️ [OrderNotificationContext] HTTP initial fetch error:", err);
      setIsBackendConnected(false);
      setOrders([]);
      setNotifications([]);
      setDeliveryAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to compute WebSocket URL
  const getWsUrl = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // If running in development behind Vite proxy (port != 8000), use Vite proxy ws://${window.location.host}/ws/...
    // which forwards to http://127.0.0.1:8000/ws/ seamlessly without cross-origin issues
    const host = window.location.host;
    return `${protocol}//${host}/ws/fetch_all_orders/`;
  };

  const connectWebSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "init_all" }));
      }
      return;
    }

    try {
      const wsUrl = getWsUrl();
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("🟢 [OrderNotification WebSocket] Connected to /ws/fetch_all_orders/");
        setIsBackendConnected(true);
        socket.send(JSON.stringify({ action: "init_all" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // ONLY update orders if an explicit orders array is in the message!
          // NEVER overwrite existing orders with [] when receiving notification/agent updates!
          const incomingOrders =
            (Array.isArray(data.orders) && data.orders) ||
            (Array.isArray(data.payload) && data.payload) ||
            (data.action === "init_all" && Array.isArray(data.data) && data.data) ||
            null;

          if (incomingOrders && incomingOrders.length >= 0 && (data.action === "init_all" || data.action === "send_all_orders" || data.orders || data.payload)) {
            const protectedOrders = applyPendingTransitions(incomingOrders);
            setOrders(protectedOrders);
            setIsBackendConnected(true);
          }

          if (Array.isArray(data.delivery_agents)) {
            setDeliveryAgents(data.delivery_agents);
          }

          // Real backend notifications from Notification model
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
          }

          // Direct status update ACK from server
          if (data.action === "update_order_status" && data.data?.id) {
            const updatedId = cleanId(data.data.id);
            const updatedStatus = data.data.status;
            pendingTransitionsRef.current.delete(updatedId);
            setOrders((prev) =>
              prev.map((o) => {
                if (cleanId(o.id) === updatedId || cleanId(o.order_id) === updatedId) {
                  return { ...o, status: updatedStatus };
                }
                return o;
              })
            );
          }

          if (data.action === "fetch_one_order" && (data.order || data.data)) {
            const singleOrder = data.order || data.data;
            setOrders((prev) => {
              const exists = prev.some((o) => o.id === singleOrder.id);
              if (exists) {
                return prev.map((o) => (o.id === singleOrder.id ? singleOrder : o));
              }
              return [singleOrder, ...prev];
            });
          }
          setLoading(false);
        } catch (err) {
          console.error("❌ [OrderNotification WebSocket] Parse error:", err);
          setLoading(false);
        }
      };

      socket.onerror = (err) => {
        if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
          console.warn("⚠️ [OrderNotification WebSocket] Socket error:", err);
        }
        setLoading(false);
      };

      socket.onclose = () => {
        setLoading(false);
      };
    } catch (err) {
      console.warn("⚠️ [OrderNotification WebSocket] Could not create socket:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial HTTP data fetch (fast & reliable)
    fetchInitialData();

    // 2. Real-time WebSocket connection
    connectWebSocket();

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [fetchInitialData, connectWebSocket]);



  // Clean ID helper (removes '#SM-' or '#' so comparison always succeeds)
  const cleanId = (id) => String(id || "").replace("#SM-", "").replace("#", "").trim();

  // Helper: Checks if two order objects reference the same underlying order
  const areSameOrders = (o1, o2) => {
    if (!o1 || !o2) return false;
    const id1 = cleanId(o1.id);
    const num1 = cleanId(o1.order_id || o1.order_number);
    const id2 = cleanId(o2.id);
    const num2 = cleanId(o2.order_id || o2.order_number);

    if (id1 && id2 && id1 === id2) return true;
    if (num1 && num2 && num1 === num2) return true;
    if (id1 && num2 && id1 === num2) return true;
    if (num1 && id2 && num1 === id2) return true;
    return false;
  };

  // Helper: Strictly verify that order status is a New Order state
  const isNewOrderStatus = (status) => {
    if (!status) return true;
    const s = String(status).toLowerCase().trim();
    return s === "new order" || s === "new_order" || s === "pending" || s === "placed" || s === "confirmed" || s === "waiting";
  };

  // Unread notifications directly from Notification model (is_read === false)
  // Strictly filter only notifications where the corresponding order is in NEW ORDER state
  const unreadNotifications = useMemo(() => {
    if (!isBackendConnected) return [];
    return notifications.filter((n) => {
      if (n.is_read !== false) return false;
      const matched = orders.find(
        (o) =>
          cleanId(o.id) === cleanId(n.order_id) ||
          cleanId(o.order_id) === cleanId(n.order_id)
      );
      const st = matched?.status || n.order?.status || n.order_status;
      return isNewOrderStatus(st);
    });
  }, [isBackendConnected, notifications, orders]);

  // Unread orders mapped from unread notifications, activeAlertOrder, or unread orders list
  // STRICTLY guarantees only NEW ORDERS appear in the notifications dropdown with NO DUPLICATES
  const unreadOrders = useMemo(() => {
    if (!isBackendConnected) return [];
    let list = [];
    if (notifications.length > 0) {
      list = unreadNotifications
        .map((n) => {
          const matched = orders.find(
            (o) =>
              cleanId(o.id) === cleanId(n.order_id) ||
              cleanId(o.order_id) === cleanId(n.order_id)
          );
          const rawOrder = matched || n.order;
          if (rawOrder) {
            // Strictly verify that the order status is in New Order state
            if (!isNewOrderStatus(rawOrder.status)) return null;
            return rawOrder;
          }
          // Robust fallback object built directly from notification if full order not loaded yet
          return {
            id: n.order_id,
            order_id: n.order_number || (n.order_id ? `SMV-${n.order_id}` : ""),
            order_number: n.order_number || (n.order_id ? `SMV-${n.order_id}` : ""),
            customer: {
              name: n.customer_name || "Customer",
              phone: n.customer_phone || "",
              address: n.customer_address || "",
            },
            items_count: n.items_count || 1,
            amount: n.amount !== undefined ? n.amount : 0,
            delivery_mode: n.delivery_mode || "Express 25m",
            delivery_badge: n.delivery_mode || "Instant Express (25m)",
            created_time: n.created_at || "Just now",
            date_formatted: `Placed Today at ${n.created_at || "Just now"}`,
            status: "New Order",
            is_read: false,
          };
        })
        .filter(Boolean);
    } else {
      // Fallback to orders with new_order status ONLY if connected to backend and orders exist
      if (orders.length > 0) {
        list = orders.filter((o) => isNewOrderStatus(o.status) && o.is_read !== true);
      }
    }

    // When the Popup Modal is showing for an order (activeAlertOrder),
    // guarantee it is present in the notification list ONLY if it is a new order
    if (activeAlertOrder && activeAlertOrder.id && isNewOrderStatus(activeAlertOrder.status)) {
      const alreadyPresent = list.some((o) => areSameOrders(o, activeAlertOrder));
      if (!alreadyPresent) {
        list = [activeAlertOrder, ...list];
      }
    }

    // STRICT UNIQUE DEDUPLICATION: Ensures exactly 1 notification card per distinct order
    const uniqueOrders = [];
    for (const ord of list) {
      if (!ord) continue;
      const alreadyExists = uniqueOrders.some((existing) => areSameOrders(existing, ord));
      if (!alreadyExists) {
        uniqueOrders.push(ord);
      }
    }

    return uniqueOrders;
  }, [isBackendConnected, notifications, unreadNotifications, orders, activeAlertOrder]);

  const unreadCount = useMemo(() => {
    if (!isBackendConnected) return 0;
    return unreadOrders.length;
  }, [isBackendConnected, unreadOrders.length]);

  const hasUnread = isBackendConnected && unreadCount > 0;

  // When on Order Management page: DO NOT show popup alert modal and stop sound
  useEffect(() => {
    if (isOrderManagementPage || !isBackendConnected) {
      setActiveAlertOrder(null);
      orderAlertSound.stop();
    }
  }, [isOrderManagementPage, isBackendConnected]);

  // Trigger popup alert modal when a new unread notification arrives while on any other page
  useEffect(() => {
    // 1. Never show popup if not connected, user is in Order Management page, or during initial page reload
    if (!isBackendConnected || isOrderManagementPage || isInitialMountRef.current) return;

    // 2. If no modal is currently showing, pick the first unread & un-dismissed order from Notification model
    if (!activeAlertOrder && unreadNotifications.length > 0) {
      const candidateNotif = unreadNotifications.find(
        (n) =>
          !dismissedAlertOrderIds.includes(n.order_id) &&
          !dismissedAlertOrderIds.includes(String(n.order_id)) &&
          !dismissedAlertOrderIds.includes(cleanId(n.order_id))
      );
      if (candidateNotif) {
        const orderObj =
          candidateNotif.order ||
          orders.find(
            (o) =>
              cleanId(o.id) === cleanId(candidateNotif.order_id) ||
              cleanId(o.order_id) === cleanId(candidateNotif.order_id)
          ) ||
          {
            id: candidateNotif.order_id,
            order_id: candidateNotif.order_number || (candidateNotif.order_id ? `SMV-${candidateNotif.order_id}` : ""),
            order_number: candidateNotif.order_number || (candidateNotif.order_id ? `SMV-${candidateNotif.order_id}` : ""),
            customer: {
              name: candidateNotif.customer_name || "Customer",
              phone: candidateNotif.customer_phone || "",
              address: candidateNotif.customer_address || "Customer Address",
            },
            items_count: candidateNotif.items_count || 1,
            amount: candidateNotif.amount !== undefined ? candidateNotif.amount : 0,
            delivery_mode: candidateNotif.delivery_mode || candidateNotif.title || "Express 25m",
            delivery_badge: candidateNotif.delivery_mode || candidateNotif.title || "Instant Express (25m)",
            created_at: candidateNotif.created_at || "Just now",
            date_formatted: `Placed Today at ${candidateNotif.created_at || "Just now"}`,
            status: "New Order",
            is_read: false,
          };
        if (orderObj) {
          setActiveAlertOrder(orderObj);
        }
      }
    }
  }, [unreadNotifications, activeAlertOrder, isOrderManagementPage, dismissedAlertOrderIds, orders]);

  // Mark a specific order notification as read (updates Notification model in backend database)
  const markOrderAsRead = useCallback(
    (orderId) => {
      if (!orderId) return;
      const targetClean = cleanId(orderId);
      const matchedOrder = orders.find(
        (o) => cleanId(o.id) === targetClean || cleanId(o.order_id) === targetClean
      );
      const matchedNum = matchedOrder ? cleanId(matchedOrder.order_id) : "";
      const matchedPk = matchedOrder ? cleanId(matchedOrder.id) : "";

      // Optimistic UI update: marks notification read so unreadNotifications and unreadCount drop immediately
      setNotifications((prev) =>
        prev.map((n) => {
          const nCleanId = cleanId(n.order_id);
          const nCleanNum = cleanId(n.order_number);
          const isMatch =
            nCleanId === targetClean ||
            nCleanNum === targetClean ||
            (matchedPk && nCleanId === matchedPk) ||
            (matchedNum && nCleanNum === matchedNum);
          return isMatch ? { ...n, is_read: true } : n;
        })
      );

      if (
        activeAlertOrder &&
        (cleanId(activeAlertOrder.id) === targetClean ||
          cleanId(activeAlertOrder.order_id) === targetClean ||
          (matchedPk && cleanId(activeAlertOrder.id) === matchedPk) ||
          (matchedNum && cleanId(activeAlertOrder.order_id) === matchedNum))
      ) {
        orderAlertSound.stop();
        setActiveAlertOrder(null);
      }

      // WebSocket action to backend database
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ action: "mark_notification_read", order_id: targetClean })
        );
      }
    },
    [activeAlertOrder, orders]
  );

  // Mark all notifications as read in backend database (safeguarded against infinite loops)
  const markAllAsRead = useCallback(() => {
    const hasUnreadItems = notifications.some((n) => n.is_read === false);
    if (!hasUnreadItems && !activeAlertOrder) return;

    orderAlertSound.stop();
    setActiveAlertOrder(null);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "mark_all_notifications_read" }));
    }
  }, [notifications, activeAlertOrder]);

  // View Order from Popup Modal: stops sound, marks notification read in DB, batches remaining orders, navigates to /admin/orders
  const handleViewAlertOrder = useCallback(
    (orderId) => {
      orderAlertSound.stop();
      markOrderAsRead(orderId);
      setTargetOrderId(orderId);

      // Dismiss all currently pending order IDs from showing popup modals,
      // so remaining orders stay exclusively in the notification bell!
      const allPendingIds = unreadNotifications.map((n) => cleanId(n.order_id || n.id)).filter(Boolean);
      const targetClean = cleanId(orderId);
      setDismissedAlertOrderIds((prev) => [
        ...new Set([...prev, ...allPendingIds, targetClean].filter(Boolean)),
      ]);

      setActiveAlertOrder(null);
      navigate("/admin/orders", { state: { targetOrderId: orderId, timestamp: Date.now() } });
    },
    [markOrderAsRead, navigate, unreadNotifications]
  );

  // Close Popup Modal: stops sound, dismisses active alert AND batches all pending unread orders
  // so remaining orders stay quietly in the notification bell without spamming modal popups!
  const handleDismissAlert = useCallback(() => {
    orderAlertSound.stop();
    const allPendingIds = unreadNotifications.map((n) => cleanId(n.order_id || n.id)).filter(Boolean);
    const activeId = cleanId(activeAlertOrder?.id || activeAlertOrder?.order_id);
    setDismissedAlertOrderIds((prev) => [
      ...new Set([...prev, ...allPendingIds, activeId].filter(Boolean)),
    ]);
    setActiveAlertOrder(null);
  }, [activeAlertOrder, unreadNotifications]);

  // Send raw message over WebSocket
  const sendWsMessage = useCallback((messageObj) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageObj));
    }
  }, []);

  // Reset/refetch data from backend
  const resetSampleOrders = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const value = {
    isBackendConnected,
    orders,
    setOrders,
    deliveryAgents,
    setDeliveryAgents,
    notifications,
    setNotifications,
    loading,
    setLoading,
    unreadNotifications,
    unreadOrders,
    unreadCount,
    hasUnread,
    markOrderAsRead,
    markAllAsRead,
    targetOrderId,
    setTargetOrderId,
    sendWsMessage,
    wsRef,
    activeAlertOrder,
    setActiveAlertOrder,
    resetSampleOrders,
    recordStatusTransition,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}

      {/* Global Live New Order Alert Modal with continuous chime sound */}
      <NewOrderAlertModal
        open={Boolean(isBackendConnected && activeAlertOrder && !isOrderManagementPage)}
        order={activeAlertOrder}
        onClose={handleDismissAlert}
        onViewOrder={handleViewAlertOrder}
      />
    </OrderNotificationContext.Provider>
  );
}

export function useOrderNotifications() {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error("useOrderNotifications must be used within an OrderNotificationProvider");
  }
  return context;
}
