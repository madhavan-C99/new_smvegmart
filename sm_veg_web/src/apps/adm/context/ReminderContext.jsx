import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReminderAlertModal from "../components/reminder/ReminderAlertModal";
import reminderAlertSound from "../utils/reminderAlertSound";
import { useOrderNotifications } from "./OrderNotificationContext";
import productsAPI from "../services/productAPI";
import reminderAPI from "../services/reminderAPI";


const ReminderContext = createContext(null);

// Parse slot time strings like "06:30 AM - 08:30 AM", "4-6 PM", "07:00 AM", etc.
function extractSlotStartTime(slotString) {
  if (!slotString) return { hour: 7, minute: 0, label: "07:00 AM" };

  const clean = String(slotString);

  // Match pattern "06:30 AM" or "6:30 AM"
  const matchWithMin = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
  if (matchWithMin) {
    let hour = parseInt(matchWithMin[1], 10);
    const minute = parseInt(matchWithMin[2], 10);
    const meridiem = matchWithMin[3].toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return { hour, minute, label: matchWithMin[0] };
  }

  // Match pattern "4 PM" or "4-6 PM"
  const matchHourOnly = clean.match(/(\d{1,2})\s*(AM|PM|am|pm)/i);
  if (matchHourOnly) {
    let hour = parseInt(matchHourOnly[1], 10);
    const meridiem = matchHourOnly[2].toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return { hour, minute: 0, label: matchHourOnly[0] };
  }

  return { hour: 7, minute: 0, label: "07:00 AM" };
}

// Local date parser safe from UTC midnight timezone offsets
function parseLocalDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-").map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Calculate the customer's fixed slot time & the exact pack start time (45 mins before)
function calculateSlotPackingTimes(orderDateStr, slotHour, slotMinute, packAdvanceMins = 45) {
  const targetDate = parseLocalDate(orderDateStr);

  // Exact slot start in local time
  const slotStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    slotHour,
    slotMinute,
    0,
    0
  );

  // Packing starts 45 minutes before the customer's chosen delivery slot
  const packStartTime = new Date(slotStart.getTime() - packAdvanceMins * 60 * 1000);

  return { slotStart, packStartTime, targetDate };
}

// Check packing urgency against current wall-clock time
function evaluatePackingStatus(slotStart, packStartTime, targetDate, now = new Date()) {
  const diffMs = slotStart.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  const packDiffMs = packStartTime.getTime() - now.getTime();
  const packDiffMins = Math.round(packDiffMs / 60000);

  // Packing reminder is DUE whenever current time reaches or passes packStartTime!
  // Works uniformly for Today, Tomorrow, and all scheduled delivery dates
  const isDue = now.getTime() >= packStartTime.getTime();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const isToday = targetDayStart.getTime() === todayStart.getTime();
  const isTomorrow = targetDayStart.getTime() === tomorrowStart.getTime();

  return {
    isDue,
    diffMins,
    packDiffMins,
    slotStart,
    packStartTime,
    isToday,
    isTomorrow,
  };
}

