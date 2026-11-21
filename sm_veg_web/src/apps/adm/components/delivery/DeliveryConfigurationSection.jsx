import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import GreenSwitch from "./GreenSwitch";

export default function DeliveryConfigurationSection({
  title,
  slotsTitle = "Delivery Time Slots",
  configData,
  deliveryOption, // 'scheduled' or 'pickup'
  onToggleDay,
  onToggleSlot,
}) {
  const days = configData?.days || [];

  // Filter only days that are currently enabled/available
  const availableDays = useMemo(() => {
    return days.filter((d) => Boolean(d.is_available));
  }, [days]);

  // Default selected day is the first available day
  const [selectedDayId, setSelectedDayId] = useState(() => {
    const firstAvailable = days.find((d) => Boolean(d.is_available));
    return firstAvailable ? firstAvailable.day_id : (days[0]?.day_id || 1);
  });

  // Keep selectedDayId synchronized: if selected day gets disabled, auto-switch to first available day
  useEffect(() => {
    if (availableDays.length > 0) {
      const isCurrentValid = availableDays.some((d) => d.day_id === Number(selectedDayId));
      if (!isCurrentValid) {
        setSelectedDayId(availableDays[0].day_id);
      }
    }
  }, [availableDays, selectedDayId]);

  // Find currently selected day object among available days
  const activeDay = useMemo(() => {
    const found = availableDays.find((d) => d.day_id === Number(selectedDayId));
    return found || availableDays[0] || null;
  }, [availableDays, selectedDayId]);

  const activeSlots = activeDay?.slots || [];

  return (
    <Box sx={{ mt: { xs: 3, md: 4 } }}>
      {/* Section Title */}
      <Typography
        sx={{
          fontSize: "17px",
          fontWeight: 800,
          color: "#1b1b1e",
          mb: 2,
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </Typography>

      <Grid container spacing={3}>
        {/* Left Box: Available Days */}
        <Grid item xs={12} lg={4.5} xl={4}>
          <Box
            sx={{
              bgcolor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e7e5e0",
              p: { xs: "18px 20px", md: "22px 24px" },
              height: "100%",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1b1b1e",
                mb: 2.5,
              }}
            >
              Available Days
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {days.map((day) => {
                const isAvailable = Boolean(day.is_available);
                return (
                  <Box
                    key={day.day_id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: "6px",
                      borderBottom: "1px solid #f8fafc",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1b1b1e",
                          minWidth: 90,
                        }}
                      >
                        {day.day_name}
                      </Typography>

                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: "8px",
                          py: "2px",
                          borderRadius: "9999px",
                          bgcolor: isAvailable ? "#ecfdf5" : "#f1f5f9",
                          color: isAvailable ? "#0c6b27" : "#64748b",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {isAvailable ? "Available" : "Disabled"}
                      </Box>
                    </Box>

                    <GreenSwitch
                      checked={isAvailable}
                      onChange={(e) => onToggleDay && onToggleDay(deliveryOption, day.day_id, e.target.checked)}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Grid>

        {/* Right Box: Time Slots */}
        <Grid item xs={12} lg={7.5} xl={8}>
          <Box
            sx={{
              bgcolor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e7e5e0",
              p: { xs: "18px 20px", md: "22px 24px" },
              height: "100%",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Header with Title and Day Dropdown */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1b1b1e",
                }}
              >
                {slotsTitle}
              </Typography>

              {/* Day Selector */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    mb: "2px",
                  }}
                >
                  Available Days
                </Typography>
                <Select
                  value={
                    availableDays.some((d) => d.day_id === Number(selectedDayId))
                      ? selectedDayId
                      : (availableDays[0]?.day_id || "")
                  }
                  onChange={(e) => setSelectedDayId(Number(e.target.value))}
                  size="small"
                  sx={{
                    minWidth: 150,
                    height: 36,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1b1b1e",
                    bgcolor: "#f8fafc",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e2e8f0",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0c6b27",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0c6b27",
                    },
                  }}
                >
                  {availableDays.length === 0 ? (
                    <MenuItem disabled value="" sx={{ fontSize: "13px" }}>
                      No available days
                    </MenuItem>
                  ) : (
                    availableDays.map((d) => (
                      <MenuItem key={d.day_id} value={d.day_id} sx={{ fontSize: "13px" }}>
                        {d.day_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </Box>
            </Box>

            {/* Slots Table */}
            <TableContainer sx={{ border: "1px solid #f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fafafa" }}>
                    <TableCell
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.4px",
                        py: "12px",
                      }}
                    >
                      START TIME
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.4px",
                        py: "12px",
                      }}
                    >
                      END TIME
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.4px",
                        py: "12px",
                      }}
                    >
                      SLOT LABEL
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.4px",
                        py: "12px",
                      }}
                    >
                      STATUS
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: "0.4px",
                        py: "12px",
                      }}
                    >
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeSlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                        No time slots configured for {activeDay?.day_name || "this day"}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeSlots.map((slot) => {
                      const isActive = Boolean(slot.is_active);
                      return (
                        <TableRow
                          key={slot.mapping_id}
                          sx={{
                            "&:hover": { bgcolor: "#f8fafc" },
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          {/* Start Time with clock icon */}
                          <TableCell sx={{ py: "14px", fontWeight: 500, fontSize: "13px", color: "#1b1b1e" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                              {slot.start_time}
                            </Box>
                          </TableCell>

                          {/* End Time */}
                          <TableCell sx={{ py: "14px", fontWeight: 500, fontSize: "13px", color: "#1b1b1e" }}>
                            {slot.end_time}
                          </TableCell>

                          {/* Slot Label */}
                          <TableCell sx={{ py: "14px", fontWeight: 600, fontSize: "13px", color: "#1b1b1e" }}>
                            {slot.slot_label}
                          </TableCell>

                          {/* Status Pill */}
                          <TableCell align="center" sx={{ py: "14px" }}>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                px: "10px",
                                py: "3px",
                                borderRadius: "9999px",
                                bgcolor: isActive ? "#ecfdf5" : "#f3f4f6",
                                border: isActive ? "1px solid rgba(167,243,208,0.6)" : "1px solid #e5e7eb",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  bgcolor: isActive ? "#0c6b27" : "#9ca3af",
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: isActive ? "#0c6b27" : "#64748b",
                                  lineHeight: "14px",
                                }}
                              >
                                {isActive ? "Active" : "Disabled"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Actions Switch */}
                          <TableCell align="right" sx={{ py: "14px" }}>
                            <GreenSwitch
                              checked={isActive}
                              onChange={(e) => onToggleSlot && onToggleSlot(slot.mapping_id, e.target.checked)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
