import { useMemo } from "react";
import { Box, Typography, TextField, MenuItem, Button } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function ProductFilter({
  categories = [],
  subcategories = [],
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  onResetFilters,
}) {
  // Only show subcategories that belong to the currently selected category
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") {
      return subcategories;
    }
    const matchedCategory = categories.find(
      (c) =>
        String(c.name).toLowerCase() === String(selectedCategory).toLowerCase() ||
        String(c.id) === String(selectedCategory)
    );
    const catId = matchedCategory ? matchedCategory.id : null;
    const catName = matchedCategory ? matchedCategory.name : selectedCategory;

    return subcategories.filter((s) => {
      const matchName =
        s.category_name &&
        String(s.category_name).toLowerCase() === String(catName).toLowerCase();
      const matchId =
        catId !== null &&
        (String(s.category_id) === String(catId) || String(s.category) === String(catId));
      return matchName || matchId;
    });
  }, [subcategories, selectedCategory, categories]);
  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #eae7eb",
        borderRadius: "12px",
        p: "16px",
        mb: "16px",
        boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr auto" },
          gap: { xs: "12px", sm: "16px" },
          alignItems: "flex-end",
        }}
      >
        {/* Categories Dropdown */}
        <Box>
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.33px",
              textTransform: "uppercase",
              mb: "4px",
              lineHeight: "14px",
            }}
          >
            Categories
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#f6f2f7",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1b1b1e",
                height: "36px",
                "& fieldset": { border: "none" },
              },
            }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id || c.name} value={c.name} sx={{ fontSize: "14px" }}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Sub Categories Dropdown */}
        <Box>
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#545f73",
              letterSpacing: "0.33px",
              textTransform: "uppercase",
              mb: "4px",
              lineHeight: "14px",
            }}
          >
            Sub Categories
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedSubcategory}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#f6f2f7",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1b1b1e",
                height: "36px",
                "& fieldset": { border: "none" },
              },
            }}
          >
            <MenuItem value="All">All Subcategories</MenuItem>
            {filteredSubcategories.map((s) => (
              <MenuItem key={s.id || s.name} value={s.name} sx={{ fontSize: "14px" }}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Reset Filters Button */}
        <Button
          onClick={onResetFilters}
          startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
          sx={{
            height: "36px",
            bgcolor: "#f0edf1",
            color: "#1b1b1e",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "none",
            px: "12px",
            "&:hover": { bgcolor: "#e5e2e6" },
          }}
        >
          Reset Filters
        </Button>
      </Box>
    </Box>
  );
}
