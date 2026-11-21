import { Box, Typography, Avatar, Link } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { useNavigate } from "react-router-dom";

export default function TopSellingProductsCard({ products = [] }) {
  const navigate = useNavigate();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        p: { xs: 2.5, md: 3 },
        border: "1px solid #eef0f2",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#1b1b1e",
              letterSpacing: "-0.3px",
            }}
          >
            Top-Selling Products
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              backgroundColor: "#ecfdf5",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              borderRadius: "20px",
              px: 1.25,
              py: 0.35,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 14, color: "#16a34a" }} />
            This Month
          </Box>
        </Box>

        {/* Product Items List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {products.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography sx={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
                No product sales recorded yet.
              </Typography>
            </Box>
          ) : (
            products.map((item, index) => {
              const displayImg = item.image;
              return (
                <Box
                  key={item.id || index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 0.75,
                    transition: "background-color 0.2s ease",
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                  }}
                >
                  {/* Left: Thumbnail & Name Details */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: 0 }}>
                    <Avatar
                      src={displayImg}
                      variant="rounded"
                      alt={item.name}
                      sx={{
                        width: 44,
                      height: 44,
                      borderRadius: "10px",
                      border: "1px solid #f1f5f9",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <Inventory2OutlinedIcon sx={{ color: "#94a3b8", fontSize: 22 }} />
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: { xs: 150, sm: 220, md: 240 },
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: 500,
                        mt: 0.3,
                      }}
                    >
                      {item.subtitle || "Produce • In Stock"}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Revenue Amount */}
                <Typography
                  sx={{
                    fontSize: "14.5px",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.3px",
                    pl: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(item.revenue)}
                </Typography>
              </Box>
            );
          }))}
        </Box>
      </Box>

      {/* Footer link to Products */}
      <Box
        sx={{
          pt: 2.5,
          mt: 2,
          borderTop: "1px solid #f1f5f9",
          textAlign: "right",
        }}
      >
        <Link
          component="button"
          onClick={() => navigate("/admin/products")}
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#16a34a",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#15803d",
              textDecoration: "underline",
            },
          }}
        >
          View All Products Report
          <ArrowForwardIcon sx={{ fontSize: 15 }} />
        </Link>
      </Box>
    </Box>
  );
}
