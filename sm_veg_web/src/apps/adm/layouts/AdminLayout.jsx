import { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AdmNavbar from "./AdmNavbar";
import { OrderNotificationProvider } from "../context/OrderNotificationContext";
import { CommonPopupProvider } from "../context/CommonPopupContext";
import { ReminderProvider } from "../context/ReminderContext";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  return (
    <CommonPopupProvider>
      <OrderNotificationProvider>
        <ReminderProvider>
          <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", bgcolor: "#FBFBFB" }}>
            {/* Left Sidebar (Permanent on Desktop/Laptop, Drawer on Tablet) */}
            <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerClose} />

            {/* Main Content Area */}
            <Box
              sx={{
                flex: 1,
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                minWidth: 0,
              }}
            >
              {/* Top Navbar */}
              <AdmNavbar onMenuToggle={handleDrawerToggle} />

              {/* Page Content from Active Route */}
              <Box sx={{ flex: 1, pb: 6, minWidth: 0 }}>
                <Outlet />
              </Box>
            </Box>
          </Box>
        </ReminderProvider>
      </OrderNotificationProvider>
    </CommonPopupProvider>
  );
}
