import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

export default function DeliveryBoyDetailsModal({ open, onClose, boy }) {
  if (!boy) return null;

  const initial = (boy.name || "D").charAt(0).toUpperCase();
  const isActive = boy.is_active && (boy.status === "online" || boy.is_available);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: "#0c6b27",
          color: "#ffffff",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
          Delivery Boy Details
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#ffffff", opacity: 0.85, "&:hover": { opacity: 1 } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: "#ffffff" }}>
        {/* Profile Card (Avatar + Name + Badges) */}
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            bgcolor: "#fbfbf9",
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              bgcolor: "#0284c7",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)",
            }}
          >
            {initial}
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#1b1b1e", mb: 0.8 }}>
              {boy.name}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.8 }}>
              {(() => {
                const s = String(boy.status || "").toLowerCase().trim();
                const isBusy = s === "busy" || s === "on_delivery";
                const isOffline = s === "offline";

                const dotColor = isBusy ? "#d97706" : isOffline ? "#94a3b8" : "#16a34a";
                const bgColor = isBusy ? "#fef3c7" : isOffline ? "#f1f5f9" : "#ecfdf5";
                const textColor = isBusy ? "#92400e" : isOffline ? "#64748b" : "#166534";
                const borderColor = isBusy ? "#fde68a" : isOffline ? "#e2e8f0" : "#bbf7d0";
                const label = isBusy ? "Busy (On Delivery)" : isOffline ? "Offline" : "Online (Available)";

                return (
                  <Chip
                    size="small"
                    icon={<FiberManualRecordIcon sx={{ fontSize: "10px !important", color: `${dotColor} !important` }} />}
                    label={label}
                    sx={{
                      height: 24,
                      fontSize: "11.5px",
                      fontWeight: 700,
                      bgcolor: bgColor,
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                );
              })()}
            </Box>
          </Box>
        </Box>

        {/* 2 Metric Cards: Total Delivered & Delivered Today */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
          {/* Card 1: Total Delivered */}
          <Box
            sx={{
              p: 1.8,
              borderRadius: "12px",
              bgcolor: "#f0f9ff",
              border: "1px solid #bae6fd",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "9px",
                bgcolor: "#ffffff",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {boy.total_delivered ?? 0}
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, mt: 0.3 }}>
                Total Delivered
              </Typography>
            </Box>
          </Box>

          {/* Card 2: Delivered Today */}
          <Box
            sx={{
              p: 1.8,
              borderRadius: "12px",
              bgcolor: "#ecfdf5",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "9px",
                bgcolor: "#ffffff",
                color: "#0c6b27",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {boy.delivered_today ?? 0}
              </Typography>
              <Typography sx={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600, mt: 0.3 }}>
                Delivered Today
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* SECTION: CONTACT & ADDRESS */}
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#0c6b27",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Contact & Address
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
          {/* Mobile */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PhoneAndroidIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Mobile Number
              </Typography>
              <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: "#1b1b1e" }}>
                {boy.mobile || boy.mobile_number || "-"}
              </Typography>
            </Box>
          </Box>

          {/* Email */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <EmailOutlinedIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Email Address
              </Typography>
              <Typography sx={{ fontSize: "13.5px", fontWeight: 500, color: "#1b1b1e" }}>
                {boy.email || "-"}
              </Typography>
            </Box>
          </Box>

          {/* Address */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Address
              </Typography>
              <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#334155", lineHeight: 1.4 }}>
                {boy.address_line1 && <Box component="span" sx={{ fontWeight: 600 }}>{boy.address_line1}</Box>}
                {boy.address_line1 && boy.address_line2 && ", "}
                {boy.address_line2}
                {!boy.address_line1 && !boy.address_line2 && (boy.full_address || "-")}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* SECTION: VEHICLE & LICENSE DETAILS */}
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#0c6b27",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Vehicle & License
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
          {/* Vehicle Number */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TwoWheelerIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Vehicle Number
              </Typography>
              <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: "#1b1b1e" }}>
                {boy.vehicle_number || "Not Provided"}
              </Typography>
            </Box>
          </Box>

          {/* Driving License No */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: "#f1f5f9",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BadgeOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Driving License No
              </Typography>
              <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: "#1b1b1e" }}>
                {boy.driving_license_no || "Not Provided"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
