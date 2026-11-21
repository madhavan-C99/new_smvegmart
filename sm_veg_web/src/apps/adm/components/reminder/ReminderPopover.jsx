import {
  Box,
  Typography,
  Popover,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import SnoozeIcon from "@mui/icons-material/Snooze";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";

export default function ReminderPopover({
  open = false,
  anchorEl = null,
  onClose,
  reminders = [],
  dueReminders = [],
  onMarkDone,
  onMarkAllDone,
  onMuteStockReminder,
  onResetTestReminders,
  onSnooze,
  onOpenOrders,
}) {
  const navigate = useNavigate();

  const handleOpenAction = (reminder) => {
    onClose?.();
    const isRiderLag = Boolean(reminder.isRiderPickupLag || reminder.subtype === "rider_pickup_lag");
    if (isRiderLag) {
      const rawPhone = reminder.riderPhone || reminder.order?.rider?.phone || "+919840123456";
      let cleanPhone = String(rawPhone).replace(/[^\d]/g, "");
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
        cleanPhone = `91${cleanPhone.slice(1)}`;
      }
      const riderName = reminder.riderName || reminder.order?.rider?.name || "Rider";
      const orderNum = reminder.orderNum || reminder.order?.order_number || reminder.order?.order_id || (reminder.order?.id ? `SMV-${reminder.order.id}` : "");
      const elapsedMins = reminder.elapsedMins || 8;
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
      return;
    }
    if (onOpenOrders) {
      onOpenOrders(reminder);
    } else if (reminder.type === "stock") {
      navigate("/admin/products", {
        state: {
          editProductId: reminder.product?.id || reminder.productId,
          searchTerm: reminder.product?.name || reminder.productName,
        },
      });
    } else {
      navigate("/admin/orders");
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: { xs: 350, sm: 450 },
          maxHeight: 580,
          borderRadius: "16px",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.16)",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* 1. Clean Top Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlarmOnOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.2px" }}>
              Operational Reminders
            </Typography>
            <Typography sx={{ fontSize: "11.5px", color: "#64748b" }}>
              Order packing & inventory alerts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          {reminders.length > 0 && (
            <Button
              size="small"
              onClick={onMarkAllDone}
              startIcon={<DoneAllIcon sx={{ fontSize: "14px !important" }} />}
              sx={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "none",
                px: 1.2,
                py: 0.4,
                borderRadius: "8px",
                "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
              }}
            >
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      {/* 2. Subheader Status Chip */}
      <Box
        sx={{
          px: 2,
          py: 1.1,
          bgcolor: "#f8fafc",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
          Active Alerts ({reminders.length})
        </Typography>
        {dueReminders.length > 0 && (
          <Chip
            size="small"
            label={`${dueReminders.length} Due Now`}
            sx={{
              bgcolor: "#fef2f2",
              color: "#dc2626",
              fontWeight: 700,
              fontSize: "11px",
              height: 22,
              border: "1px solid #fee2e2",
              borderRadius: "9999px",
            }}
          />
        )}
      </Box>

      {/* 3. Scrollable Reminders List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.6,
          display: "flex",
          flexDirection: "column",
          gap: 1.4,
          bgcolor: "#f8fafc",
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "4px" },
        }}
      >
        {reminders.length === 0 ? (
          <Box sx={{ py: 7, px: 2, textAlign: "center" }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
              All Caught Up!
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>
              All orders are packed and products are fully stocked.
            </Typography>
          </Box>
        ) : (
          reminders.map((reminder) => {
            const isStock = reminder.type === "stock";
            const isRiderLag = Boolean(reminder.isRiderPickupLag || reminder.subtype === "rider_pickup_lag");
            const isPickup = reminder.type === "pickup" || reminder.order?.delivery_mode === "pickup" || reminder.order?.delivery_mode === "shop_pickup";
            const isScheduled = reminder.type === "scheduled" || reminder.order?.delivery_mode === "scheduled";
            const isExpress = (reminder.type === "express" || reminder.order?.delivery_mode === "express") && !isRiderLag;
            const ord = reminder.order || {};
            const prod = reminder.product || {};

            // Left Border Accent & Icon Badge Coloring
            const accentColor = isStock || isRiderLag
              ? "#ef4444"
              : isExpress
              ? "#f59e0b"
              : isPickup
              ? "#0284c7"
              : "#059669";

            const iconBg = isStock || isRiderLag
              ? "#fee2e2"
              : isExpress
              ? "#fef3c7"
              : isPickup
              ? "#e0f2fe"
              : "#ecfdf5";

            const iconColor = isStock || isRiderLag
              ? "#dc2626"
              : isExpress
              ? "#d97706"
              : isPickup
              ? "#0284c7"
              : "#059669";

            const modeChipLabel = isStock
              ? "📦 Out of Stock"
              : isRiderLag
              ? "🛵 Rider Delay"
              : isExpress
              ? "⚡ Express 25m"
              : isPickup
              ? "🏪 Shop Pickup"
              : "📅 Scheduled Slot";

            return (
              <Box
                key={reminder.id}
                sx={{
                  p: 1.6,
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
                    borderColor: "#cbd5e1",
                    borderLeftColor: accentColor,
                  },
                }}
              >
                {/* Top Row: Icon + Title + Due Badge */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                  {/* Icon Badge */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: iconBg,
                      color: iconColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: 900,
                      fontSize: "16px",
                    }}
                  >
                    {isStock ? (
                      <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
                    ) : isExpress ? (
                      "⚡"
                    ) : isPickup ? (
                      <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Header Title & Badge */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 0.8 }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.35,
                          }}
                        >
                          {isStock ? (
                            `Refill: ${reminder.productName}`
                          ) : (
                            <>
                              <Box component="span" sx={{ display: "inline-block" }}>
                                {reminder.orderNum}
                              </Box>
                              <Typography
                                component="span"
                                sx={{
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#64748b",
                                  ml: 0.6,
                                  display: "inline",
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                }}
                              >
                                ({reminder.customerName})
                              </Typography>
                            </>
                          )}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={modeChipLabel}
                        sx={{
                          flexShrink: 0,
                          fontSize: "10px",
                          fontWeight: 700,
                          height: 20,
                          bgcolor: isStock || isRiderLag
                            ? "#fef2f2"
                            : isExpress
                            ? "#fffbeb"
                            : isPickup
                            ? "#f0f9ff"
                            : "#ecfdf5",
                          color: isStock || isRiderLag
                            ? "#dc2626"
                            : isExpress
                            ? "#b45309"
                            : isPickup
                            ? "#0284c7"
                            : "#059669",
                          border: `1px solid ${
                            isStock || isRiderLag
                              ? "#fee2e2"
                              : isExpress
                              ? "#fde68a"
                              : isPickup
                              ? "#bae6fd"
                              : "#a7f3d0"
                          }`,
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    {/* Subtitle / Timing Notice */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 13, color: isStock ? "#ef4444" : "#f59e0b" }} />
                      <Typography
                        sx={{
                          fontSize: "11.5px",
                          color: isStock ? "#b91c1c" : isExpress ? "#b45309" : "#475569",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reminder.timingLabel || reminder.dueText || "Action Required"}
                      </Typography>
                    </Box>

                    {/* Clean Inner Details Container */}
                    {isStock ? (
                      <Box
                        sx={{
                          mt: 1,
                          p: "7px 11px",
                          borderRadius: "8px",
                          bgcolor: "#f8fafc",
                          border: "1px solid #f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography sx={{ fontSize: "11px", color: "#475569", fontWeight: 500 }}>
                          📁 {prod.category_name || "Vegetables"} • {prod.subcategory_name || "Fresh"}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>
                          0 kg in Stock
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mt: 1,
                          p: "7px 11px",
                          borderRadius: "8px",
                          bgcolor: "#f8fafc",
                          border: "1px solid #f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#475569",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%",
                          }}
                        >
                          <ShoppingBagOutlinedIcon sx={{ fontSize: 13, color: "#64748b" }} />
                          {ord.items_preview || `${ord.items_count || 1} items`}
                        </Typography>
                        <Typography sx={{ fontSize: "11.5px", fontWeight: 800, color: "#0c6b27" }}>
                          ₹{Number(ord.amount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    {/* Action Buttons Row */}
                    <Box
                      sx={{
                        mt: 1.4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 0.8,
                      }}
                    >
                      {/* Main Primary Action Button */}
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenAction(reminder)}
                        startIcon={reminder.isRiderPickupLag ? <WhatsAppIcon sx={{ fontSize: "14px !important" }} /> : undefined}
                        endIcon={!reminder.isRiderPickupLag ? <ArrowForwardOutlinedIcon sx={{ fontSize: "13px !important" }} /> : undefined}
                        sx={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          textTransform: "none",
                          bgcolor: isStock
                            ? "#dc2626"
                            : reminder.isRiderPickupLag
                            ? "#16a34a"
                            : isExpress
                            ? "#0c6b27"
                            : "#0c6b27",
                          color: "#ffffff",
                          px: 1.4,
                          py: 0.5,
                          borderRadius: "8px",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: isStock
                              ? "#b91c1c"
                              : reminder.isRiderPickupLag
                              ? "#15803d"
                              : "#09531e",
                            boxShadow: isStock
                              ? "0 2px 8px rgba(220, 38, 38, 0.25)"
                              : reminder.isRiderPickupLag
                              ? "0 2px 8px rgba(22, 163, 74, 0.3)"
                              : "0 2px 8px rgba(12, 107, 39, 0.25)",
                          },
                        }}
                      >
                        {isStock
                          ? "Refill Product Stock"
                          : reminder.isRiderPickupLag
                          ? "WhatsApp: Time's Up!"
                          : reminder.isRiderUnassigned
                          ? "Assign Delivery Boy"
                          : "Open Packing Order"}
                      </Button>

                      {/* Right Secondary Actions: Green 'Don't Remind' Button for Out of Stock + Snooze */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        {isStock && (
                          <Tooltip title="Do not receive this out of stock alert again" arrow>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMuteStockReminder?.(reminder);
                              }}
                              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: "13px !important" }} />}
                              sx={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "none",
                                bgcolor: "#16a34a",
                                color: "#ffffff",
                                px: 1.1,
                                py: 0.45,
                                minWidth: "auto",
                                borderRadius: "8px",
                                boxShadow: "none",
                                whiteSpace: "nowrap",
                                "&:hover": {
                                  bgcolor: "#15803d",
                                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.35)",
                                },
                              }}
                            >
                              Don't Remind
                            </Button>
                          </Tooltip>
                        )}

                        <Button
                          size="small"
                          onClick={() => onSnooze?.(reminder.id, isExpress ? 5 : 15)}
                          startIcon={<SnoozeIcon sx={{ fontSize: "13px !important" }} />}
                          sx={{
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "none",
                            color: "#64748b",
                            bgcolor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            px: 1,
                            py: 0.4,
                            minWidth: "auto",
                            borderRadius: "8px",
                            "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a", borderColor: "#cbd5e1" },
                          }}
                        >
                          Snooze ({isExpress ? "5m" : "15m"})
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* 4. Clean Footer Links */}
      <Divider sx={{ borderColor: "#f1f5f9" }} />
      <Box
        sx={{
          p: 1.4,
          bgcolor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.2,
        }}
      >
        <Button
          size="small"
          onClick={() => {
            onClose?.();
            navigate("/admin/products");
          }}
          sx={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#0c6b27",
            textTransform: "none",
            p: 0,
            "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
          }}
        >
          All Products →
        </Button>
        <Button
          size="small"
          onClick={() => {
            onClose?.();
            navigate("/admin/orders");
          }}
          sx={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#0c6b27",
            textTransform: "none",
            p: 0,
            "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
          }}
        >
          Order Management →
        </Button>
      </Box>
    </Popover>
  );
}
