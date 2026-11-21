import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Fade,
} from "@mui/material";
import DeliveryOptionCard from "../components/delivery/DeliveryOptionCard";
import DeliveryConfigurationSection from "../components/delivery/DeliveryConfigurationSection";
import deliveryAPI from "../services/deliveryAPI";

export default function DeliveryOptions() {
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. HTTP REST Fallback Initial Load
  const fetchInitialHttpData = useCallback(async () => {
    try {
      const response = await deliveryAPI.fetchConfiguration();
      if (response?.data && response.data.status === "SUCCESS") {
        setConfigData(response.data);
      }
    } catch (err) {
      console.warn("⚠️ [DeliveryOptions] REST initial fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. WebSocket Connection
  const connectWebSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const wsUrl = deliveryAPI.getWsUrl();
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("🟢 [DeliveryOptions WebSocket] Connected to /ws/delivery_options/");
        setWsConnected(true);
        socket.send(JSON.stringify({ action: "init_all" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const payload = data.payload || (data.status === "SUCCESS" && data.data ? data.data : null);

          if (payload && (data.action === "init_all" || data.action === "update" || data.status === "SUCCESS")) {
            setConfigData(payload);
            setLoading(false);
          }
        } catch (parseErr) {
          console.error("❌ [DeliveryOptions WebSocket] Parse error:", parseErr);
        }
      };

      socket.onerror = (err) => {
        console.warn("⚠️ [DeliveryOptions WebSocket] Error:", err);
      };

      socket.onclose = () => {
        console.warn("🔴 [DeliveryOptions WebSocket] Closed. Reconnecting in 3s...");
        setWsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (e) {
      console.error("❌ [DeliveryOptions WebSocket] Init error:", e);
    }
  }, []);

  useEffect(() => {
    fetchInitialHttpData();
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchInitialHttpData, connectWebSocket]);

  // 3. Actions / Toggles with Optimistic UI & Socket / REST Fallback
  const handleToggleOption = async (option, isEnabled) => {
    // Optimistic local state update
    setConfigData((prev) => {
      if (!prev) return prev;
      const updatedConfigs = (prev.order_configurations || []).map((cfg) =>
        cfg.delivery_option === option ? { ...cfg, is_enabled: isEnabled } : cfg
      );
      const updatedSection = prev[option] ? { ...prev[option], is_enabled: isEnabled } : prev[option];
      return {
        ...prev,
        order_configurations: updatedConfigs,
        [option]: updatedSection,
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "toggle_option",
          delivery_option: option,
          is_enabled: isEnabled,
        })
      );
    } else {
      try {
        await deliveryAPI.toggleOption(option, isEnabled);
      } catch (err) {
        console.error("Failed to toggle option via REST:", err);
        fetchInitialHttpData(); // Rollback on error
      }
    }
  };

  const handleToggleDay = async (deliveryOption, dayId, isAvailable) => {
    // Optimistic local state update
    setConfigData((prev) => {
      if (!prev || !prev[deliveryOption]) return prev;
      const targetDays = (prev[deliveryOption].days || []).map((d) => {
        if (d.day_id === dayId) {
          const updatedSlots = (d.slots || []).map((s) => ({
            ...s,
            is_active: isAvailable,
            status: isAvailable ? "Active" : "Disabled",
          }));
          return {
            ...d,
            is_available: isAvailable,
            status_label: isAvailable ? "Available" : "Disabled",
            slots: updatedSlots,
          };
        }
        return d;
      });
      return {
        ...prev,
        [deliveryOption]: {
          ...prev[deliveryOption],
          days: targetDays,
        },
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "toggle_day",
          delivery_option: deliveryOption,
          day_id: dayId,
          is_available: isAvailable,
        })
      );
    } else {
      try {
        await deliveryAPI.toggleDay(deliveryOption, dayId, isAvailable);
      } catch (err) {
        console.error("Failed to toggle day via REST:", err);
        fetchInitialHttpData();
      }
    }
  };

  const handleToggleSlot = async (mappingId, isActive) => {
    // Optimistic local update
    setConfigData((prev) => {
      if (!prev) return prev;
      const updateSlotsInOption = (optionData) => {
        if (!optionData?.days) return optionData;
        const updatedDays = optionData.days.map((d) => {
          let hasActive = false;
          const updatedSlots = (d.slots || []).map((s) => {
            if (s.mapping_id === mappingId) {
              const newActive = isActive;
              if (newActive) hasActive = true;
              return {
                ...s,
                is_active: newActive,
                status: newActive ? "Active" : "Disabled",
              };
            }
            if (s.is_active) hasActive = true;
            return s;
          });
          return {
            ...d,
            is_available: hasActive,
            status_label: hasActive ? "Available" : "Disabled",
            slots: updatedSlots,
          };
        });
        return { ...optionData, days: updatedDays };
      };

      return {
        ...prev,
        scheduled: updateSlotsInOption(prev.scheduled),
        pickup: updateSlotsInOption(prev.pickup),
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "toggle_slot",
          mapping_id: mappingId,
          is_active: isActive,
        })
      );
    } else {
      try {
        await deliveryAPI.toggleSlot(mappingId, isActive);
      } catch (err) {
        console.error("Failed to toggle slot via REST:", err);
        fetchInitialHttpData();
      }
    }
  };

  if (loading && !configData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={36} sx={{ color: "#0c6b27" }} />
      </Box>
    );
  }

  // Find configs for the top 3 cards
  const expressConfig =
    configData?.order_configurations?.find((c) => c.delivery_option === "express") ||
    configData?.express || {
      delivery_option: "express",
      title: "Instant Delivery",
      badge: "15-30 Min",
      description: "Allow customers to place orders for immediate priority packaging and dispatch.",
      is_enabled: true,
    };

  const scheduledConfig =
    configData?.order_configurations?.find((c) => c.delivery_option === "scheduled") ||
    configData?.scheduled || {
      delivery_option: "scheduled",
      title: "Scheduled Delivery",
      badge: null,
      description: "Allow customers to choose specific upcoming delivery dates and scheduled time windows.",
      is_enabled: true,
    };

  const pickupConfig =
    configData?.order_configurations?.find((c) => c.delivery_option === "pickup") ||
    configData?.pickup || {
      delivery_option: "pickup",
      title: "Shop Pickup",
      badge: null,
      description: "Allow customers to shop and order products online for convenient pickup at our store.",
      is_enabled: true,
    };

  return (
    <Fade in timeout={300}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 } }}>
        {/* Status Indicator (Catalog Synchronized / WebSocket Live) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: wsConnected ? "#10b981" : "#f59e0b",
              boxShadow: wsConnected
                ? "0 0 0 3px rgba(16,185,129,0.2)"
                : "0 0 0 3px rgba(245,158,11,0.2)",
            }}
          />
          <Typography
            sx={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {wsConnected ? "Live Catalog Synchronized" : "Connecting to real-time sync..."}
          </Typography>
        </Box>

        {/* Page Title & Subtitle */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: "22px", md: "26px" },
              fontWeight: 800,
              color: "#1b1b1e",
              lineHeight: 1.2,
              letterSpacing: "-0.4px",
            }}
          >
            Delivery Options
          </Typography>
          <Typography
            sx={{
              fontSize: "13.5px",
              color: "#64748b",
              mt: "4px",
              lineHeight: "20px",
            }}
          >
            Manage delivery options, operational dispatch parameters, and customer booking schedules.
          </Typography>
        </Box>

        {/* Top 3 Cards Grid */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <DeliveryOptionCard
              deliveryOption="express"
              title={expressConfig.title || "Instant Delivery"}
              badge={expressConfig.badge || "15-30 Min"}
              description={
                expressConfig.description ||
                "Allow customers to place orders for immediate priority packaging and dispatch."
              }
              isEnabled={expressConfig.is_enabled}
              onToggle={(val) => handleToggleOption("express", val)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DeliveryOptionCard
              deliveryOption="scheduled"
              title={scheduledConfig.title || "Scheduled Delivery"}
              badge={scheduledConfig.badge}
              description={
                scheduledConfig.description ||
                "Allow customers to choose specific upcoming delivery dates and scheduled time windows."
              }
              isEnabled={scheduledConfig.is_enabled}
              onToggle={(val) => handleToggleOption("scheduled", val)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <DeliveryOptionCard
              deliveryOption="pickup"
              title={pickupConfig.title || "Shop Pickup"}
              badge={pickupConfig.badge}
              description={
                pickupConfig.description ||
                "Allow customers to shop and order products online for convenient pickup at our store."
              }
              isEnabled={pickupConfig.is_enabled}
              onToggle={(val) => handleToggleOption("pickup", val)}
            />
          </Grid>
        </Grid>

        {/* 1. Scheduled Delivery Configuration Section */}
        <DeliveryConfigurationSection
          title="Scheduled Delivery Configuration"
          slotsTitle="Delivery Time Slots"
          configData={configData?.scheduled}
          deliveryOption="scheduled"
          onToggleDay={handleToggleDay}
          onToggleSlot={handleToggleSlot}
        />

        {/* 2. Shop Pickup Configuration Section */}
        <DeliveryConfigurationSection
          title="Shop Pickup Configuration"
          slotsTitle="Pickup Time Slots"
          configData={configData?.pickup}
          deliveryOption="pickup"
          onToggleDay={handleToggleDay}
          onToggleSlot={handleToggleSlot}
        />
      </Box>
    </Fade>
  );
}
