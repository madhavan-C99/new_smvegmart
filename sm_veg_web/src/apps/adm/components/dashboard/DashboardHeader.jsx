import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function DashboardHeader({
  period = "yearly",
  onPeriodChange,
  selectedYear = 2026,
  onYearChange,
  selectedMonth = 11,
  onMonthChange,
  availableYears = [2026, 2025, 2024],
  onExportReport,
  isExporting = false,
}) {
  const [exportAnchor, setExportAnchor] = useState(null);

  const handleMenuClose = () => {
    setExportAnchor(null);
  };

  const handleSelectFormat = (format) => {
    setExportAnchor(null);
    onExportReport?.(format);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
      }}
    >
      {/* Title */}
      <Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#1b1b1e",
            letterSpacing: "-0.6px",
            lineHeight: "32px",
          }}
        >
          Dashboard
        </Typography>
      </Box>

      {/* Right Controls: Period Dropdown & Export Report */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {/* Period Selector Dropdown */}
        <FormControl size="small">
          <Select
            value={period}
            onChange={(e) => onPeriodChange?.(e.target.value)}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            renderValue={(val) => {
              const monthObj = MONTH_OPTIONS.find((m) => m.value === Number(selectedMonth));
              const monthName = monthObj ? monthObj.label : "November";
              let displayLabel = "Today (Live)";
              if (val === "monthly") {
                displayLabel = `Monthly (${monthName} ${selectedYear})`;
              } else if (val === "yearly") {
                displayLabel = `Yearly (${selectedYear})`;
              }
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarTodayOutlinedIcon
                    sx={{ fontSize: 15, color: "#64748b" }}
                  />
                  <Typography
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {displayLabel}
                  </Typography>
                </Box>
              );
            }}
            sx={{
              height: 38,
              minWidth: 195,
              bgcolor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              "&:hover": {
                bgcolor: "#f8fafc",
              },
              "& .MuiSelect-select": {
                py: 0,
                pr: "28px !important",
              },
            }}
          >
            <MenuItem value="today" sx={{ fontSize: "13px" }}>
              Today (Live)
            </MenuItem>
            <MenuItem value="monthly" sx={{ fontSize: "13px" }}>
              Monthly View
            </MenuItem>
            <MenuItem value="yearly" sx={{ fontSize: "13px" }}>
              Yearly View
            </MenuItem>
          </Select>
        </FormControl>

        {/* Dynamic Month Selector when Monthly is selected */}
        {period === "monthly" && (
          <FormControl size="small">
            <Select
              value={selectedMonth}
              onChange={(e) => onMonthChange?.(Number(e.target.value))}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: 38,
                minWidth: 125,
                bgcolor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "&:hover": { bgcolor: "#f8fafc" },
                "& .MuiSelect-select": {
                  py: 0,
                  pr: "28px !important",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                },
              }}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value} sx={{ fontSize: "13px" }}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Dynamic Year Selector when Monthly or Yearly is selected */}
        {(period === "monthly" || period === "yearly") && (
          <FormControl size="small">
            <Select
              value={selectedYear}
              onChange={(e) => onYearChange?.(Number(e.target.value))}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                height: 38,
                minWidth: 95,
                bgcolor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "&:hover": { bgcolor: "#f8fafc" },
                "& .MuiSelect-select": {
                  py: 0,
                  pr: "28px !important",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#1e293b",
                },
              }}
            >
              {availableYears.map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: "13px" }}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Export Report Button Group */}
        <Box sx={{ display: "inline-flex", alignItems: "center" }}>
          <Button
            variant="contained"
            disabled={isExporting}
            onClick={() => onExportReport?.("pdf")}
            startIcon={
              isExporting ? (
                <CircularProgress size={16} sx={{ color: "#ffffff" }} />
              ) : (
                <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              bgcolor: "#0c6b27",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "12.5px",
              height: 38,
              pl: 2,
              pr: 1.2,
              borderTopLeftRadius: "8px",
              borderBottomLeftRadius: "8px",
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: "#09531e",
              },
              "&.Mui-disabled": {
                bgcolor: "#166534",
                color: "#e2e8f0",
              },
            }}
          >
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>

          <Button
            variant="contained"
            disabled={isExporting}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{
              bgcolor: "#09531e",
              color: "#ffffff",
              minWidth: 32,
              width: 32,
              height: 38,
              p: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: "8px",
              borderBottomRightRadius: "8px",
              borderLeft: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: "#073f17",
              },
              "&.Mui-disabled": {
                bgcolor: "#14532d",
                color: "#cbd5e1",
              },
            }}
          >
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          </Button>
        </Box>

        {/* Dropdown Menu for Export Format Options */}
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              minWidth: 230,
              p: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={() => handleSelectFormat("pdf")}
            sx={{ borderRadius: "6px", py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 18, color: "#dc2626" }} />
            </ListItemIcon>
            <ListItemText
              primary="PDF Report (Visual & Charts)"
              secondary="Includes KPI cards, chart, and queue table"
              primaryTypographyProps={{ fontSize: "12.5px", fontWeight: 700 }}
              secondaryTypographyProps={{ fontSize: "10.5px" }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => handleSelectFormat("csv")}
            sx={{ borderRadius: "6px", py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <TableChartOutlinedIcon sx={{ fontSize: 18, color: "#0c6b27" }} />
            </ListItemIcon>
            <ListItemText
              primary="CSV Spreadsheet Data"
              secondary="Raw data for Excel analysis"
              primaryTypographyProps={{ fontSize: "12.5px", fontWeight: 700 }}
              secondaryTypographyProps={{ fontSize: "10.5px" }}
            />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
