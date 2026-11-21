import { Box, TextField, Select, MenuItem, InputAdornment, FormControl, InputLabel, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function DeliveryBoyFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  orderBy,
  onOrderChange,
}) {
  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        borderRadius: "12px",
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        border: "1px solid #eae7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Sort By Dropdown */}
      <Box sx={{ minWidth: 140, flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 140px" } }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.5px",
            mb: 0.5,
          }}
        >
          Sort By
        </Typography>
        <Select
          size="small"
          fullWidth
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          sx={{
            borderRadius: "9px",
            fontSize: "13.5px",
            height: 38,
            bgcolor: "#fbfbf9",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
          }}
        >
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="status">Status</MenuItem>
        </Select>
      </Box>

      {/* Order By Dropdown */}
      <Box sx={{ minWidth: 140, flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 140px" } }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.5px",
            mb: 0.5,
          }}
        >
          Order By
        </Typography>
        <Select
          size="small"
          fullWidth
          value={orderBy}
          onChange={(e) => onOrderChange(e.target.value)}
          sx={{
            borderRadius: "9px",
            fontSize: "13.5px",
            height: 38,
            bgcolor: "#fbfbf9",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0c6b27" },
          }}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </Box>

      {/* Search Bar */}
      <Box sx={{ flex: "1 1 280px" }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.5px",
            mb: 0.5,
          }}
        >
          Search
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by name, mobile or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#94a3b8", fontSize: 19 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "9px",
              fontSize: "13.5px",
              height: 38,
              bgcolor: "#fbfbf9",
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#0c6b27" },
              "&.Mui-focused fieldset": { borderColor: "#0c6b27" },
            },
          }}
        />
      </Box>
    </Box>
  );
}
