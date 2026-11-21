import { Box, Typography, Button, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";

export default function CustomerHeader({
  searchTerm = "",
  onSearchChange = () => {},
  onExport = () => {},
  exporting = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2,
        mb: 3,
      }}
    >
      {/* Title & Subtitle */}
      <Box>
        <Typography
          sx={{
            fontSize: { xs: "22px", md: "24px" },
            fontWeight: 700,
            color: "#1b1b1e",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
          }}
        >
          Customer Management
        </Typography>
        <Typography
          sx={{
            fontSize: "13.5px",
            color: "#64748b",
            fontWeight: 500,
            mt: 0.5,
          }}
        >
          Manage customer accounts and user information.
        </Typography>
      </Box>

      {/* Search Bar & Export CTA */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: { xs: "100%", md: "auto" },
        }}
      >
        <TextField
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users by name, email, or mobile..."
          sx={{
            width: { xs: "100%", sm: 340, md: 380 },
            "& .MuiOutlinedInput-root": {
              height: 40,
              borderRadius: "8px",
              bgcolor: "#ffffff",
              fontSize: "13.5px",
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#0c6b27" },
              "&.Mui-focused fieldset": { borderColor: "#0c6b27" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange("")} sx={{ p: 0.5 }}>
                  <CloseIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Button
          variant="outlined"
          onClick={onExport}
          disabled={exporting}
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{
            height: 40,
            px: 2.2,
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            bgcolor: "#ffffff",
            color: "#334155",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            "&:hover": {
              borderColor: "#cbd5e1",
              bgcolor: "#f8fafc",
            },
          }}
        >
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </Box>
    </Box>
  );
}
