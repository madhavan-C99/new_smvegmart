import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton,
  Chip,
  Fade,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import reminderAlertSound from "../../utils/reminderAlertSound";

export default function ReminderAlertModal({
  open = false,
  reminder,
  onClose,
  onOpenOrders,
  onSnooze,
  onMarkDone,
  onMuteStockReminder,
}) {
  // Continuous audio chime while modal is visible
  useEffect(() => {
    if (open && reminder) {
      reminderAlertSound.startLoop(2200);
    } else {
      reminderAlertSound.stop();
    }
    return () => {
      reminderAlertSound.stop();
    };
  }, [open, reminder]);

  if (!reminder) return null;

  const isStock = reminder.type === "stock";
  const isPickup = reminder.type === "pickup";
  const isExpress = reminder.type === "express";
  const isRiderPickupLag = Boolean(reminder.isRiderPickupLag || reminder.subtype === "rider_pickup_lag");
  const isRiderUrgency = Boolean(reminder.isRiderUnassigned || reminder.subtype === "rider_lag");
  const isPackingLag = Boolean(reminder.isPackingLag || reminder.subtype === "packing_lag");

  const ord = reminder.order || {};
  const prod = reminder.product || {};

  const orderNum = reminder.orderNum || ord.order_number || ord.order_id || (ord.id ? `SMV-${ord.id}` : "");
  const customerName = reminder.customerName || ord.customer?.name || "Customer";
  const customerPhone = reminder.customerPhone || ord.customer?.phone || ord.phone || "+91 98401 23456";
  const customerAddress = reminder.customerAddress || ord.customer?.address || ord.address || "Chennai Area";
  const riderName = reminder.riderName || ord.rider?.name || "Karthik";
  const riderPhone = reminder.riderPhone || ord.rider?.phone || "+91 98401 23456";
  const riderVehicle = reminder.riderVehicle || ord.rider?.vehicle_number || "TN-01-AB-1234";
  const elapsedMins = reminder.elapsedMins || (isRiderPickupLag ? 8 : isRiderUrgency ? 12 : 8);
  const basketSummary =
    reminder.basketSummary ||
    (ord.items_preview ? `${ord.items_count || 1} Items (${ord.items_preview})` : "Fresh Produce Items");
  const storeAction =
    reminder.storeAction ||
    (isRiderPickupLag
      ? `Send WhatsApp to Rider (${riderName}): Time's up! Pick up order now`
      : isRiderUrgency
      ? "Assign Delivery Boy & Move to Dispatch"
      : "Move to Dispatch & Hand to Rider");

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
    reminderAlertSound.stop();
    onClose?.();
  };

  const handleAction = () => {
    reminderAlertSound.stop();
    if (isRiderPickupLag) {
      const rawPhone = riderPhone || reminder?.order?.rider?.phone || "+919840123456";
      let cleanPhone = String(rawPhone).replace(/[^\d]/g, "");
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
        cleanPhone = `91${cleanPhone.slice(1)}`;
      }
      const textMsg = encodeURIComponent(
        `🚨 *SM VegMart Urgent Dispatch Alert*\n\n` +
        `Order: *${orderNum}*\n` +
        `Hello ${riderName}, time's up! Your assigned order has been waiting at the dispatch counter for ${elapsedMins} mins.\n\n` +
        `⚠️ *Please pick up the package immediately for delivery.*`
      );
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${textMsg}`, "_blank", "noopener,noreferrer");
      }
      // For this reminder alone: dismiss and remove immediately on WhatsApp click
      onMarkDone?.(reminder.id);
      onClose?.();
      return;
    }
    onClose?.();
    onOpenOrders?.(reminder);
  };

  const handleSnoozeClick = () => {
    reminderAlertSound.stop();
    onSnooze?.(reminder.id, isExpress ? 5 : 15);
  };

  const handleMarkDoneClick = () => {
    reminderAlertSound.stop();
    onMarkDone?.(reminder.id);
  };

  // Color scheme matching standard SM VegMart UI design
  const iconBg = isRiderPickupLag
    ? "#fee2e2"
    : isStock
    ? "#fee2e2"
    : isExpress
    ? "#fef3c7"
    : isPickup
    ? "#e0f2fe"
    : "#fef3c7";

  const iconColor = isRiderPickupLag
    ? "#dc2626"
    : isStock
    ? "#dc2626"
    : isExpress
    ? "#d97706"
    : isPickup
    ? "#0284c7"
    : "#d97706";

  const borderColor = isRiderPickupLag
    ? "#fca5a5"
    : isStock
    ? "#fca5a5"
    : isPickup
    ? "#bae6fd"
    : "#fde68a";

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      TransitionComponent={Fade}
      transitionDuration={250}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: { xs: "95%", sm: 530 },
          borderRadius: "22px",
          p: { xs: 2.2, sm: 2.8 },
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.22)",
          border: `1.5px solid ${borderColor}`,
          bgcolor: "#ffffff",
          overflow: "hidden",
          position: "relative",
        },
      }}
    >
      {/* Top Close Button */}
      <IconButton
        onClick={() => {
          reminderAlertSound.stop();
          onClose?.();
        }}
        size="small"
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#94a3b8",
          bgcolor: "#f8fafc",
          "&:hover": { bgcolor: "#f1f5f9", color: "#1e293b" },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <DialogContent
        sx={{
          p: 0.5,
          pt: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Centered Pulsing Alarm / Icon Badge */}
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            bgcolor: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.8,
            boxShadow: `0 0 0 10px ${iconBg}50`,
            animation: "pulseRing 2s infinite ease-in-out",
            "@keyframes pulseRing": {
              "0%": { transform: "scale(0.96)", boxShadow: `0 0 0 4px ${iconBg}80` },
              "50%": { transform: "scale(1.04)", boxShadow: `0 0 0 12px ${iconBg}20` },
              "100%": { transform: "scale(0.96)", boxShadow: `0 0 0 4px ${iconBg}80` },
            },
          }}
        >
          {isRiderPickupLag ? (
            <TwoWheelerOutlinedIcon sx={{ fontSize: 32 }} />
          ) : isStock ? (
            <Inventory2OutlinedIcon sx={{ fontSize: 30 }} />
          ) : isPickup ? (
            <StorefrontOutlinedIcon sx={{ fontSize: 30 }} />
          ) : (
            <AlarmOnOutlinedIcon sx={{ fontSize: 32 }} />
          )}
        </Box>

        {/* Category Pill Tag */}
        <Chip
          label={
            isRiderPickupLag
              ? "🛵 Rider Delay • Pickup Lag"
              : isRiderUrgency
              ? "🛵 Instant Express • Assign Rider"
              : isPackingLag
              ? "⚡ Instant Express • Packing Lag"
              : isStock
              ? "🚨 Out of Stock • Inventory Alert"
              : isPickup
              ? "Shop Pickup Prep"
              : "Scheduled Slot Prep"
          }
          size="small"
          sx={{
            bgcolor: isRiderPickupLag ? "#fee2e2" : isStock ? "#fff1f2" : isPickup ? "#f0f9ff" : "#fffbeb",
            color: iconColor,
            fontWeight: 800,
            fontSize: "11px",
            mb: 1.2,
            border: `1px solid ${borderColor}`,
          }}
        />

        {/* Modal Title */}
        <Typography
          sx={{
            fontSize: "17.5px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.3,
            mb: 0.6,
          }}
        >
          {isRiderPickupLag
            ? `Rider Not Picked Up: ${orderNum}`
            : isRiderUrgency
            ? `Dispatch Express: ${orderNum}`
            : isPackingLag
            ? `Pack Express: ${orderNum}`
            : isStock
            ? `Refill Stock: ${reminder.productName}`
            : `Pack Order: ${orderNum}`}
        </Typography>

        {/* Notice / Warning Subtitle Line */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            color: isRiderPickupLag ? "#dc2626" : isStock ? "#dc2626" : "#d97706",
            mb: 2,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 15 }} />
          <Typography sx={{ fontSize: "12.5px", fontWeight: 700 }}>
            {isRiderPickupLag
              ? `⚠️ Bag sitting at counter for ${elapsedMins} mins!`
              : isRiderUrgency
              ? `⚠️ Assign Rider Urgency: ${elapsedMins} mins elapsed (Target: 10-12m)`
              : isPackingLag
              ? `⚠️ Packing Lag: ${elapsedMins} mins elapsed (Target: 7m)`
              : isStock
              ? "Product stock is 0 kg! Customers cannot order this item."
              : reminder.timingLabel || "Customer pickup slot active! Pack immediately."}
          </Typography>
        </Box>

        {/* Details Card (Clean Light Slate Box) */}
        {isRiderPickupLag ? (
          <Box
            sx={{
              width: "100%",
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              p: 2,
              mb: 2,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 1.1,
            }}
          >
            {/* Assigned Rider Row */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Typography sx={{ fontSize: "14px" }}>👤</Typography>
              <Typography sx={{ fontSize: "12.5px", color: "#334155" }}>
                <Box component="span" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  Assigned Rider:{" "}
                </Box>
                <Box component="span" sx={{ color: "#0284c7", fontWeight: 700 }}>
                  {riderName} ({riderVehicle})
                </Box>
              </Typography>
            </Box>

            {/* Rider Phone Row */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Typography sx={{ fontSize: "14px" }}>📞</Typography>
              <Typography sx={{ fontSize: "12px", color: "#475569" }}>
                <Box component="span" sx={{ color: "#64748b" }}>
                  Phone:{" "}
                </Box>
                <Box component="span" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {riderPhone}
                </Box>
                <Box component="span" sx={{ color: "#cbd5e1", mx: 0.6 }}>
                  •
                </Box>
                <Box component="span" sx={{ color: "#d97706", fontWeight: 700 }}>
                  Status: Assigned (Awaiting Pickup)
                </Box>
              </Typography>
            </Box>

            {/* Fresh Produce Row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "14px" }}>📦</Typography>
              <Typography sx={{ fontSize: "12px", color: "#d97706", fontWeight: 600 }}>
                Fresh produce packed &amp; waiting at dispatch table.
              </Typography>
            </Box>

            {/* WhatsApp Alert Urgency Banner */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                p: "7px 10px",
                borderRadius: "8px",
                mt: 0.2,
              }}
            >
              <WhatsAppIcon sx={{ fontSize: 16, color: "#16a34a" }} />
              <Typography sx={{ fontSize: "11.5px", color: "#166534", fontWeight: 600 }}>
                Action: Send WhatsApp to {riderName} that time&apos;s up to collect bag.
              </Typography>
            </Box>
          </Box>
        ) : isStock ? (
          <Box
            sx={{
              width: "100%",
              bgcolor: "#fff1f2",
              border: "1px solid #fecaca",
              borderRadius: "14px",
              p: 2,
              mb: 2,
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.8,
              }}
            >
              <Typography sx={{ fontSize: "13.5px", fontWeight: 800, color: "#1e293b" }}>
                {prod.name || reminder.productName}
              </Typography>
              <Chip
                label="0 kg in Stock"
                size="small"
                sx={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  height: 20,
                  bgcolor: "#fee2e2",
                  color: "#dc2626",
                }}
              />
            </Box>

            <Typography sx={{ fontSize: "11.5px", color: "#64748b", mb: 1 }}>
              📁 Category: <strong>{prod.category_name || "Vegetables"}</strong> (
              {prod.subcategory_name || "Fresh"})
            </Typography>

            <Box
              sx={{
                p: 1,
                bgcolor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #fca5a5",
              }}
            >
              <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#991b1b" }}>
                Out of Stock: {reminder.oosVariantLabels || "All variants (0 kg)"}
              </Typography>
              <Typography sx={{ fontSize: "10.5px", color: "#64748b", mt: 0.3 }}>
                Click below to update stock quantity on All Products page.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              p: 2,
              mb: 2,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 1.1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <PersonOutlineIcon sx={{ fontSize: 17, color: "#475569" }} />
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                  {customerName}
                </Typography>
              </Box>
              <Chip
                label={ord.status || "Pending"}
                size="small"
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  height: 18,
                  bgcolor: "#ecfdf5",
                  color: "#0c6b27",
                  border: "1px solid #a7f3d0",
                }}
              />
            </Box>

            {customerPhone && (
              <Typography sx={{ fontSize: "11.5px", color: "#64748b" }}>
                📞 {customerPhone}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                p: "6px 10px",
                borderRadius: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <ShoppingBagOutlinedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography sx={{ fontSize: "12px", color: "#334155" }}>
                  {basketSummary}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "12.5px", fontWeight: 800, color: "#0c6b27" }}>
                ₹{Number(ord.amount || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Action Buttons Row */}
      <DialogActions
        sx={{
          p: 0,
          pt: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* Snooze Button */}
        <Button
          onClick={handleSnoozeClick}
          variant="outlined"
          sx={{
            py: 0.9,
            px: 1.6,
            borderRadius: "10px",
            borderColor: "#cbd5e1",
            color: "#475569",
            fontWeight: 600,
            fontSize: "12px",
            textTransform: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            bgcolor: "#ffffff",
            "&:hover": {
              borderColor: "#94a3b8",
              bgcolor: "#f8fafc",
            },
          }}
        >
          ⏳ Snooze ({isExpress ? "5m" : "15m"})
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {/* Green 'Don't Remind Again' Button for Out of Stock */}
          {isStock && (
            <Button
              onClick={() => {
                onMuteStockReminder?.(reminder);
                onClose?.();
              }}
              variant="contained"
              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: "16px !important" }} />}
              sx={{
                py: 0.9,
                px: 1.8,
                borderRadius: "10px",
                bgcolor: "#16a34a",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "12.5px",
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                "&:hover": {
                  bgcolor: "#15803d",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
                },
              }}
            >
              Don't Remind Again
            </Button>
          )}

          {/* Primary Action Button */}
          <Button
            onClick={handleAction}
            variant="contained"
            startIcon={isRiderPickupLag ? <WhatsAppIcon sx={{ fontSize: "17px !important" }} /> : undefined}
            endIcon={!isRiderPickupLag ? <ArrowForwardOutlinedIcon sx={{ fontSize: "16px !important" }} /> : undefined}
            sx={{
              py: 0.9,
              px: 2,
              borderRadius: "10px",
              bgcolor: isStock ? "#dc2626" : isRiderPickupLag ? "#16a34a" : "#0c6b27",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "12.5px",
              textTransform: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: isStock
                ? "0 4px 14px rgba(220, 38, 38, 0.3)"
                : isRiderPickupLag
                ? "0 4px 14px rgba(22, 163, 74, 0.35)"
                : "0 4px 14px rgba(12, 107, 39, 0.3)",
              "&:hover": {
                bgcolor: isStock ? "#b91c1c" : isRiderPickupLag ? "#15803d" : "#09531e",
                boxShadow: isStock
                  ? "0 6px 18px rgba(220, 38, 38, 0.4)"
                  : "0 6px 18px rgba(12, 107, 39, 0.4)",
              },
            }}
          >
            {isRiderPickupLag
              ? "Send WhatsApp: Time's Up!"
              : isRiderUrgency
              ? "Assign Delivery Boy"
              : isStock
              ? "Refill Product Stock"
              : "Open Packing Order"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
