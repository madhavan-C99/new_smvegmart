import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import orderAlertSound from "../../utils/orderAlertSound";

export default function NewOrderAlertModal({
  order,
  open,
  onClose,
  onViewOrder,
}) {
  // Start sound loop when modal opens; stop when it closes or unmounts
  useEffect(() => {
    if (open && order) {
      orderAlertSound.start();
    } else {
      orderAlertSound.stop();
    }

    return () => {
      orderAlertSound.stop();
    };
  }, [open, order]);

  if (!order) return null;

  const handleView = () => {
    orderAlertSound.stop();
    onViewOrder?.(order.id);
  };

  const handleClose = () => {
    orderAlertSound.stop();
    onClose?.();
  };

  // Prevent closing when user clicks outside the modal (backdrop) or presses Escape.
  // ONLY the top-right cross button (✕) or "View Order" button should close the modal and stop sound.
  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
    handleClose();
  };

  // Derive title from delivery mode
  const modeStr = String(order.delivery_mode || order.delivery_badge || "").toLowerCase();
  let title = "Incoming Express Order";
  let modeBadge = "Instant Express (25m)";
  let slotLabel = "Immediate Delivery";

  if (modeStr.includes("pickup")) {
    title = "Incoming Pickup Order";
    modeBadge = "Shop Pickup";
    slotLabel = "Counter Pickup";
  } else if (modeStr.includes("schedule")) {
    title = "Incoming Scheduled Order";
    modeBadge = "Scheduled Delivery";
    slotLabel = order.delivery_badge || "Scheduled Slot";
  }

  // Payment label
  const isPaid = order.payment_status === true || String(order.payment_status).toLowerCase() === "paid";
  const payLabel = isPaid ? "UPI Paid" : "Online Payment (UPI)";

  // Customer details
  const customer = order.customer || {};
  const custName = customer.name || "Customer";
  const custPhone = customer.phone || "+91 98765 43210";
  const custAddress = customer.address || "Address Pending";
  const initials = customer.avatar || (custName.slice(0, 2).toUpperCase());
  const avatarBg = customer.avatarBg || "#15803d";

  // Basket items
  const basket = Array.isArray(order.basket) ? order.basket : [];
  const itemsCount = basket.length || order.items_count || 1;

  // Calculation breakdown
  const subtotal = order.amount ? (order.amount * 0.88).toFixed(2) : "120.00";
  const deliveryFee = modeStr.includes("pickup") ? "0.00" : "10.00";
  const handlingFee = "9.00";
  const totalAmount = order.amount ? Number(order.amount).toFixed(2) : "139.00";

  return (
    <Dialog
      open={Boolean(open && order)}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          p: 0,
          border: "1px solid #e2e8f0",
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {/* TOP BAR: Live Order Alert + Order # + Time + Close Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {/* Live Order Alert Red Badge */}
            <Chip
              icon={<BoltIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
              label="Live Order Alert"
              size="small"
              sx={{
                bgcolor: "#ef4444",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "11px",
                height: 24,
                borderRadius: "6px",
                px: 0.5,
                "& .MuiChip-icon": { ml: "4px" },
              }}
            />

            {/* Order Number Badge */}
            <Chip
              label={order.order_number || order.order_id || (order.id ? `SMV-${order.id}` : "")}
              size="small"
              sx={{
                bgcolor: "#dcfce7",
                color: "#166534",
                border: "1px solid #bbf7d0",
                fontWeight: 800,
                fontSize: "11.5px",
                height: 24,
                borderRadius: "6px",
              }}
            />

            {/* Time */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#64748b" }}>
              <AccessTimeIcon sx={{ fontSize: 13 }} />
              <Typography sx={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                {order.created_at || "Just now"}
              </Typography>
            </Box>
          </Box>

          {/* Close Button */}
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: "#94a3b8",
              "&:hover": { color: "#1e293b", bgcolor: "#f1f5f9" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* TITLE */}
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.3px",
            mb: 1.2,
          }}
        >
          {title}
        </Typography>

        {/* PILLS: DELIVERY MODE & PAYMENT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.2 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              px: 1.2,
              py: 0.4,
              borderRadius: "6px",
              bgcolor: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <TwoWheelerIcon sx={{ fontSize: 14 }} />
            {modeBadge}
          </Box>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              px: 1.2,
              py: 0.4,
              borderRadius: "6px",
              bgcolor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
            {payLabel} • ₹{Math.round(order.amount || 120)}
          </Box>
        </Box>

        {/* CUSTOMER & DELIVERY BOX */}
        <Box
          sx={{
            bgcolor: "#f8fafc",
            borderRadius: "12px",
            p: 2,
            border: "1px solid #e2e8f0",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  bgcolor: avatarBg,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {initials}
              </Box>
              <Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                  {custName}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.3 }}>
                  📞 {custPhone}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>
                SLOT
              </Typography>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                {slotLabel}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.8, mt: 1 }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "#0c6b27", mt: 0.2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.4 }}>
              {custAddress}
            </Typography>
          </Box>
        </Box>

        {/* ITEMS TO PACK */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.2 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 16, color: "#64748b" }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#64748b", letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Items to Pack ({itemsCount} {itemsCount === 1 ? "Item" : "Items"})
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {basket.length > 0 ? (
              basket.map((item, idx) => (
                <Box
                  key={item.id || idx}
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: idx < basket.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      component="img"
                      src={item.image || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120"}
                      alt={item.name}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "8px",
                        objectFit: "cover",
                        bgcolor: "#f8fafc",
                        border: "1px solid #f1f5f9",
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ fontSize: "11.5px", color: "#64748b", mt: 0.3 }}>
                        {item.pack || `Qty: ${item.quantity || 1}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                    ₹{Math.round(item.price || 0)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                {order.items_preview || "Fresh Farm Produce items"}
              </Box>
            )}
          </Box>
        </Box>

        {/* BILL SUMMARY BOX */}
        <Box
          sx={{
            bgcolor: "#f8fafc",
            borderRadius: "12px",
            p: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
            <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
              Subtotal ({itemsCount} items)
            </Typography>
            <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
              ₹{subtotal}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
            <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
              Express 25m Delivery Fee
            </Typography>
            <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
              ₹{deliveryFee}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.2 }}>
            <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
              Eco-Friendly Bag &amp; Handling
            </Typography>
            <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
              ₹{handlingFee}
            </Typography>
          </Box>

          <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: "13.5px", fontWeight: 800, color: "#1e293b" }}>
              Total Amount Paid
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "17px", fontWeight: 800, color: "#0c6b27" }}>
                ₹{totalAmount}{" "}
                <Typography component="span" sx={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>
                  ({isPaid ? "Prepaid UPI" : "COD"})
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: "#e2e8f0" }} />

      {/* FOOTER ACTIONS */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: "#ffffff", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleView}
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: "#0c6b27",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "13.5px",
            px: 3,
            py: 1,
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(12, 107, 39, 0.3)",
            "&:hover": { bgcolor: "#09531e" },
          }}
        >
          View Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}
