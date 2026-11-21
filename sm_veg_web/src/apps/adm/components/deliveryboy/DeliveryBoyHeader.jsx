import { Box, Typography, Button, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CloseIcon from "@mui/icons-material/Close";

export default function DeliveryBoyHeader({
  searchTerm = "",
  onSearchChange = () => {},
  onAddClick = () => {},
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
          Delivery Boy Management
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

      {/* Search Input & Add Delivery Boy CTA matching Figma */}
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
            width: { xs: "100%", sm: 320, md: 360 },
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
          variant="contained"
          onClick={onAddClick}
          startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 19 }} />}
          sx={{
            height: 40,
            px: 2.5,
            borderRadius: "8px",
            bgcolor: "#0c6b27",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "13.5px",
            textTransform: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 2px rgba(12, 107, 39, 0.2)",
            "&:hover": {
              bgcolor: "#09531e",
              boxShadow: "0 2px 4px rgba(12, 107, 39, 0.3)",
            },
          }}
        >
          Add Delivery Boy
        </Button>
      </Box>
    </Box>
  );
}
