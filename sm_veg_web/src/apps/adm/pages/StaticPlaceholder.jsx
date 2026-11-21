import { Box, Typography } from "@mui/material";

export default function StaticPlaceholder({ title, description }) {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 800,
          color: "#111827",
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: 0.5 }}>
        {description}
      </Typography>

      <Box
        sx={{
          mt: 4,
          p: 6,
          bgcolor: "#FFFFFF",
          border: "1.5px dashed #E5E7EB",
          borderRadius: "14px",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}>
          {title} Module (Static View)
        </Typography>
        <Typography sx={{ fontSize: "13px", color: "#9CA3AF", mt: 1, maxWidth: 500, mx: "auto" }}>
          This page is currently set to static as per project specifications while Master Management is fully active and functional.
        </Typography>
      </Box>
    </Box>
  );
}
