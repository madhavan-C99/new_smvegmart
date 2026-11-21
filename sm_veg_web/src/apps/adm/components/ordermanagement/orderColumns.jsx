import { Box, Typography, IconButton } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

export const getStatusBadgeStyle = (status) => {
  const s = String(status || "").toLowerCase().trim();

  if (s === "new_order" || s === "pending" || s === "new order" || s === "waiting") {
    return {
      label: "Waiting",
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: <NotificationsNoneIcon sx={{ fontSize: 13, mr: 0.5, color: "#2563eb" }} />,
    };
  }
  if (s === "confirmed" || s === "packing" || s === "confirmed & packing" || s === "confirm & packing") {
    return {
      label: "Confirmed & Packing",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
    };
  }
  if (s === "ready_for_dispatch" || s === "ready for dispatch" || s === "dispatch" || s === "dispatched") {
    return {
      label: "Dispatch",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
    };
  }
  if (s === "ready_for_pick_up" || s === "ready for pick up" || s === "ready for pickup") {
    return {
      label: "Ready for Pick Up",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
    };
  }
  if (s === "out_for_delivery" || s === "out for delivery" || s === "ofd") {
    return {
      label: "Out for Delivery",
      color: "#0c6b27",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      dot: "#10b981",
    };
  }
  if (s === "delivered" || s === "done") {
    return {
      label: "Delivered",
      color: "#0c6b27",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      dot: "#10b981",
    };
  }
  if (s === "cancelled") {
    return {
      label: "Cancelled",
      color: "#ba1a1a",
      bg: "#fef2f2",
      border: "#fecaca",
    };
  }
  return {
    label: status || "Pending",
    color: "#545f73",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  };
};

export const getOrderColumns = ({ onViewOrder }) => [
  {
    field: "s_no",
    headerName: "#",
    minWidth: 50,
    align: "center",
    sticky: true,
    stickyWidth: 50,
    renderCell: (row, index, globalIndex) => (
      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#545f73" }}>
        {row.s_no || globalIndex + 1}
      </Typography>
    ),
  },
  {
    field: "order_id",
    headerName: "ORDER ID",
    minWidth: 120,
    align: "left",
    renderCell: (row) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#1b1b1e" }}>
          {row.order_id || `#${row.id}`}
        </Typography>
        {["new_order", "pending", "new order"].includes(String(row.status || "").toLowerCase()) && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "#d97706",
            }}
          />
        )}
      </Box>
    ),
  },
  {
    field: "customer",
    headerName: "CUSTOMER",
    minWidth: 180,
    align: "left",
    renderCell: (row) => {
      const cust = row.customer || {};
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              bgcolor: cust.avatarBg || "#2f853d",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {cust.avatar || (cust.name ? cust.name.slice(0, 2).toUpperCase() : "CU")}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1b1b1e",
                lineHeight: "18px",
              }}
            >
              {cust.name || "Customer"}
            </Typography>
            <Typography
              sx={{
                fontSize: "11.5px",
                color: "#707a6d",
                lineHeight: "15px",
              }}
            >
              {cust.phone || ""}
            </Typography>
          </Box>
        </Box>
      );
    },
  },
  {
    field: "created_at",
    headerName: "DATE & TIME",
    minWidth: 145,
    align: "left",
    renderCell: (row) => (
      <Typography sx={{ fontSize: "12.5px", fontWeight: 500, color: "#545f73", whiteSpace: "nowrap" }}>
        {row.created_at || "Today"}
      </Typography>
    ),
  },
  {
    field: "items",
    headerName: "ITEMS",
    minWidth: 160,
    align: "left",
    renderCell: (row) => (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1b1b1e" }}>
          {row.items_count ? `${row.items_count} items` : `${row.basket?.length || 0} items`}
        </Typography>
        <Typography
          sx={{
            fontSize: "11.5px",
            color: "#707a6d",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 150,
          }}
        >
          {row.items_preview || "Fresh vegetables"}
        </Typography>
      </Box>
    ),
  },
  {
    field: "amount",
    headerName: "AMOUNT",
    minWidth: 100,
    align: "right",
    renderCell: (row) => (
      <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#1b1b1e" }}>
        ₹{row.amount || 0}
      </Typography>
    ),
  },
  {
    field: "delivery_mode",
    headerName: "DELIVERY",
    minWidth: 150,
    align: "left",
    renderCell: (row) => {
      const mode = String(row.delivery_mode || "Express 25m");
      const modeLower = mode.toLowerCase();
      let icon = <BoltIcon sx={{ fontSize: 16, color: "#16a34a" }} />;
      let label = mode;

      if (modeLower.includes("express")) {
        icon = <BoltIcon sx={{ fontSize: 16, color: "#16a34a" }} />;
        label = "Express 25m";
      } else if (modeLower.includes("schedul")) {
        icon = <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: "#0284c7" }} />;
        label = "Scheduled Delivery";
      } else if (modeLower.includes("pickup") || modeLower.includes("shop")) {
        icon = <StorefrontOutlinedIcon sx={{ fontSize: 15, color: "#7c3aed" }} />;
        label = "Shop Pickup";
      }

      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.6,
            fontSize: "12px",
            color: "#40493e",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {icon}
          <span>{label}</span>
        </Box>
      );
    },
  },
  {
    field: "status",
    headerName: "STATUS",
    minWidth: 140,
    align: "left",
    renderCell: (row) => {
      const badge = getStatusBadgeStyle(row.status);
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.2,
            py: 0.4,
            borderRadius: "9999px",
            bgcolor: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.color,
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {badge.icon}
          {badge.dot && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: badge.dot,
                mr: 0.6,
              }}
            />
          )}
          <span>{badge.label}</span>
        </Box>
      );
    },
  },
  {
    field: "action",
    headerName: "ACTION",
    minWidth: 70,
    align: "center",
    renderCell: (row) => (
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onViewOrder?.(row);
        }}
        sx={{
          color: "#545f73",
          border: "1px solid #e7e5e0",
          borderRadius: "6px",
          p: "5px",
          bgcolor: "#ffffff",
          "&:hover": { bgcolor: "#f3f4f6", color: "#0c6b27" },
        }}
      >
        <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
      </IconButton>
    ),
  },
];
