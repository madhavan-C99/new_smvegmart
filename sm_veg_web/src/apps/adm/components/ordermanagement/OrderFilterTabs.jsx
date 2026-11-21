import { Box, ButtonBase, Typography } from "@mui/material";

const ORDER_TABS = [
  { id: "all", label: "All Orders" },
  { id: "new_order", label: "New Orders" },
  { id: "confirmed", label: "Confirmed & Packing" },
  { id: "ready_for_dispatch", label: "Ready for Dispatch" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function OrderFilterTabs({ activeTab = "all", onTabChange, tabCounts = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        overflowX: "auto",
        pb: 0.5,
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#e2e8f0", borderRadius: 2 },
      }}
    >
      {ORDER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = tabCounts[tab.id] !== undefined ? tabCounts[tab.id] : 0;

        return (
          <ButtonBase
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              px: "12px",
              py: "6px",
              borderRadius: "8px",
              bgcolor: isActive ? "#0c6b27" : "#f4f4f0",
              color: isActive ? "#ffffff" : "#40493e",
              boxShadow: isActive ? "0px 1px 1px rgba(0,0,0,0.05)" : "none",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: isActive ? "#0a5920" : "#ecece8",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "14px",
                fontWeight: isActive ? 700 : 600,
                lineHeight: "20px",
              }}
            >
              {tab.label}
            </Typography>

            {/* Active tab count has RED background (#dc2626); inactive tab has neutral gray (#e8e5e9) */}
            <Box
              sx={{
                px: "7px",
                py: "1px",
                borderRadius: "9999px",
                bgcolor: isActive ? "#dc2626" : "#e8e5e9",
                color: isActive ? "#ffffff" : "#545f73",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: "16px",
                transition: "all 0.15s ease",
              }}
            >
              {Number(count).toLocaleString()}
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
