import { Box, Typography, Chip } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BoltIcon from "@mui/icons-material/Bolt";

export default function MetricKpiGrid({ metrics = {} }) {
  const {
    total_products = 0,
    products_delta = "+0",
    products_delta_label = "added this month",
    total_revenue = 0,
    revenue_delta = "0.0%",
    comparison_label = "vs. previous period",
    total_orders = 0,
    orders_delta = "0.0%",
    new_orders = 0,
  } = metrics;

  const formattedRevenue =
    typeof total_revenue === "number"
      ? `₹${total_revenue.toLocaleString("en-IN")}`
      : String(total_revenue);

  const formattedProducts =
    typeof total_products === "number"
      ? total_products.toLocaleString("en-IN")
      : String(total_products);

  const formattedOrders =
    typeof total_orders === "number"
      ? total_orders.toLocaleString("en-IN")
      : String(total_orders);

  const cards = [
    {
      id: "products",
      label: "TOTAL PRODUCTS",
      value: formattedProducts,
      accentColor: "#10b981",
      iconBg: "#ecfdf5",
      iconBorder: "#d1fae5",
      iconColor: "#059669",
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />,
      footer: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 13, color: "#059669" }} />
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
              {products_delta}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "11px", color: "#64748b" }}>
            {products_delta_label}
          </Typography>
        </Box>
      ),
    },
    {
      id: "revenue",
      label: "TOTAL REVENUE",
      value: formattedRevenue,
      accentColor: "#3b82f6",
      iconBg: "#eff6ff",
      iconBorder: "#dbeafe",
      iconColor: "#2563eb",
      icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} />,
      footer: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 13, color: "#059669" }} />
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
              {revenue_delta}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "11px", color: "#64748b" }}>
            {comparison_label}
          </Typography>
        </Box>
      ),
    },
    {
      id: "orders",
      label: "TOTAL ORDERS",
      value: formattedOrders,
      accentColor: "#059669",
      iconBg: "#ecfdf5",
      iconBorder: "#d1fae5",
      iconColor: "#059669",
      icon: <ShoppingCartOutlinedIcon sx={{ fontSize: 20 }} />,
      footer: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 13, color: "#059669" }} />
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#059669" }}>
              {orders_delta}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "11px", color: "#64748b" }}>
            fulfilled rate
          </Typography>
        </Box>
      ),
    },
    {
      id: "new_orders",
      label: "NEW ORDERS",
      value: String(new_orders),
      badge: "Active",
      accentColor: "#f59e0b",
      iconBg: "#fffbeb",
      iconBorder: "#fef3c7",
      iconColor: "#d97706",
      icon: <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />,
      footer: (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4,
              bgcolor: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "4px",
              px: 1,
              py: 0.3,
            }}
          >
            <BoltIcon sx={{ fontSize: 12, color: "#dc2626" }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>
              Instant
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "11px", color: "#64748b" }}>
            dispatch needed
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          lg: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 3,
      }}
    >
      {cards.map((card) => (
        <Box
          key={card.id}
          sx={{
            bgcolor: "#ffffff",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            borderRadius: "12px",
            p: 2,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        >
          {/* Top Colored Accent Line */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              bgcolor: card.accentColor,
            }}
          />

          {/* Top Row: Label, Value & Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mt: 0.5,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.55px",
                  mb: 0.5,
                }}
              >
                {card.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.6px",
                    lineHeight: "32px",
                  }}
                >
                  {card.value}
                </Typography>
                {card.badge && (
                  <Chip
                    label={card.badge}
                    size="small"
                    sx={{
                      bgcolor: "#fffbeb",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      fontWeight: 700,
                      fontSize: "10.5px",
                      height: 20,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Icon Bubble */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                bgcolor: card.iconBg,
                border: `1px solid ${card.iconBorder}`,
                color: card.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Box>
          </Box>

          {/* Bottom Row Separator & Subtext */}
          <Box
            sx={{
              borderTop: "1px solid #f1f5f9",
              pt: 1.5,
            }}
          >
            {card.footer}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
