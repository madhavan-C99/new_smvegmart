import { useState, useMemo } from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";

export default function RevenueDistributionChart({
  data = [],
  period = "yearly",
  year = 2026,
  month = 11,
}) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // 12-month data from backend (100% Dynamic Real Database Orders)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsData = useMemo(() => {
    if (Array.isArray(data) && data.length === 12) {
      return data;
    }
    // Fallback template with 0s if data is still loading
    return monthNames.map((m) => ({
      month: m,
      vegetables: 0,
      exotics: 0,
      fruits: 0,
      total: 0,
    }));
  }, [data]);

  // Chart scaling: Dynamically calculate ceiling based on actual max monthly revenue
  const chartHeight = 180;
  const rawMax = Math.max(...monthsData.map((d) => d.total || 0), 0);

  const isLakhs = rawMax >= 100000;
  const isThousands = !isLakhs && rawMax >= 1000;

  let maxScale = 10;
  if (isLakhs) {
    maxScale = Math.ceil(rawMax / 100000 / 2) * 2 * 100000 || 1000000;
  } else if (isThousands) {
    maxScale = Math.ceil(rawMax / 1000 / 5) * 5 * 1000 || 15000;
  } else {
    maxScale = Math.ceil(rawMax / 100) * 100 || 500;
  }

  // 5 Y-Axis steps
  const yLevels = [1, 0.8, 0.6, 0.4, 0.2].map((factor, idx) => {
    const val = maxScale * factor;
    let label = "";
    if (isLakhs) {
      label = `₹${Math.round(val / 100000)}L`;
    } else if (isThousands) {
      label = `₹${Math.round(val / 1000)}k`;
    } else {
      label = `₹${Math.round(val)}`;
    }
    return { factor, val, label, topPercent: (idx / 5) * 100 };
  });

  const handleExportCSV = () => {
    const headers = "Month,Vegetables & Greens (INR),Exotics & Hydroponics (INR),Fruits & Staples (INR),Total Revenue (INR)\n";
    const rows = monthsData
      .map((d) => `"${d.month}",${d.vegetables},${d.exotics},${d.fruits},${d.total}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_distribution_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: "12px",
        p: 2.2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        minHeight: 380,
      }}
    >
      {/* Top: Header with Title & Action Buttons */}
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.2,
          }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.4px",
              }}
            >
              Revenue Distribution
            </Typography>
            <Typography sx={{ fontSize: "11px", color: "#64748b", fontWeight: 500, mt: 0.2 }}>
              12-Month Performance for {year}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              size="small"
              onClick={handleExportCSV}
              sx={{
                bgcolor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: "11.5px",
                fontWeight: 600,
                px: 1.5,
                py: 0.4,
                borderRadius: "5px",
                textTransform: "none",
                minWidth: "auto",
                "&:hover": { bgcolor: "#e2e8f0" },
              }}
            >
              CSV
            </Button>
            <Button
              size="small"
              onClick={handleExportPDF}
              sx={{
                bgcolor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: "11.5px",
                fontWeight: 600,
                px: 1.5,
                py: 0.4,
                borderRadius: "5px",
                textTransform: "none",
                minWidth: "auto",
                "&:hover": { bgcolor: "#e2e8f0" },
              }}
            >
              PDF
            </Button>
          </Box>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            borderBottom: "1px solid #f1f5f9",
            pb: 1.5,
            pt: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: "2px", bgcolor: "#059669" }} />
            <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#475569" }}>
              Vegetables & Greens
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: "2px", bgcolor: "#34d399" }} />
            <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#475569" }}>
              Exotics & Hydroponics
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: "2px", bgcolor: "#fbbf24" }} />
            <Typography sx={{ fontSize: "11.5px", fontWeight: 600, color: "#475569" }}>
              Fruits & Staples
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Chart Area */}
      <Box sx={{ position: "relative", width: "100%", height: 230, mt: 1 }}>
        {/* Horizontal Y-Axis Grid Lines & Labels */}
        {yLevels.map((lvl) => (
          <Box
            key={lvl.label}
            sx={{
              position: "absolute",
              top: `${lvl.topPercent}%`,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#94a3b8",
                width: 42,
                textAlign: "right",
                pr: 1,
                userSelect: "none",
              }}
            >
              {lvl.label}
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: "1px",
                bgcolor: "#f1f5f9",
              }}
            />
          </Box>
        ))}

        {/* Stacked Bars Container */}
        <Box
          sx={{
            position: "absolute",
            bottom: 24,
            left: 48,
            right: 10,
            top: 10,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: { xs: 0.5, md: 1 },
          }}
        >
          {monthsData.map((d, index) => {
            const vegHeight = maxScale > 0 ? (d.vegetables / maxScale) * chartHeight : 0;
            const exoticHeight = maxScale > 0 ? (d.exotics / maxScale) * chartHeight : 0;
            const fruitHeight = maxScale > 0 ? (d.fruits / maxScale) * chartHeight : 0;
            const isHovered = hoveredMonth === index;

            return (
              <Box
                key={d.month}
                onMouseEnter={() => setHoveredMonth(index)}
                onMouseLeave={() => setHoveredMonth(null)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  height: "100%",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "12px", mb: 0.5 }}>
                        {d.month} • Total: ₹{Number(d.total || 0).toLocaleString("en-IN")}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: "#34d399" }}>
                        Vegetables: ₹{Number(d.vegetables || 0).toLocaleString("en-IN")}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: "#6ee7b7" }}>
                        Exotics: ₹{Number(d.exotics || 0).toLocaleString("en-IN")}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: "#fde047" }}>
                        Fruits & Staples: ₹{Number(d.fruits || 0).toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      width: { xs: 10, sm: 14, md: 18 },
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "4px 4px 0 0",
                      overflow: "hidden",
                      transition: "all 0.15s ease",
                      transform: isHovered ? "scaleY(1.04)" : "scaleY(1)",
                      transformOrigin: "bottom",
                      outline: d.is_selected ? "2px solid #0c6b27" : "none",
                      outlineOffset: "1px",
                      boxShadow: d.is_selected ? "0 0 6px rgba(12, 107, 39, 0.35)" : "none",
                    }}
                  >
                    {/* Exotics (Cyan/Mint) */}
                    {exoticHeight > 0 && (
                      <Box
                        sx={{
                          height: exoticHeight,
                          bgcolor: "#34d399",
                          width: "100%",
                        }}
                      />
                    )}

                    {/* Vegetables (Deep Emerald Green) */}
                    {vegHeight > 0 && (
                      <Box
                        sx={{
                          height: vegHeight,
                          bgcolor: "#059669",
                          width: "100%",
                        }}
                      />
                    )}

                    {/* Fruits & Staples (Warm Amber/Gold) */}
                    {fruitHeight > 0 && (
                      <Box
                        sx={{
                          height: fruitHeight,
                          bgcolor: "#fbbf24",
                          width: "100%",
                        }}
                      />
                    )}

                    {/* Flat base dot when month has 0 orders */}
                    {vegHeight === 0 && exoticHeight === 0 && fruitHeight === 0 && (
                      <Box
                        sx={{
                          height: 3,
                          bgcolor: d.is_selected ? "#0c6b27" : "#e2e8f0",
                          borderRadius: "2px",
                          width: "100%",
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>

                {/* Month Label below bar */}
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: -24,
                    fontSize: { xs: "9.5px", sm: "11px" },
                    fontWeight: (d.is_peak || d.is_selected) ? 800 : 500,
                    color: d.is_selected ? "#0c6b27" : (d.is_peak ? "#059669" : "#64748b"),
                    bgcolor: d.is_selected ? "#dcfce7" : "transparent",
                    px: d.is_selected ? 0.6 : 0,
                    borderRadius: "4px",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {d.month}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
