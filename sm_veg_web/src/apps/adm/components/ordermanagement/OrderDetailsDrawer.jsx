import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import { getStatusBadgeStyle } from "./orderColumns";
import { useCommonPopup } from "../../context/CommonPopupContext";
import PrinterBillPreviewModal from "./PrinterBillPreviewModal";

export default function OrderDetailsDrawer({
  order,
  deliveryAgents = [],
  onClose,
  onStatusTransition,
  onRemoveItem,
  onAssignAgent,
  onUnassignAgent,
}) {
  const { showAlert } = useCommonPopup();

  if (!order) return null;

  const currentAssignedAgent = order.delivery_agent || order.rider || null;
  const currentAssignedId = currentAssignedAgent?.id ? String(currentAssignedAgent.id) : "";
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleUnassignClick = async () => {
    if (!order?.id || !onUnassignAgent) return;
    setIsAssigning(true);
    try {
      await onUnassignAgent(order.id);
      setSelectedAgentId("");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter: ONLY show available delivery agents (busy riders on active trips are hidden)
  const availableAgents = useMemo(() => {
    return deliveryAgents.filter((agent) => {
      // If currently assigned to this order, keep them so their details are accessible
      if (currentAssignedId && String(agent.id) === String(currentAssignedId)) {
        return true;
      }
      const statusLower = String(agent.status || "").toLowerCase().trim();
      const isStatusAvailable = statusLower === "online" || statusLower === "available";
      const isNotBusy =
        statusLower !== "busy" &&
        (agent.active_orders_count === undefined || agent.active_orders_count === 0);
      return agent.is_available === true && isNotBusy && isStatusAvailable;
    });
  }, [deliveryAgents, currentAssignedId]);

  useEffect(() => {
    setSelectedAgentId("");
  }, [order.id]);

  const handleAssignClick = async () => {
    if (!selectedAgentId) return;
    setIsAssigning(true);
    try {
      if (onAssignAgent) {
        await onAssignAgent(order.id, Number(selectedAgentId));
      }
      setSelectedAgentId("");
    } finally {
      setIsAssigning(false);
    }
  };

  // WhatsApp Customer Communication Handler
  const handleOpenWhatsApp = () => {
    const rawPhone = order.customer?.phone || order.phone || "";
    let cleanPhone = String(rawPhone).replace(/\D/g, "");

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (!cleanPhone) {
      showAlert({
        title: "Phone Number Missing",
        message: "Customer phone number is not available for this order.",
        type: "warning",
      });
      return;
    }

    const customerName = order.customer?.name || "Customer";
    const orderNumber = order.order_id || `#${order.id}`;
    const message = `Hello ${customerName}, this is SM Veg Mart regarding your Order ${orderNumber}. How can we assist you today?`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // WhatsApp Store Pickup Ready Notification with Itemized Details
  const handleSendPickupWhatsAppMessage = () => {
    const rawPhone = order.customer?.phone || order.phone || "";
    let cleanPhone = String(rawPhone).replace(/\D/g, "");

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (!cleanPhone) {
      showAlert({
        title: "Phone Number Missing",
        message: "Customer phone number is not available for this order.",
        type: "warning",
      });
      return;
    }

    const customerName = order.customer?.name || "Customer";
    const orderNumber = order.order_id || `#${order.id}`;

    // Itemized basket details from backend order data
    const basketItems = (order.basket || []).map((item) => {
      const name = item.name || "Item";
      let weight = item.weight ? ` (${item.weight})` : "";
      if (!weight && item.pack) {
        const pWeight = item.pack.split("•")[0]?.trim();
        if (pWeight) weight = ` (${pWeight})`;
      }
      const qty = item.quantity || 1;
      const price = Number(item.price || item.total_price || 0).toFixed(2);
      return `• ${qty}x ${name}${weight} — ₹${price}`;
    }).join("\n");

    const totalAmt = Number(order.amount || totalAmount || 0).toFixed(2);
    const isPaid = order.payment_status === true || String(order.payment_status).toLowerCase() === "paid";
    const payStatus = isPaid ? "Paid Online (UPI) ✅" : "Online Payment (UPI) ✅";
    const pickupSlotLine = slotInfo.fullSlotLabel ? `*Pickup Slot:* ${slotInfo.fullSlotLabel}\n` : "";

    const message = `🛒 *SM VegMart - Order Ready for Pickup!* 🛍️\n\nHello *${customerName}*,\nYour order *${orderNumber}* has been freshly packed and is ready to collect at our store counter!\n\n📦 *Order Details:*\n${basketItems || "• Fresh Produce Basket"}\n----------------------------------------\n${pickupSlotLine}*Total Amount:* ₹${totalAmt}\n*Payment Status:* ${payStatus}\n\n📍 *Pickup Counter:*\nSM VegMart Store Counter\n16, 1st Floor, Sarathy Nagar\n\nPlease show your Order ID (*${orderNumber}*) at the counter to collect your fresh vegetables.\nThank you for shopping with SM VegMart! 🌿`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Action: Move Shop Pickup Order to Stage 3 AND notify customer on WhatsApp
  const handleReadyForPickup = () => {
    onStatusTransition?.(order.id, "Ready for pick up");
    handleSendPickupWhatsAppMessage();
  };

  const badge = getStatusBadgeStyle(order.status);
  const basket = order.basket || [];
  const totalAmount = basket.reduce((sum, item) => sum + (item.price || 0), 0);

  // Delivery type resolution: 'express' | 'pickup' | 'scheduled'
  const deliveryType = useMemo(() => {
    const mode = String(order.delivery_mode || order.delivery_badge || "").toLowerCase();
    if (mode.includes("pickup") || mode.includes("shop") || mode.includes("self")) return "pickup";
    if (mode.includes("schedul")) return "scheduled";
    return "express";
  }, [order.delivery_mode, order.delivery_badge]);

  // Slot & Timing Information per delivery mode (Pickup, Scheduled, Express SLA)
  const slotInfo = useMemo(() => {
    const slot = order.slot || {};
    let rawDateStr =
      order.delivery_date_display ||
      slot.date_display ||
      (order.delivery_date ? (order.delivery_date.includes("-") ? order.delivery_date : "Today") : "Today");

    let deliveryDateStr = rawDateStr;
    if (deliveryDateStr && /^\d{4}-\d{2}-\d{2}$/.test(deliveryDateStr)) {
      try {
        const [y, m, d] = deliveryDateStr.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        deliveryDateStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      } catch (e) {
        // retain original
      }
    }

    // Extract slot label (e.g. "Evening", "Morning • Popular", "Early Morning")
    let slotLabel = slot.slot_label || slot.title || "";
    if (slotLabel.toLowerCase().includes("standard slot") || slotLabel.includes(":") || slotLabel.includes("-")) {
      slotLabel = "";
    }

    // Extract time window from slot or order fields
    let timeWindow = slot.time_window || "";
    if (!timeWindow && slot.start_time && slot.end_time) {
      timeWindow = `${slot.start_time} - ${slot.end_time}`;
    }

    // Fallback extraction from delivery_badge (e.g. "Pickup: Evening (04:00 PM - 06:00 PM)" or "Pickup: 04:00 PM - 06:00 PM")
    if (!timeWindow && (order.delivery_badge || order.delivery_mode)) {
      const rawBadge = String(order.delivery_badge || order.delivery_mode);
      const match = rawBadge.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)|\d{1,2}\s*-\s*\d{1,2}\s*(?:AM|PM))/i);
      if (match) {
        timeWindow = match[1];
      }
    }

    // Intelligent default fallbacks matching configured slots:
    if (!timeWindow) {
      if (deliveryType === "pickup") {
        timeWindow = "04:00 PM - 06:00 PM";
        if (!slotLabel) slotLabel = "Evening";
      } else if (deliveryType === "scheduled") {
        timeWindow = "04:00 PM - 06:00 PM";
        if (!slotLabel) slotLabel = "Evening";
      }
    }

    const displayTiming = slotLabel ? `${slotLabel} • ${timeWindow}` : timeWindow;
    const fullSlotLabel = `${deliveryDateStr}, ${displayTiming}`;

    return {
      slotLabel,
      timeWindow,
      displayTiming,
      deliveryDateStr,
      fullSlotLabel,
      targetTime: order.target_delivery_time || "Within 25 mins",
      createdTime:
        order.created_time ||
        (order.created_at ? order.created_at.replace(/^(Today|Yesterday|[0-9A-Za-z\s]+),\s*/i, "") : "02:13 PM"),
    };
  }, [order, deliveryType]);

  // Dynamic Stepper definitions per Delivery Mode matching Figma Editor specifications:
  // - Store Pickup: 4 steps (New Order -> Confirm & Packing -> Ready for pick up -> Done)
  // - Scheduled Delivery: 5 steps (New Order -> Packing -> Dispatch -> OFD -> Done)
  // - Instant Express: 5 steps (New Order -> Confirm & Packing -> Dispatch -> OFD -> Done)
  const stepsList = useMemo(() => {
    if (deliveryType === "pickup") {
      return [
        { key: "new_order", num: 1, label: "New Order" },
        { key: "confirmed", num: 2, label: "Confirm & Packing" },
        { key: "ready_for_pickup", num: 3, label: "Ready for pick up" },
        { key: "delivered", num: 4, label: "Done" },
      ];
    }
    if (deliveryType === "scheduled") {
      return [
        { key: "new_order", num: 1, label: "New Order" },
        { key: "confirmed", num: 2, label: "Packing" },
        { key: "ready_for_dispatch", num: 3, label: "Dispatch" },
        { key: "out_for_delivery", num: 4, label: "OFD" },
        { key: "delivered", num: 5, label: "Done" },
      ];
    }
    // express
    return [
      { key: "new_order", num: 1, label: "New Order" },
      { key: "confirmed", num: 2, label: "Confirm & Packing" },
      { key: "ready_for_dispatch", num: 3, label: "Dispatch" },
      { key: "out_for_delivery", num: 4, label: "OFD" },
      { key: "delivered", num: 5, label: "Done" },
    ];
  }, [deliveryType]);

  const getNormalizedStage = (raw) => {
    const s = String(raw || "").toLowerCase().trim();
    if (s === "pending" || s === "new_order" || s === "new order" || s === "waiting") return 1;
    if (s === "confirmed" || s === "packing" || s === "confirmed & packing" || s === "confirm & packing" || s === "confirm and packing") return 2;

    if (deliveryType === "pickup") {
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
      if (s === "delivered" || s === "done") return 4;
      if (s === "cancelled") return -1;
      return 1;
    }

    // Express & Scheduled
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
    if (s === "out_for_delivery" || s === "out for delivery" || s === "ofd") return 4;
    if (s === "delivered" || s === "done") return 5;
    if (s === "cancelled") return -1;
    return 1;
  };

  const currentStage = getNormalizedStage(order.status);

  // Fulfillment & Routing Card visibility rules per mode:
  // - Store Pickup: NEVER needed (completely hidden)
  // - Instant Express & Scheduled Delivery:
  //   User rule: "we will select agent for instant and scheduled in dispatch only"
  //   In Stage 1 (New Order) & Stage 2 (Confirm & Packing), agent card is hidden.
  //   In Stage 3 (Dispatch), card is shown for agent selection.
  //   In Stage 4 (OFD) & Stage 5 (Done), card is shown with assigned rider info.
  const showDeliveryAgentCard = useMemo(() => {
    if (deliveryType === "pickup") return false;
    if (currentStage === 1 || currentStage === 2) return false;
    return true;
  }, [deliveryType, currentStage]);

  // Delivery agent selection dropdown & assign button visibility:
  // - Instant Express & Scheduled Delivery: visible in Dispatch (Stage 3) ONLY!
  // - Pickup: false (no agent needed)
  // - OFD (4) & Done (5): locked, no dropdown
  const isAgentSelectable = useMemo(() => {
    if (deliveryType === "pickup") return false;
    return currentStage === 3;
  }, [deliveryType, currentStage]);

  const getStepState = (stepNum) => {
    if (currentStage === -1) return "waiting";
    if (currentStage > stepNum) return "completed";
    if (currentStage === stepNum) return "active";
    return "waiting";
  };

  const getStepTime = (stepNum, isCompleted, isActive) => {
    // Current active step
    if (isActive) {
      return "Active";
    }

    // Waiting step (e.g. unaccepted new orders, or future stages)
    if (!isCompleted) {
      return "Waiting";
    }

    // Step 1 (New Order) always shows the real time the customer placed the order
    if (stepNum === 1) {
      return (
        order.created_time ||
        order.lifecycle_timestamps?.[1] ||
        (order.created_at ? order.created_at.replace(/^(Today|Yesterday|[0-9A-Za-z\s]+),\s*/i, "") : null) ||
        "08:45 AM"
      );
    }

    // Completed steps: use progressive lifecycle timestamps if available
    if (order.lifecycle_timestamps && order.lifecycle_timestamps[stepNum]) {
      return order.lifecycle_timestamps[stepNum];
    }

    // Progressive offset calculation calculated strictly from Step 2 (Admin Acceptance time):
    const acceptTimeStr =
      order.accepted_time ||
      order.lifecycle_timestamps?.[2] ||
      order.updated_time;

    if (acceptTimeStr) {
      const match = acceptTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        let mins = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;

        const dateObj = new Date();
        dateObj.setHours(hours, mins, 0, 0);

        // 25-min delivery window calculated strictly from acceptance (Step 2):
        // Step 2: 0m (Accept & Packing started)
        // Step 3: +7m (Ready for dispatch)
        // Step 4: +14m (Out for delivery)
        // Step 5: +25m (Delivered within 25 min SLA)
        const offsets = { 2: 0, 3: 7, 4: 14, 5: 25 };
        dateObj.setMinutes(dateObj.getMinutes() + (offsets[stepNum] || 0));

        return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
    }

    return "Done";
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* 1. Drawer Header */}
      <Box
        sx={{
          flexShrink: 0,
          p: 2,
          bgcolor: "#f6f2f7",
          borderBottom: "1px solid #eae7eb",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: "20px",
                color: "#1b1b1e",
                letterSpacing: "-0.5px",
              }}
            >
              {order.order_id || `#${order.id}`}
            </Typography>

            {/* Header Status Badge */}
            {deliveryType === "scheduled" && currentStage === 1 ? (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: "9999px",
                  bgcolor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#c2410c",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.55px",
                }}
              >
                NEW ORDER CONFIRMATION
              </Box>
            ) : (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: "9999px",
                  bgcolor: badge.bg,
                  border: `1px solid ${badge.border}`,
                  color: badge.color,
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.55px",
                }}
              >
                {badge.label}
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setIsPrintModalOpen(true)}
              sx={{ color: "#545f73", "&:hover": { bgcolor: "#eae7eb" } }}
              title="Print Order Receipt"
            >
              <PrintOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: "#545f73", "&:hover": { bgcolor: "#eae7eb" } }}
              title="Close Panel"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Date & Delivery Mode Sub-banner */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: "#40493e" }} />
            <Typography sx={{ fontSize: "12.5px", color: "#40493e", fontWeight: 500 }}>
              {order.date_formatted || order.created_at || "Placed Today at 08:45 AM"}
            </Typography>
          </Box>

          <Box
            sx={{
              px: 1.2,
              py: 0.4,
              borderRadius: "9999px",
              bgcolor: deliveryType === "pickup" ? "#f5f3ff" : deliveryType === "scheduled" ? "#f0f9ff" : "#ecfdf5",
              border: `1px solid ${deliveryType === "pickup" ? "#ddd6fe" : deliveryType === "scheduled" ? "#bae6fd" : "#a7f3d0"}`,
              color: deliveryType === "pickup" ? "#7c3aed" : deliveryType === "scheduled" ? "#0284c7" : "#0c6b27",
              fontSize: "11.5px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {deliveryType === "pickup" && <StorefrontOutlinedIcon sx={{ fontSize: 13 }} />}
            {deliveryType === "scheduled" && <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />}
            {deliveryType === "express" && <BoltIcon sx={{ fontSize: 14 }} />}

            <span>
              {deliveryType === "pickup"
                ? `Shop Pickup: ${slotInfo.deliveryDateStr ? `${slotInfo.deliveryDateStr} • ` : ""}${slotInfo.displayTiming || "04:00 PM - 06:00 PM"}`
                : deliveryType === "scheduled"
                ? `Scheduled: ${slotInfo.deliveryDateStr ? `${slotInfo.deliveryDateStr} • ` : ""}${slotInfo.displayTiming || "04:00 PM - 06:00 PM"}`
                : "Instant Express (25 Mins)"}
            </span>
          </Box>
        </Box>
      </Box>

      {/* 2. Scrollable Body Content */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "3px" },
        }}
      >
        {/* SEQUENTIAL DISPATCH LIFECYCLE STEPPER */}
        <Box
          sx={{
            bgcolor: "#f6f2f7",
            borderRadius: "12px",
            p: 2,
            border: "1px solid #eae7eb",
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.55px",
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            SEQUENTIAL DISPATCH LIFECYCLE
          </Typography>

          <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Background connecting line with dynamic progress */}
            <Box
              sx={{
                position: "absolute",
                top: 14,
                left: 18,
                right: 18,
                height: 2,
                bgcolor: "#e4e1e6",
                zIndex: 0,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((Math.min(currentStage, stepsList.length) - 1) /
                        Math.max(1, stepsList.length - 1)) *
                        100
                    )
                  )}%`,
                  bgcolor: "#0c6b27",
                  transition: "width 0.3s ease",
                }}
              />
            </Box>

            {stepsList.map((step) => {
              const state = getStepState(step.num);
              const isCompleted = state === "completed";
              const isActive = state === "active";
              const isNext = step.num === currentStage + 1;

              let circleBg = "#e4e1e6";
              let circleColor = "#707a6d";
              let circleBorder = "none";
              let labelColor = "#707a6d";
              let subColor = "#94a3b8";
              let boxShadow = "none";

              if (isCompleted || isActive) {
                circleBg = "#0c6b27";
                circleColor = "#ffffff";
                labelColor = "#0c6b27";
                subColor = "#707a6d";
                if (isActive) {
                  boxShadow = "0px 0px 0px 3px #f6f2f7, 0px 0px 0px 5px #0c6b27";
                }
              } else if (isNext) {
                circleBg = "#fff7ed";
                circleColor = "#ea580c";
                circleBorder = "2px solid #f97316";
                labelColor = "#c2410c";
                subColor = "#ea580c";
              }

              return (
                <Box
                  key={step.num}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 1,
                    textAlign: "center",
                    minWidth: 50,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: circleBg,
                      color: circleColor,
                      border: circleBorder,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      boxShadow: boxShadow,
                      boxSizing: "border-box",
                    }}
                  >
                    {step.num}
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: isActive || isNext ? 700 : 600,
                      color: labelColor,
                      mt: 0.8,
                      lineHeight: "14px",
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      color: subColor,
                      lineHeight: "12px",
                      mt: 0.3,
                    }}
                  >
                    {getStepTime(step.num, isCompleted, isActive)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>



        {/* FULFILLMENT & ROUTING (Delivery Agent Details & Assignment) */}
        {showDeliveryAgentCard && (
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              p: 1.8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            {/* Section Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: currentAssignedAgent ? "#ecfdf5" : "#f1f5f9",
                    color: currentAssignedAgent ? "#0c6b27" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TwoWheelerIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Fulfillment & Routing
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: currentAssignedAgent ? "#0c6b27" : "#64748b" }}>
                    {currentAssignedAgent
                      ? (currentStage === 5
                          ? `Delivered by: ${currentAssignedAgent.name}`
                          : `Assigned: ${currentAssignedAgent.name}`)
                      : "Not Assigned Yet"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* If assigned, show rider details summary */}
            {currentAssignedAgent && (
              <Box
                sx={{
                  bgcolor: "#f8fafc",
                  borderRadius: "8px",
                  p: 1.2,
                  mb: isAgentSelectable ? 1.5 : 0,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                    {currentAssignedAgent.name}
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                    📞 {currentAssignedAgent.phone || currentAssignedAgent.mobile || "+91 98765 43210"}
                    {currentAssignedAgent.vehicle_number ? ` • 🏍️ ${currentAssignedAgent.vehicle_number}` : ""}
                  </Typography>
                </Box>
                {/* Delivery Agent Status Badge (Available in Dispatch/Packing, Busy ONLY in Out for Delivery) */}
                {(() => {
                  const isOfd = currentStage === 4 || ["out_for_delivery", "out for delivery", "ofd"].includes(
                    String(order.status || "").toLowerCase().trim()
                  );
                  const liveAgent = deliveryAgents.find((a) => String(a.id) === String(currentAssignedAgent.id));
                  const s = String(
                    liveAgent?.status ||
                    currentAssignedAgent.status ||
                    "online"
                  ).toLowerCase().trim();

                  let label = "Available";
                  let dotColor = "#16a34a";
                  let bg = "#ecfdf5";
                  let color = "#166534";
                  let border = "#bbf7d0";

                  // In Dispatch / Packing (Instant Express & Scheduled): Available!
                  // ONLY when the order moves to OFD does the rider show Busy!
                  if (isOfd) {
                    label = "Busy";
                    dotColor = "#d97706";
                    bg = "#fff7ed";
                    color = "#c2410c";
                    border = "#fdba74";
                  } else if (s === "offline" || s === "inactive") {
                    label = "Offline";
                    dotColor = "#94a3b8";
                    bg = "#f1f5f9";
                    color = "#64748b";
                    border = "#e2e8f0";
                  }

                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.6,
                          px: 1.1,
                          py: 0.35,
                          borderRadius: "9999px",
                          bgcolor: bg,
                          color: color,
                          border: `1px solid ${border}`,
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: dotColor,
                          }}
                        />
                        {label}
                      </Box>

                      {/* Quick Unassign icon button if order has not yet left for OFD */}
                      {isAgentSelectable && onUnassignAgent && (
                        <Tooltip title="Unassign Delivery Boy" arrow>
                          <IconButton
                            size="small"
                            onClick={handleUnassignClick}
                            disabled={isAssigning}
                            sx={{
                              color: "#94a3b8",
                              p: 0.5,
                              "&:hover": { color: "#dc2626", bgcolor: "#fee2e2" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            )}

            {/* Rider Selection Dropdown & Assign Button - visible in Instant Express stages 2 & 3, and Scheduled stage 3 */}
            {isAgentSelectable && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Typography sx={{ fontSize: "13px", color: "#94a3b8" }}>
                            Select Agent
                          </Typography>
                        );
                      }
                      const agent = deliveryAgents.find((a) => String(a.id) === String(selected));
                      if (!agent) {
                        return (
                          <Typography sx={{ fontSize: "13px", color: "#94a3b8" }}>
                            Select Agent
                          </Typography>
                        );
                      }
                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              bgcolor: agent.is_available ? "#16a34a" : "#94a3b8",
                              flexShrink: 0,
                            }}
                          />
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {agent.name}
                          </Typography>
                          <Typography sx={{ fontSize: "11.5px", color: "#64748b", flexShrink: 0 }}>
                            ({agent.phone || agent.mobile || "-"})
                          </Typography>
                        </Box>
                      );
                    }}
                    sx={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      height: 38,
                      bgcolor: "#fbfbf9",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ fontSize: "13px", color: "#94a3b8" }}>
                        {availableAgents.length === 0
                          ? "No Available Agents (All Busy)"
                          : "Select Available Agent"}
                      </Typography>
                    </MenuItem>
                    {availableAgents.map((agent) => (
                      <MenuItem
                        key={agent.id}
                        value={String(agent.id)}
                        disabled={String(agent.id) === String(currentAssignedId)}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "#16a34a",
                                flexShrink: 0,
                              }}
                            />
                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                              {agent.name}
                              {String(agent.id) === String(currentAssignedId) ? " (Currently Assigned)" : ""}
                            </Typography>
                            <Typography sx={{ fontSize: "11.5px", color: "#64748b" }}>
                              ({agent.phone || agent.mobile || "-"})
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              color: "#16a34a",
                              bgcolor: "#ecfdf5",
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                            }}
                          >
                            Available
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  disabled={!selectedAgentId || String(selectedAgentId) === String(currentAssignedId) || isAssigning}
                  onClick={handleAssignClick}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    height: 38,
                    px: 2.2,
                    borderRadius: "8px",
                    flexShrink: 0,
                    boxShadow: "0 2px 4px rgba(12, 107, 39, 0.2)",
                    "&:hover": { bgcolor: "#09531e" },
                    "&.Mui-disabled": {
                      bgcolor: "#e2e8f0",
                      color: "#94a3b8",
                    },
                  }}
                >
                  {isAssigning ? (
                    <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                  ) : currentAssignedAgent ? (
                    "Reassign"
                  ) : (
                    "Assign"
                  )}
                </Button>

                {/* Dedicated Unassign button when an agent is currently assigned */}
                {currentAssignedAgent && onUnassignAgent && (
                  <Button
                    variant="outlined"
                    onClick={handleUnassignClick}
                    disabled={isAssigning}
                    sx={{
                      color: "#dc2626",
                      borderColor: "#fca5a5",
                      bgcolor: "#fff5f5",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "13px",
                      height: 38,
                      px: 1.8,
                      borderRadius: "8px",
                      flexShrink: 0,
                      "&:hover": {
                        borderColor: "#dc2626",
                        bgcolor: "#fee2e2",
                      },
                    }}
                  >
                    Unassign
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* CUSTOMER & DELIVERY ADDRESS */}
        <Box
          sx={{
            bgcolor: "#f6f2f7",
            borderRadius: "12px",
            p: 1.5,
            border: "1px solid #eae7eb",
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.55px",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            CUSTOMER & DELIVERY
          </Typography>

          <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1b1b1e" }}>
            {order.customer?.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
            <Typography sx={{ fontSize: "12px", color: "#545f73" }}>
              {order.customer?.phone}
            </Typography>
            {Boolean(order.customer?.phone || order.phone) && (
              <IconButton
                size="small"
                onClick={handleOpenWhatsApp}
                title="Chat on WhatsApp"
                sx={{
                  color: "#16a34a",
                  p: 0.3,
                  "&:hover": { bgcolor: "#ecfdf5" },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.8 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 18, color: "#0c6b27", mt: 0.2 }} />
            <Typography sx={{ fontSize: "12px", color: "#40493e", lineHeight: "17px", whiteSpace: "pre-line" }}>
              {order.customer?.address || "Flat 402, Green Glen Layout, 100ft Road\nIndiranagar, Bengaluru, Karnataka - 560038"}
            </Typography>
          </Box>


        </Box>

        {/* ITEMIZED BASKET */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#545f73",
                letterSpacing: "0.55px",
                textTransform: "uppercase",
              }}
            >
              ITEMIZED BASKET ({basket.length} ITEMS)
            </Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#1b1b1e" }}>
              Subtotal: ₹{totalAmount}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#f6f2f7",
              borderRadius: "12px",
              p: 1,
              border: "1px solid #eae7eb",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {basket.map((item, idx) => (
              <Box key={item.id || idx}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                    px: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "8px",
                        objectFit: "cover",
                        bgcolor: "#e2e8f0",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: "#1b1b1e" }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#707a6d" }}>
                        {item.pack}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#1b1b1e" }}>
                      ₹{item.price?.toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveItem?.(order.id, item.id)}
                      sx={{ color: "#ba1a1a", p: "4px" }}
                      title="Remove Item"
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
                {idx < basket.length - 1 && <Divider sx={{ borderColor: "#eae7eb" }} />}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 3. Bottom Action Cluster */}
      <Box
        sx={{
          flexShrink: 0,
          p: 2,
          bgcolor: "#ffffff",
          borderTop: "1px solid #eae7eb",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
          zIndex: 2,
        }}
      >
        {(() => {
          // CANCELLED or REJECTED
          if (currentStage === -1) {
            return (
              <Button
                variant="outlined"
                fullWidth
                onClick={onClose}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  borderColor: "#cbd5e1",
                  color: "#1b1b1e",
                  bgcolor: "#ffffff",
                }}
              >
                Close Details
              </Button>
            );
          }

          // STAGE 1 (New Order) - Common across all 3 modes
          if (currentStage === 1) {
            const confirmLabel =
              deliveryType === "scheduled"
                ? "Confirm Order & Notify"
                : "Confirm Order & Send to Packing";

            return (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => onStatusTransition?.(order.id, "Cancelled")}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "13px",
                      borderColor: "#fca5a5",
                      bgcolor: "#ffffff",
                    }}
                  >
                    Reject / Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<WhatsAppIcon sx={{ fontSize: 17, color: "#16a34a" }} />}
                    onClick={handleOpenWhatsApp}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "#166534",
                      borderColor: "#bbf7d0",
                      bgcolor: "#ffffff",
                      "&:hover": {
                        borderColor: "#16a34a",
                        bgcolor: "#f0fdf4",
                      },
                    }}
                  >
                    Message User
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
                  onClick={() => onStatusTransition?.(order.id, "Confirmed")}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    borderRadius: "10px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    boxShadow: "0px 2px 4px rgba(12, 107, 39, 0.2)",
                    "&:hover": { bgcolor: "#09531e" },
                  }}
                >
                  {confirmLabel}
                </Button>
              </>
            );
          }

          // MODE: STORE PICKUP (4-Step Sequential Lifecycle)
          if (deliveryType === "pickup") {
            if (currentStage === 2) {
              return (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleReadyForPickup}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    borderRadius: "10px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    "&:hover": { bgcolor: "#09531e" },
                  }}
                >
                  Ready for pick up
                </Button>
              );
            }
            if (currentStage === 3) {
              return (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onStatusTransition?.(order.id, "Delivered")}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    borderRadius: "10px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    "&:hover": { bgcolor: "#09531e" },
                  }}
                >
                  Done
                </Button>
              );
            }
            // currentStage === 4 (Done)
            return (
              <Button
                variant="outlined"
                fullWidth
                onClick={onClose}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  borderColor: "#cbd5e1",
                  color: "#1b1b1e",
                  bgcolor: "#ffffff",
                }}
              >
                Close Details
              </Button>
            );
          }

          // MODE: SCHEDULED DELIVERY
          if (deliveryType === "scheduled") {
            if (currentStage === 2) {
              return (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onStatusTransition?.(order.id, "Ready for Dispatch")}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    borderRadius: "10px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    "&:hover": { bgcolor: "#09531e" },
                  }}
                >
                  Dispatch Order
                </Button>
              );
            }
            if (currentStage === 3) {
              return (
                <>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      if (!currentAssignedAgent) {
                        showAlert({
                          title: "Delivery Partner Required",
                          message: "Please select and assign an available delivery partner before dispatching this order.",
                          type: "warning",
                        });
                        return;
                      }
                      onStatusTransition?.(order.id, "Out for Delivery");
                    }}
                    sx={{
                      bgcolor: "#0c6b27",
                      color: "#ffffff",
                      borderRadius: "10px",
                      py: 1.2,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "14px",
                      "&:hover": { bgcolor: "#09531e" },
                    }}
                  >
                    Dispatch Order
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={onClose}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "13px",
                      borderColor: "#cbd5e1",
                      color: "#1b1b1e",
                      bgcolor: "#ffffff",
                    }}
                  >
                    Close Details
                  </Button>
                </>
              );
            }
            if (currentStage === 4) {
              // Handled on Delivery Boy Staff Page
              return (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onClose}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    borderColor: "#cbd5e1",
                    color: "#1b1b1e",
                    bgcolor: "#ffffff",
                  }}
                >
                  Close Details
                </Button>
              );
            }
            // currentStage === 5 (Done)
            return (
              <Button
                variant="outlined"
                fullWidth
                onClick={onClose}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  borderColor: "#cbd5e1",
                  color: "#1b1b1e",
                  bgcolor: "#ffffff",
                }}
              >
                Close Details
              </Button>
            );
          }

          // MODE: INSTANT EXPRESS (Component 12)
          if (currentStage === 2) {
            return (
              <Button
                variant="contained"
                fullWidth
                onClick={() => onStatusTransition?.(order.id, "Ready for Dispatch")}
                sx={{
                  bgcolor: "#0c6b27",
                  color: "#ffffff",
                  borderRadius: "10px",
                  py: 1.2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  "&:hover": { bgcolor: "#09531e" },
                }}
              >
                Dispatch Order
              </Button>
            );
          }

          if (currentStage === 3) {
            return (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (!currentAssignedAgent) {
                      showAlert({
                        title: "Delivery Partner Required",
                        message: "Please select and assign an available delivery partner before handing over for delivery.",
                        type: "warning",
                      });
                      return;
                    }
                    onStatusTransition?.(order.id, "Out for Delivery");
                  }}
                  sx={{
                    bgcolor: "#0c6b27",
                    color: "#ffffff",
                    borderRadius: "10px",
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    "&:hover": { bgcolor: "#09531e" },
                  }}
                >
                  Handover to Rider (Out for Delivery)
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onClose}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    borderColor: "#cbd5e1",
                    color: "#1b1b1e",
                    bgcolor: "#ffffff",
                  }}
                >
                  Close Details
                </Button>
              </>
            );
          }

          if (currentStage === 4) {
            // Stage 4 (OFD): No manual advance button in Figma! Handled by Delivery Boy staff page
            return (
              <Button
                variant="outlined"
                fullWidth
                onClick={onClose}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  borderColor: "#cbd5e1",
                  color: "#1b1b1e",
                  bgcolor: "#ffffff",
                }}
              >
                Close Details
              </Button>
            );
          }

          // currentStage === 5 (Done)
          return (
            <Button
              variant="outlined"
              fullWidth
              onClick={onClose}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                borderColor: "#cbd5e1",
                color: "#1b1b1e",
                bgcolor: "#ffffff",
              }}
            >
              Close Details
            </Button>
          );
        })()}
      </Box>

      {/* Printer Bill Preview Modal (Figma Spec) */}
      <PrinterBillPreviewModal
        open={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        order={order}
      />
    </Box>
  );
}
