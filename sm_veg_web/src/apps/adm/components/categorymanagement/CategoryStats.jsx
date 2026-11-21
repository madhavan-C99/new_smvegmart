import { Box, Typography } from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";

export default function CategoryStats({
  totalCategories,
  activeCount,
  inactiveCount,
  publishedPercent,
  totalSkus,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: "16px",
        mb: "24px",
      }}
    >
      {/* Card 1: Total Categories */}
      <Box
        sx={{
          p: "20px",
          bgcolor: "#FFFFFF",
          border: "1px solid #eae7eb",
          borderRadius: "12px",
          boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#545f73", letterSpacing: "0.33px", textTransform: "uppercase" }}>
            TOTAL CATEGORIES
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#0c6b27",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#1b1b1e" }}>
            {totalCategories}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              px: "10px",
              py: "3px",
              borderRadius: "9999px",
              bgcolor: "#ecfdf5",
              border: "1px solid rgba(167,243,208,0.6)",
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#059669" }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>
              Store Live
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card 2: Active Categories */}
      <Box
        sx={{
          p: "20px",
          bgcolor: "#FFFFFF",
          border: "1px solid #eae7eb",
          borderRadius: "12px",
          boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#545f73", letterSpacing: "0.33px", textTransform: "uppercase" }}>
            ACTIVE CATEGORIES
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#0c6b27",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#1b1b1e" }}>
            {activeCount}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              px: "10px",
              py: "3px",
              borderRadius: "9999px",
              bgcolor: "#ecfdf5",
              border: "1px solid rgba(167,243,208,0.6)",
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#059669" }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>
              {publishedPercent}% Published
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card 3: Inactive Categories */}
      <Box
        sx={{
          p: "20px",
          bgcolor: "#FFFFFF",
          border: "1px solid #eae7eb",
          borderRadius: "12px",
          boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#545f73", letterSpacing: "0.33px", textTransform: "uppercase" }}>
            INACTIVE CATEGORIES
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#1b1b1e" }}>
            {inactiveCount}
          </Typography>
          <Box
            sx={{
              px: "10px",
              py: "3px",
              borderRadius: "9999px",
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
            }}
          >
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
              Draft / Seasonal
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card 4: Total Product */}
      <Box
        sx={{
          p: "20px",
          bgcolor: "#FFFFFF",
          border: "1px solid #eae7eb",
          borderRadius: "12px",
          boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#545f73", letterSpacing: "0.33px", textTransform: "uppercase" }}>
            TOTAL PRODUCT
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#0c6b27",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LocalMallOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#1b1b1e" }}>
            {totalSkus}
          </Typography>
          <Box
            sx={{
              px: "10px",
              py: "3px",
              borderRadius: "9999px",
              bgcolor: "#ecfdf5",
              border: "1px solid rgba(167,243,208,0.6)",
            }}
          >
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>
              Active Catalog
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
