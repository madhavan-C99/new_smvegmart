import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  Button,
  Divider,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrderNotifications } from "../context/OrderNotificationContext";
import { useReminders } from "../context/ReminderContext";
import { useAuth } from "../context/AuthContext";
import ReminderPopover from "../components/reminder/ReminderPopover";

export default function AdmNavbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOrderManagementPage =
    location.pathname.includes("/admin/orders") ||
    location.pathname.endsWith("/orders");

  const {
    unreadOrders,
    unreadCount,
    hasUnread,
    markOrderAsRead,
    markAllAsRead,
    setTargetOrderId,
  } = useOrderNotifications();

  const {
    reminders,
    dueReminders,
    reminderCount,
    hasDueReminders,
    markReminderDone,
    markAllRemindersDone,
    muteStockReminder,
    snoozeReminder,
    openReminderOrders,
    resetTestReminders,
  } = useReminders();

  const [reminderAnchorEl, setReminderAnchorEl] = useState(null);
  const isReminderPopoverOpen = Boolean(reminderAnchorEl);

  const handleOpenReminders = (event) => {
    setReminderAnchorEl(event.currentTarget);
  };

  const handleCloseReminders = () => {
    setReminderAnchorEl(null);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const isPopoverOpen = Boolean(anchorEl);

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleViewOrder = (targetOrder) => {
    const rawId =
      typeof targetOrder === "object" && targetOrder !== null
        ? (targetOrder.id || targetOrder.order_id)
        : targetOrder;
    markOrderAsRead(rawId);
    setTargetOrderId(rawId);
    handleCloseNotifications();
    navigate("/admin/orders", { state: { targetOrderId: rawId, timestamp: Date.now() } });
  };

  const { user, logout } = useAuth();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const handleOpenProfile = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseProfile();
    logout();
    navigate("/admin/login");
  };

  const handleGoToOrderManagement = () => {
    handleCloseNotifications();
    navigate("/admin/orders");
  };

  return (
    <Box
      sx={{
        height: 64,
        px: { xs: 2, sm: 3, md: 4 },
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #e7e5e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Hamburger Button (Tablet/Mobile) + Live Catalog Synchronized */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "8px", sm: "12px" } }}>
        <IconButton
          onClick={onMenuToggle}
          size="small"
          aria-label="Open sidebar"
          sx={{
            display: { xs: "inline-flex", lg: "none" },
            width: 36,
            height: 36,
            border: "1px solid #e7e5e0",
            borderRadius: "8px",
            color: "#1b1b1e",
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#10b981",
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: "11px", sm: "12px" },
              fontWeight: 500,
              color: "#0c6b27",
              lineHeight: "16px",
              whiteSpace: "nowrap",
            }}
          >
            Live Catalog Synchronized
          </Typography>
        </Box>
      </Box>

      {/* Right: Notifications & Profile Pill */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "10px", sm: "16px" } }}>
        {/* Operational Reminder (⏰) Button */}
        <IconButton
          onClick={handleOpenReminders}
          aria-label="Operational reminders"
          title={hasDueReminders ? `${reminderCount} packing & operational reminders due` : "Reminders"}
          sx={{
            width: 38,
            height: 38,
            border: "1px solid",
            borderColor: hasDueReminders ? "#fde68a" : "#e7e5e0",
            borderRadius: "8px",
            color: hasDueReminders ? "#d97706" : "#4B5563",
            p: 0,
            bgcolor: isReminderPopoverOpen ? "#fef3c7" : hasDueReminders ? "#fffbeb" : "#ffffff",
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: "#fef3c7" },
          }}
        >
          <Badge
            badgeContent={reminderCount}
            invisible={!hasDueReminders}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#d97706",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 800,
                height: 18,
                minWidth: 18,
                px: 0.5,
                borderRadius: "9px",
                top: 4,
                right: 4,
                boxShadow: "0 0 0 2px #ffffff",
              },
            }}
          >
            <AlarmOnOutlinedIcon sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>

        {/* Operational Reminder Dropdown Popover */}
        <ReminderPopover
          open={isReminderPopoverOpen}
          anchorEl={reminderAnchorEl}
          onClose={handleCloseReminders}
          reminders={reminders}
          dueReminders={dueReminders}
          onMarkDone={markReminderDone}
          onMarkAllDone={markAllRemindersDone}
          onMuteStockReminder={muteStockReminder}
          onResetTestReminders={resetTestReminders}
          onSnooze={snoozeReminder}
          onOpenOrders={(rem) => {
            handleCloseReminders();
            openReminderOrders(rem);
          }}
        />

        {/* Notification Bell Button */}
        <IconButton
          onClick={handleOpenNotifications}
          aria-label="Order notifications"
          title={!isOrderManagementPage && hasUnread ? `${unreadCount} new order notifications` : "Notifications"}
          sx={{
            width: 38,
            height: 38,
            border: "1px solid #e7e5e0",
            borderRadius: "8px",
            color: "#4B5563",
            p: 0,
            bgcolor: isPopoverOpen ? "#f1f5f9" : "#ffffff",
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: "#F9FAFB" },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            invisible={!hasUnread}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#dc2626",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 800,
                height: 18,
                minWidth: 18,
                px: 0.5,
                borderRadius: "9px",
                top: 4,
                right: 4,
                boxShadow: "0 0 0 2px #ffffff",
              },
            }}
          >
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>

        {/* Notification Dropdown Popover */}
        <Popover
          open={isPopoverOpen}
          anchorEl={anchorEl}
          onClose={handleCloseNotifications}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: { xs: 340, sm: 440, md: 460 },
              maxWidth: "calc(100vw - 32px)",
              maxHeight: 540,
              borderRadius: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          {/* Popover Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "15px", color: "#1e293b" }}>
                Order Notifications
              </Typography>
              {hasUnread && (
                <Chip
                  label={`${unreadCount} New`}
                  size="small"
                  sx={{
                    bgcolor: "#ecfdf5",
                    color: "#0c6b27",
                    border: "1px solid #a7f3d0",
                    fontWeight: 700,
                    fontSize: "11px",
                    height: 22,
                  }}
                />
              )}
            </Box>

            {hasUnread && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{
                  textTransform: "none",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: "#0c6b27",
                  p: 0,
                  minWidth: "auto",
                  "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
                }}
              >
                Mark all as read
              </Button>
            )}
          </Box>

          {/* Popover Body: Unread Orders List */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              maxHeight: 380,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "3px" },
            }}
          >
            {!hasUnread ? (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#ecfdf5",
                    color: "#0c6b27",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 0.5,
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 26 }} />
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  All caught up!
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#64748b", maxWidth: 260 }}>
                  No unread order notifications. When customers place new orders, alerts appear here live.
                </Typography>
              </Box>
            ) : (
              unreadOrders.map((order, idx) => {
                const orderNumber = order.order_id || `#${order.id}`;
                const customerName = order.customer?.name || "Customer";
                const customerPhone = order.customer?.phone || "";
                const itemsCount =
                  order.items_count || (order.basket ? order.basket.length : 1);
                const totalAmount =
                  order.amount !== undefined
                    ? order.amount
                    : (order.basket || []).reduce((s, i) => s + (i.price || 0), 0);
                const deliveryMode =
                  order.delivery_badge ||
                  order.delivery_mode ||
                  "Instant Express";
                const placedTime =
                  order.created_time ||
                  order.date_formatted ||
                  order.created_at ||
                  "Just now";

                return (
                  <Box
                    key={order.id || idx}
                    onClick={() => handleViewOrder(order)}
                    sx={{
                      p: 2,
                      borderBottom: "1px solid #f1f5f9",
                      bgcolor: "#ffffff",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                      "&:hover": { bgcolor: "#f8fafc" },
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {/* Top Row: Order ID + Time */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            bgcolor: "#ecfdf5",
                            color: "#0c6b27",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Typography sx={{ fontSize: "13.5px", fontWeight: 800, color: "#1e293b" }}>
                          {orderNumber}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 12, color: "#94a3b8" }} />
                        <Typography sx={{ fontSize: "11px", color: "#64748b" }}>
                          {placedTime}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Middle: Customer & Order Details */}
                    <Box sx={{ pl: { xs: 0, sm: 4.5 } }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                        {customerName} {customerPhone ? `(${customerPhone})` : ""}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.2 }}>
                        {itemsCount} {itemsCount === 1 ? "item" : "items"} •{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "#1b1b1e" }}>
                          ₹{Number(totalAmount).toFixed(2)}
                        </Box>
                      </Typography>
                    </Box>

                    {/* Bottom: Delivery Mode Tag + View Order Action */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        pl: { xs: 0, sm: 4.5 },
                        pt: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                          flexWrap: "wrap",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Chip
                          label="New Order"
                          size="small"
                          sx={{
                            bgcolor: "#ecfdf5",
                            color: "#0c6b27",
                            border: "1px solid #a7f3d0",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            height: 22,
                            flexShrink: 0,
                          }}
                        />
                        <Chip
                          label={deliveryMode}
                          size="small"
                          title={deliveryMode}
                          sx={{
                            bgcolor: "#f1f5f9",
                            color: "#475569",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            height: 22,
                            maxWidth: { xs: 150, sm: 220 },
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order);
                        }}
                        sx={{
                          bgcolor: "#0c6b27",
                          color: "#ffffff",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "12px",
                          py: 0.6,
                          px: 2,
                          borderRadius: "8px",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 4px rgba(12, 107, 39, 0.2)",
                          "&:hover": { bgcolor: "#09531e" },
                        }}
                      >
                        View Order
                      </Button>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Popover Footer */}
          <Divider sx={{ borderColor: "#e2e8f0" }} />
          <Box sx={{ p: 1.5, bgcolor: "#f8fafc", textAlign: "center" }}>
            <Button
              fullWidth
              size="small"
              onClick={handleGoToOrderManagement}
              endIcon={<ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#0c6b27",
                py: 0.8,
                "&:hover": { bgcolor: "#ecfdf5" },
              }}
            >
              Go to Order Management
            </Button>
          </Box>
        </Popover>

        {/* Profile Pill & Menu */}
        <Box
          onClick={handleOpenProfile}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            pl: "9px",
            borderLeft: "1px solid #e7e5e0",
            cursor: "pointer",
            p: "4px 8px",
            borderRadius: "10px",
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: "#f8fafc" },
          }}
        >
          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#1b1b1e",
                lineHeight: "15px",
              }}
            >
              {user?.name || "Operations Admin"}
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: "#707a6d",
                lineHeight: "16.5px",
              }}
            >
              {user?.email || user?.mobile || "admin@smvegmart.com"}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "#0c6b27",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow: "0px 0px 0px 2px rgba(16,185,129,0.2)",
            }}
          >
            {(user?.name ? user.name.slice(0, 2).toUpperCase() : "SM")}
          </Box>
        </Box>

        {/* Profile Actions Dropdown Menu */}
        <Menu
          anchorEl={profileAnchorEl}
          open={isProfileMenuOpen}
          onClose={handleCloseProfile}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 1.2,
              minWidth: 200,
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: "#f8fafc" }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
              {user?.name || "Operations Admin"}
            </Typography>
            <Typography sx={{ fontSize: "11.5px", color: "#64748b" }}>
              {user?.email || user?.mobile || "admin@smvegmart.com"}
            </Typography>
            <Chip
              label={user?.role === "admin" ? "Administrator" : "Admin Staff"}
              size="small"
              sx={{
                mt: 0.8,
                fontSize: "10px",
                fontWeight: 700,
                height: 18,
                bgcolor: "#ecfdf5",
                color: "#0c6b27",
                border: "1px solid #a7f3d0",
              }}
            />
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1,
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: 600,
              "&:hover": { bgcolor: "#fee2e2" },
            }}
          >
            <ListItemIcon sx={{ color: "#dc2626", minWidth: 32 }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }} />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
