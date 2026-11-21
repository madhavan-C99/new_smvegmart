import { Box, Typography, Button } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

export default function OrderHeader({ onExportCSV }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        mb: 2,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: "24px",
            color: "#1b1b1e",
            letterSpacing: "-0.6px",
            lineHeight: "32px",
          }}
        >
          Order Management
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "14px",
            color: "#545f73",
            mt: 0.5,
            lineHeight: "20px",
          }}
        >
          Sequential lifecycle fulfillment: Review, verify payments, triage pod packing, and assign riders.
        </Typography>
      </Box>

      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
        onClick={onExportCSV}
        sx={{
          textTransform: "none",
          color: "#0f172a",
          borderColor: "#e2e8f0",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          px: 2,
          py: "7px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow: "0px 1px 2px rgba(0,0,0,0.02)",
          "&:hover": {
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
          },
        }}
      >
        Export CSV
      </Button>
    </Box>
  );
}
