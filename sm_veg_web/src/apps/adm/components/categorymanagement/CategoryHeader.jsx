import { Box, Typography, TextField, Button, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

export default function CategoryHeader({ searchTerm, onSearchChange, onAddClick }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        pb: "20px",
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1b1b1e",
            letterSpacing: "-0.6px",
            lineHeight: "32px",
          }}
        >
          Category Management
        </Typography>
        <Typography sx={{ fontSize: "14px", color: "#545f73", lineHeight: "20px", mt: "4px" }}>
          Organize and control fresh produce categories, thumbnail visuals, priority order, and storefront visibility.
        </Typography>
      </Box>

      {/* Search & Add Category Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "12px", sm: "16px", md: "20px" },
          flexWrap: "wrap",
          width: { xs: "100%", md: "auto" },
        }}
      >
        <TextField
          size="small"
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ pl: 0.5 }}>
                <SearchIcon sx={{ color: "#707a6d", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 240, md: 280 },
            flexGrow: { xs: 1, sm: 0 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              fontSize: "13px",
              color: "#1b1b1e",
              height: "38px",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
              "& fieldset": { borderColor: "#94a3b8" },
              "&:hover fieldset": { borderColor: "#64748b" },
              "& input::placeholder": { color: "#707a6d", opacity: 1 },
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={onAddClick}
          sx={{
            bgcolor: "#0c6b27",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "14px",
            px: "20px",
            py: "9px",
            borderRadius: "12px",
            boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
            lineHeight: "20px",
            flexShrink: 0,
            "&:hover": { bgcolor: "#0a5620" },
          }}
        >
          Add Category
        </Button>
      </Box>
    </Box>
  );
}