export function ReminderProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const orderNotifs = useOrderNotifications();
  const isBackendConnected = orderNotifs?.isBackendConnected || false;
  const orders = orderNotifs?.orders || [];
  const setTargetOrderId = orderNotifs?.setTargetOrderId;
  const targetOrderId = orderNotifs?.targetOrderId;

  // Track the active working reminder target the admin navigated to (e.g. order 93001 or product 201)
  // While admin is actively working on this order/product on the respective page,
  // hold off showing new modal popups so they can work undisturbed!
  const [activeWorkingTarget, setActiveWorkingTarget] = useState(null);

  // When admin navigates away from the respected page without changing the state,
  // clear activeWorkingTarget so remaining reminder popup comes back, while notification count is preserved!
  useEffect(() => {
    if (!activeWorkingTarget) return;
    const isOrdersPage = location.pathname.includes("/admin/orders") || location.pathname.endsWith("/orders");
    const isProductsPage = location.pathname.includes("/admin/products") || location.pathname.endsWith("/products");

    if (activeWorkingTarget.type === "order" && !isOrdersPage) {
      setActiveWorkingTarget(null);
    } else if (activeWorkingTarget.type === "product" && !isProductsPage) {
      setActiveWorkingTarget(null);
    }
  }, [location.pathname, activeWorkingTarget]);

  // Live WebSocket Heartbeat & Clock Ticker every 20 seconds:
  // Automatically requests updated SLA elapsed minutes & Due Now states from the backend
  // so reminders update live without requiring any manual page refresh!
  useEffect(() => {
    const refreshLiveReminders = async () => {
      if (reminderWsRef.current && reminderWsRef.current.readyState === WebSocket.OPEN) {
        reminderWsRef.current.send(JSON.stringify({ action: "refresh" }));
      } else {
        try {
          const res = await reminderAPI.fetchReminders();
          const list = res?.data?.data?.reminders || res?.data?.reminders || [];
          if (Array.isArray(list) && list.length > 0) {
            setBackendReminders(list);
          }
        } catch {}
      }
    };

    const timer = setInterval(refreshLiveReminders, 20000);

    // Also refresh immediately whenever the admin switches back to this browser tab
    const handleFocus = () => {
      refreshLiveReminders();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Products state for Out-of-Stock inventory refill reminders
  const [products, setProducts] = useState([]);

  // Completed reminder IDs
  const [doneReminderIds, setDoneReminderIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sm_done_reminder_ids") || "[]");
    } catch {
      return [];
    }
  });

  // Permanently Muted Out-of-Stock Product IDs
  const [mutedStockProductIds, setMutedStockProductIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sm_muted_stock_product_ids") || "[]");
    } catch {
      return [];
    }
  });


  // Snoozed reminder map: { [id]: snoozeUntilTimestampMs }
  const [snoozedMap, setSnoozedMap] = useState({});

  // Session-dismissed alert popup IDs so we don't spam the admin once they closed it
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  // Active popup reminder for centered modal
  const [activeReminderPopup, setActiveReminderPopup] = useState(null);

  // Mount timer grace period to prevent initial reload modal flash/glitch
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsHydrated(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Fetch products on startup and listen to WebSocket for live inventory changes
  useEffect(() => {
    let isMounted = true;

    // 1. HTTP REST initial load
    const fetchInitialProducts = async () => {
      try {
        const res = await productsAPI.fetchAllProducts();
        const list = res?.data?.data?.products || res?.data?.products || res?.data?.data || [];
        if (isMounted && Array.isArray(list)) {
          setProducts(list);
        }
      } catch (err) {
        console.warn("⚠️ [ReminderContext] HTTP product fetch:", err);
      }
    };
    fetchInitialProducts();

    // 2. WebSocket for real-time stock updates
    let socket = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      socket = new WebSocket(`${protocol}//${host}/ws/fetch_all_product/`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ action: "init_all" }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const list = payload.payload || payload.data || [];
          if (isMounted && Array.isArray(list)) {
            setProducts(list);
          }
        } catch {}
      };
    } catch {}

    return () => {
      isMounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // DEDICATED WEBSOCKET: /ws/reminders/
  // Handles real-time operational reminders pushed directly from backend
  // -------------------------------------------------------------------------
  const [backendReminders, setBackendReminders] = useState(null);
  const [isReminderWsConnected, setIsReminderWsConnected] = useState(false);
  const reminderWsRef = useRef(null);

  const connectReminderWebSocket = useCallback(() => {
    if (
      reminderWsRef.current &&
      (reminderWsRef.current.readyState === WebSocket.OPEN ||
        reminderWsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      if (reminderWsRef.current.readyState === WebSocket.OPEN) {
        reminderWsRef.current.send(JSON.stringify({ action: "init_all" }));
      }
      return;
    }

    try {
      const wsUrl = reminderAPI.getWsUrl();
      const socket = new WebSocket(wsUrl);
      reminderWsRef.current = socket;

      socket.onopen = () => {
        console.log("🟢 [Reminder WebSocket] Connected to /ws/reminders/");
        setIsReminderWsConnected(true);
        socket.send(JSON.stringify({ action: "init_all" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const incoming =
            (Array.isArray(data.payload) && data.payload) ||
            (Array.isArray(data.data) && data.data) ||
            (Array.isArray(data.reminders) && data.reminders) ||
            (data.data && Array.isArray(data.data.reminders) && data.data.reminders) ||
            null;

          if (incoming) {
            console.log(`📡 [Reminder WebSocket] Received ${incoming.length} reminders from backend`);
            setBackendReminders(incoming);
          }
        } catch (err) {
          console.warn("⚠️ [Reminder WebSocket] Parse error:", err);
        }
      };

      socket.onerror = (err) => {
        console.warn("⚠️ [Reminder WebSocket] Error:", err);
      };

      socket.onclose = () => {
        console.log("🔴 [Reminder WebSocket] Closed. Reconnecting in 3s...");
        setIsReminderWsConnected(false);
        reminderWsRef.current = null;
        setTimeout(() => {
          connectReminderWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.warn("⚠️ [Reminder WebSocket] Connection failed:", e);
      setTimeout(() => {
        connectReminderWebSocket();
      }, 5000);
    }
  }, []);

  // Connect dedicated reminders WebSocket on mount and load REST HTTP fallback
  useEffect(() => {
    let isMounted = true;

    const fetchInitialReminders = async () => {
      try {
        const res = await reminderAPI.fetchReminders();
        const list = res?.data?.data?.reminders || res?.data?.reminders || [];
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setBackendReminders(list);
        }
      } catch (err) {
        console.warn("⚠️ [ReminderContext] HTTP fetchReminders fallback:", err);
      }
    };

    fetchInitialReminders();
    connectReminderWebSocket();

    return () => {
      isMounted = false;
      if (reminderWsRef.current && reminderWsRef.current.readyState === WebSocket.OPEN) {
        reminderWsRef.current.close();
      }
    };
  }, [connectReminderWebSocket]);

  // Save done IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sm_done_reminder_ids", JSON.stringify(doneReminderIds));
    } catch {}
  }, [doneReminderIds]);

  // Generate Reminders:
  // Backend WebSocket & REST HTTP is the single source of truth
  const rawReminders = useMemo(() => {
    if (Array.isArray(backendReminders)) {
      return backendReminders;
    }
    return [];
  }, [backendReminders]);
  // Filter out Done, Snoozed, and permanently Muted stock reminders
  const activeReminders = useMemo(() => {
    if (!isBackendConnected) return [];
    const now = Date.now();
    return rawReminders.filter((rem) => {
      if (doneReminderIds.includes(rem.id)) return false;

      // For out of stock product reminders: if user clicked the green button, never show it again!
      if (rem.type === "stock") {
        const prodId = rem.productId || rem.product?.id || rem.id;
        const sProdId = String(prodId);
        if (
          mutedStockProductIds.includes(prodId) ||
          mutedStockProductIds.includes(sProdId) ||
          mutedStockProductIds.includes(rem.id) ||
          mutedStockProductIds.includes(`stock_${sProdId}`)
        ) {
          return false;
        }
      }

      const snoozedUntil = snoozedMap[rem.id];
      if (snoozedUntil && now < snoozedUntil) return false;
      return true;
    });
  }, [rawReminders, doneReminderIds, mutedStockProductIds, snoozedMap, isBackendConnected]);

  // Due reminders list (due now, not snoozed, not done)
  const dueReminders = useMemo(() => {
    if (!isBackendConnected) return [];
    return activeReminders.filter((rem) => rem.isDue);
  }, [activeReminders, isBackendConnected]);

  // Full count of all active due reminders — displayed continuously in the navbar ⏰ badge!
  const reminderCount = isBackendConnected ? dueReminders.length : 0;
  const hasDueReminders = isBackendConnected && reminderCount > 0;

  // Single-Popup Trigger for 1st Due Reminder
  // Pops up the first due operational reminder and keeps it open until the admin takes action.
  // Pauses subsequent popups while admin is actively working on the target order in the drawer.
  useEffect(() => {
    if (!isBackendConnected || dueReminders.length === 0) {
      if (activeReminderPopup) {
        setActiveReminderPopup(null);
        reminderAlertSound.stop();
      }
      return;
    }

    // 1. While admin is actively working on the target order/product in the drawer,
    // hold off showing new reminder popups so they can work undisturbed!
    if (activeWorkingTarget) {
      return;
    }

    // 2. Wait until page mount/hydration settles to ensure smooth rendering
    if (!isHydrated) return;

    // 3. Find first due reminder that hasn't been dismissed in this session
    const nextAlert = dueReminders.find((r) => !dismissedAlertIds.includes(r.id));

    if (nextAlert && !activeReminderPopup) {
      setActiveReminderPopup(nextAlert);
    }
  }, [dueReminders, dismissedAlertIds, activeReminderPopup, activeWorkingTarget, isHydrated, isBackendConnected]);

  // Actions
  const markReminderDone = useCallback((reminderId) => {
    reminderAlertSound.stop();
    const clean = String(reminderId).replace("#SM-", "").replace("#", "").replace("order_", "").replace("test_", "").replace("stock_", "").trim();
    setDoneReminderIds((prev) => {
      const set = new Set(prev);
      set.add(reminderId);
      // Also match any reminder relating to this order id or product id
      rawReminders.forEach((r) => {
        const rCleanOrder = String(r.orderId || r.order?.id || "").replace("#SM-", "").replace("#", "").trim();
        const rCleanProd = String(r.productId || r.product?.id || "").trim();
        if (
          String(r.id).includes(clean) ||
          rCleanOrder === clean ||
          rCleanProd === clean
        ) {
          set.add(r.id);
        }
      });
      return Array.from(set);
    });
    setActiveReminderPopup((curr) => {
      if (!curr) return null;
      if (curr.id === reminderId || String(curr.id).includes(clean) || String(curr.orderId) === clean) {
        return null;
      }
      return curr;
    });
    // Once state changes and item is done, clear active target so next reminder can pop up
    setActiveWorkingTarget(null);
  }, [rawReminders]);

  const markAllRemindersDone = useCallback(async () => {
    reminderAlertSound.stop();
    setDoneReminderIds([]);
    setBackendReminders([]);
    setActiveReminderPopup(null);
    setActiveWorkingTarget(null);

    // 1. Tell backend WebSocket to clear all
    if (reminderWsRef.current && reminderWsRef.current.readyState === WebSocket.OPEN) {
      reminderWsRef.current.send(JSON.stringify({ action: "clear_all" }));
    }

    // 2. Call REST clear endpoint
    try {
      await reminderAPI.clearAllReminders();
    } catch (e) {
      console.warn("⚠️ [ReminderContext] Clear all HTTP call:", e);
    }
  }, []);

  const snoozeReminder = useCallback((reminderId, minutes = 15) => {
    reminderAlertSound.stop();
    const until = Date.now() + minutes * 60 * 1000;
    setSnoozedMap((prev) => ({ ...prev, [reminderId]: until }));
    setActiveReminderPopup((curr) => (curr?.id === reminderId ? null : curr));
  }, []);

  const dismissReminderPopup = useCallback(() => {
    reminderAlertSound.stop();
    if (activeReminderPopup) {
      setDismissedAlertIds((prev) => [...prev, activeReminderPopup.id]);
      setActiveReminderPopup(null);
    }
  }, [activeReminderPopup]);

  // Reset all test reminders so admin can test all 6 modes anytime
  const resetTestReminders = useCallback(async () => {
    reminderAlertSound.stop();
    try {
      localStorage.removeItem("sm_done_reminder_ids");
    } catch {}
    setDoneReminderIds([]);
    setDismissedAlertIds([]);
    setSnoozedMap({});
    setActiveWorkingTarget(null);
    setActiveReminderPopup(null);

    // Call reset endpoint on backend
    try {
      await reminderAPI.resetReminders();
    } catch {}

    if (reminderWsRef.current && reminderWsRef.current.readyState === WebSocket.OPEN) {
      reminderWsRef.current.send(JSON.stringify({ action: "reset" }));
    } else {
      try {
        const res = await reminderAPI.fetchReminders();
        const list = res?.data?.data?.reminders || res?.data?.reminders || [];
        if (Array.isArray(list)) {
          setBackendReminders(list);
        }
      } catch {}
    }
  }, []);



  // Clear working target (called when drawer closes or admin clicks another order)
  const clearWorkingTarget = useCallback(() => {
    setActiveWorkingTarget(null);
  }, []);

  // Open the Respected Target (Specific Order OR Specific Out-of-Stock Product)
  // NOTE: Clicking to open packing order or product DOES NOT mark it done!
  // It only opens the drawer/modal so the admin can change the state.
  const openReminderOrders = useCallback(
    (reminder) => {
      reminderAlertSound.stop();
      setActiveReminderPopup(null);
      if (reminder?.id) {
        setDismissedAlertIds((prev) => (prev.includes(reminder.id) ? prev : [...prev, reminder.id]));
      }

      // 1. OUT OF STOCK PRODUCT: Navigate to /admin/products with product to edit & highlight
      if (reminder?.type === "stock") {
        const prodId = reminder.product?.id || reminder.productId;
        const prodName = reminder.product?.name || reminder.productName || "";
        setActiveWorkingTarget({
          type: "product",
          targetId: prodId,
          reminderId: reminder.id,
        });
        navigate("/admin/products", {
          state: {
            editProductId: prodId,
            searchTerm: prodName,
            timestamp: Date.now(),
          },
        });
        return;
      }

      // 2. ORDER: Select and open the specific order drawer in /admin/orders
      const targetId = reminder?.order?.id || reminder?.orderId || reminder?.order?.order_id;
      const cleanId = typeof targetId === "string" ? targetId.replace("#SM-", "").replace("#", "").trim() : targetId;
      setActiveWorkingTarget({
        type: "order",
        targetId: cleanId,
        reminderId: reminder.id,
      });

      if (cleanId && setTargetOrderId) {
        setTargetOrderId(cleanId);
      }

      navigate("/admin/orders", { state: { targetOrderId: cleanId } });
    },
    [navigate, setTargetOrderId]
  );

  // Permanently mute an Out-of-Stock product reminder so it is never shown again
  const muteStockReminder = useCallback((reminder) => {
    reminderAlertSound.stop();
    setActiveReminderPopup((curr) => (curr?.id === reminder?.id ? null : curr));

    const prodId = reminder?.productId || reminder?.product?.id || reminder?.id;
    const remId = reminder?.id || `stock_${prodId}`;

    setMutedStockProductIds((prev) => {
      const next = Array.from(new Set([...prev, prodId, String(prodId), remId, `stock_${prodId}`]));
      try {
        localStorage.setItem("sm_muted_stock_product_ids", JSON.stringify(next));
      } catch {}
      return next;
    });

    setDoneReminderIds((prev) => {
      const next = Array.from(new Set([...prev, remId, `stock_${prodId}`]));
      try {
        localStorage.setItem("sm_done_reminder_ids", JSON.stringify(next));
      } catch {}
      return next;
    });

    // Notify backend API
    try {
      reminderAPI.dismissReminder(remId);
    } catch (err) {
      console.warn("Could not notify backend of reminder dismissal:", err);
    }
  }, []);

  const value = {
    reminders: activeReminders,
    dueReminders,
    reminderCount,
    hasDueReminders: reminderCount > 0,
    activeReminderPopup,
    activeWorkingTarget,
    markReminderDone,
    markAllRemindersDone,
    muteStockReminder,
    snoozeReminder,
    dismissReminderPopup,
    openReminderOrders,
    clearWorkingTarget,
    resetTestReminders,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}

      {/* Global Centered Due Reminder Alert Modal */}
      <ReminderAlertModal
        open={Boolean(isBackendConnected && activeReminderPopup)}
        reminder={activeReminderPopup}
        onClose={dismissReminderPopup}
        onOpenOrders={openReminderOrders}
        onSnooze={snoozeReminder}
        onMarkDone={markReminderDone}
        onMuteStockReminder={muteStockReminder}
      />
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error("useReminders must be used within a ReminderProvider");
  }
  return context;
}

export default ReminderContext;
