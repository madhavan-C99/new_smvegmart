import { useRef } from "react";
import {
  Box,
  InputBase,
  Typography,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";

export default function OrderFilterBar({
  searchTerm = "",
  onSearchChange,
  deliveryMode = "all",
  onDeliveryModeChange,
  dateFilter = "all",
  onDateFilterChange,
  onResetFilters,
}) {
  const dateInputRef = useRef(null);

  const handleOpenCalendar = (e) => {
    e?.stopPropagation?.();
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === "function") {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.click();
        }
      } catch (err) {
        dateInputRef.current?.click();
      }
    }
  };

  const formatCustomDateLabel = (dateStr) => {
    if (!dateStr || dateStr === "all" || dateStr === "today" || dateStr === "yesterday") {
      return null;
    }
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      }
    } catch (e) {
      // fallback
    }
    return dateStr;
  };

  const customDateLabel = formatCustomDateLabel(dateFilter);
  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        p: 2,
        boxShadow: "0px 1px 2px rgba(0,0,0,0.04)",
        border: "1px solid #eae7eb",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* 1. Search Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#f4f4f0",
          borderRadius: "10px",
          px: 1.5,
          py: 0.5,
          width: "100%",
        }}
      >
        <SearchIcon sx={{ color: "#707a6d", fontSize: 20, mr: 1 }} />
        <InputBase
          placeholder="Search by order ID (e.g. #SM-89421) or customer name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "14px",
            color: "#1b1b1e",
          }}
        />
        {searchTerm && (
          <IconButton
            size="small"
            onClick={() => onSearchChange("")}
            sx={{ p: 0.5, color: "#707a6d" }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* 2. Sub-filters toolbar */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
          gap: 1.5,
          alignItems: "end",
        }}
      >
        {/* Delivery Mode */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.33px",
              textTransform: "uppercase",
            }}
          >
            DELIVERY MODE
          </Typography>
          <Select
            size="small"
            value={deliveryMode}
            onChange={(e) => onDeliveryModeChange(e.target.value)}
            sx={{
              backgroundColor: "#f6f2f7",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1b1b1e",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              height: "38px",
            }}
          >
            <MenuItem value="all">All Modes</MenuItem>
            <MenuItem value="Express 25m">⚡ Express 25m</MenuItem>
            <MenuItem value="Scheduled Delivery">📅 Scheduled Delivery</MenuItem>
            <MenuItem value="Shop Pickup">🛍️ Shop Pickup</MenuItem>
          </Select>
        </Box>

        {/* Date Selector */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, position: "relative" }}>
          {/* Native Hidden Date Input */}
          <input
            type="date"
            ref={dateInputRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
            onChange={(e) => {
              if (e.target.value) {
                onDateFilterChange?.(e.target.value);
              }
            }}
          />

          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.33px",
              textTransform: "uppercase",
            }}
          >
            DATE
          </Typography>
          <Select
            size="small"
            value={dateFilter}
            onChange={(e) => {
              if (e.target.value === "pick_custom") {
                handleOpenCalendar();
              } else {
                onDateFilterChange?.(e.target.value);
              }
            }}
            endAdornment={
              <Tooltip title="Open calendar to pick date">
                <IconButton
                  size="small"
                  onClick={handleOpenCalendar}
                  sx={{
                    mr: 1,
                    p: 0.4,
                    color: customDateLabel ? "#2f853d" : "#545f73",
                    "&:hover": {
                      color: "#2f853d",
                      backgroundColor: "rgba(47,133,61,0.08)",
                    },
                  }}
                >
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            }
            sx={{
              backgroundColor: "#f6f2f7",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1b1b1e",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              height: "38px",
              minWidth: "160px",
            }}
          >
            <MenuItem value="all">All Dates</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            {customDateLabel && (
              <MenuItem value={dateFilter}>
                📅 {customDateLabel}
              </MenuItem>
            )}
            <MenuItem
              value="pick_custom"
              sx={{
                color: "#2f853d",
                fontWeight: 600,
                borderTop: "1px dashed #eae7eb",
                fontSize: "12.5px",
              }}
            >
              🗓️ Pick Date from Calendar...
            </MenuItem>
          </Select>
        </Box>

        {/* Reset Button */}
        <Button
          onClick={onResetFilters}
          startIcon={<RestartAltOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            height: "38px",
            backgroundColor: "#f0edf1",
            color: "#1b1b1e",
            textTransform: "none",
            borderRadius: "8px",
            px: 2,
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            "&:hover": { backgroundColor: "#e4e1e6" },
          }}
        >
          Reset Filters
        </Button>
      </Box>
    </Box>
  );
}
