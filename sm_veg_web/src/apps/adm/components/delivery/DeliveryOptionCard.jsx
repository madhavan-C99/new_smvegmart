import React from "react";
import { Box, Typography } from "@mui/material";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import GreenSwitch from "./GreenSwitch";

export default function DeliveryOptionCard({
  deliveryOption,
  title,
  badge,
  description,
  isEnabled,
  onToggle,
  disabled = false,
}) {
  const getIcon = () => {
    switch (deliveryOption) {
      case "express":
        return <BoltOutlinedIcon sx={{ fontSize: 20, color: "#0c6b27" }} />;
      case "scheduled":
        return <CalendarMonthOutlinedIcon sx={{ fontSize: 20, color: "#0c6b27" }} />;
      case "pickup":
        return <StorefrontOutlinedIcon sx={{ fontSize: 20, color: "#0c6b27" }} />;
      default:
        return <BoltOutlinedIcon sx={{ fontSize: 20, color: "#0c6b27" }} />;
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e7e5e0",
        p: { xs: "16px 18px", md: "20px 22px" },
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        transition: "all 0.2s ease",
        boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
        "&:hover": {
          boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
          borderColor: "#cbd5e1",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Leading icon container */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            bgcolor: "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mt: 0.2,
          }}
        >
          {getIcon()}
        </Box>

        {/* Text content */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", mb: "4px" }}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1b1b1e",
                lineHeight: "20px",
              }}
            >
              {title}
            </Typography>

            {badge && (
              <Box
                sx={{
                  display: "inline-block",
                  px: "8px",
                  py: "2px",
                  borderRadius: "9999px",
                  bgcolor: "#0c6b27",
                  color: "#ffffff",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  lineHeight: "14px",
                  letterSpacing: "0.2px",
                }}
              >
                {badge}
              </Box>
            )}
          </Box>

          <Typography
            sx={{
              fontSize: "12.5px",
              color: "#64748b",
              lineHeight: "18px",
              maxWidth: 380,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Box>

      {/* Switch Toggle */}
      <Box sx={{ flexShrink: 0, pt: 0.5 }}>
        <GreenSwitch
          checked={Boolean(isEnabled)}
          onChange={(e) => onToggle && onToggle(e.target.checked)}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}
