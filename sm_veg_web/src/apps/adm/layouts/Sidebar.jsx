import { Box, Typography, ListItemButton, ListItemIcon, ListItemText, Drawer, IconButton } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TwoWheelerOutlinedIcon from "@mui/icons-material/TwoWheelerOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import CloseIcon from "@mui/icons-material/Close";

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes("subcategories")) return "subcategories";
    if (path.includes("categories")) return "categories";
    if (path.includes("products")) return "products";
    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("delivery-boys")) return "delivery_boys";
    if (path.includes("customers") || path.includes("users")) return "customers";
    if (path.includes("orders")) return "orders";
    if (path.includes("delivery")) return "delivery";
    return "categories";
  };

  const activePage = getActivePage();
  const isUserActive = ["customers", "delivery_boys"].includes(activePage);
  const isMasterActive = ["categories", "subcategories", "products"].includes(activePage);

  const sidebarContent = (
    <Box
      sx={{
        width: { xs: 255, lg: 240, xl: 255 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fbfbf9",
        overflow: "hidden",
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #e7e5e0",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            bgcolor: "#0c6b27",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "18px",
            letterSpacing: "0.9px",
            boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
            flexShrink: 0,
          }}
        >
          SM
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "16px",
              color: "#1b1b1e",
              lineHeight: "20px",
            }}
          >
            SM VegMart
          </Typography>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#0c6b27",
              fontWeight: 600,
              lineHeight: "16px",
            }}
          >
            Admin Console
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ display: { xs: "inline-flex", lg: "none" }, color: "#64748b" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Navigation Links - Compact Stacking */}
      <Box
        sx={{
          p: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {/* Dashboard */}
        <ListItemButton
          onClick={() => handleNav("/admin/dashboard")}
          sx={{
            borderRadius: "8px",
            height: 40,
            minHeight: 40,
            px: "14px",
            py: 0,
            flexGrow: 0,
            bgcolor: activePage === "dashboard" ? "#ecfdf5" : "transparent",
            border: activePage === "dashboard" ? "1px solid #a7f3d0" : "1px solid transparent",
            "&:hover": { bgcolor: activePage === "dashboard" ? "#ecfdf5" : "#f1f5f9" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: activePage === "dashboard" ? "#0c6b27" : "#545f73" }}>
            <GridViewOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: activePage === "dashboard" ? 700 : 500,
              color: activePage === "dashboard" ? "#0c6b27" : "#545f73",
              lineHeight: "20px",
            }}
          />
        </ListItemButton>

        {/* User Management Accordion / Tree (Matching Figma) */}
        <Box sx={{ position: "relative", flexGrow: 0 }}>
          <ListItemButton
            onClick={() => handleNav("/admin/users")}
            sx={{
              borderRadius: "8px",
              height: 40,
              minHeight: 40,
              px: "14px",
              py: 0,
              bgcolor: isUserActive ? "#ecfdf5" : "transparent",
              border: isUserActive ? "1px solid #a7f3d0" : "1px solid transparent",
              "&:hover": { bgcolor: isUserActive ? "#ecfdf5" : "#f1f5f9" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: isUserActive ? "#0c6b27" : "#545f73" }}>
              <PeopleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="User Management"
              primaryTypographyProps={{
                fontSize: "14px",
                fontWeight: isUserActive ? 700 : 500,
                color: isUserActive ? "#0c6b27" : "#545f73",
                lineHeight: "20px",
              }}
            />
          </ListItemButton>

          {/* Submenu Tree with vertical connector directly through dots (collapses when on another page) */}
          {isUserActive && (
            <Box
              sx={{
                position: "relative",
                pt: "6px",
                pb: "6px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Vertical green line connecting from button bottom to last dot */}
              <Box
                sx={{
                  position: "absolute",
                  left: "23px",
                  top: 0,
                  bottom: "16px",
                  width: "1.5px",
                  bgcolor: "#86efac",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              />

              {[
                { id: "customers", label: "Customer Management", path: "/admin/users" },
                { id: "delivery_boys", label: "Delivery Boy Management", path: "/admin/delivery-boys" },
              ].map((subItem) => {
                const isActive = activePage === subItem.id;
                return (
                  <Box
                    key={subItem.id}
                    onClick={() => handleNav(subItem.path)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      height: 32,
                      position: "relative",
                      zIndex: 1,
                      "&:hover .subitem-text": {
                        color: "#0c6b27",
                      },
                      "&:hover .subitem-dot": {
                        bgcolor: isActive ? "#0c6b27" : "#9ca3af",
                      },
                    }}
                  >
                    {/* Dot container centered on the 23px line */}
                    <Box
                      sx={{
                        width: 46, // 23px * 2, so center is exactly at 23px
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        className="subitem-dot"
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: isActive ? "#0c6b27" : "#cbd5e1",
                          transition: "all 0.2s ease",
                        }}
                      />
                    </Box>

                    {/* Submenu Label */}
                    <Typography
                      className="subitem-text"
                      sx={{
                        fontSize: "13.5px",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#0c6b27" : "#545f73",
                        lineHeight: "20px",
                        transition: "color 0.2s ease",
                        userSelect: "none",
                      }}
                    >
                      {subItem.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Master Management */}
        <Box sx={{ position: "relative", flexGrow: 0 }}>
          <ListItemButton
            onClick={() => handleNav("/admin/categories")}
            sx={{
              borderRadius: "8px",
              height: 40,
              minHeight: 40,
              px: "14px",
              py: 0,
              bgcolor: isMasterActive ? "#ecfdf5" : "transparent",
              border: isMasterActive ? "1px solid #a7f3d0" : "1px solid transparent",
              "&:hover": { bgcolor: isMasterActive ? "#ecfdf5" : "#f1f5f9" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: isMasterActive ? "#0c6b27" : "#545f73" }}>
              <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Master Management"
              primaryTypographyProps={{
                fontSize: "14px",
                fontWeight: isMasterActive ? 700 : 500,
                color: isMasterActive ? "#0c6b27" : "#545f73",
                lineHeight: "20px",
              }}
            />
          </ListItemButton>

          {/* Submenu Tree for Master Management (when active) */}
          {isMasterActive && (
            <Box
              sx={{
                position: "relative",
                pt: "6px",
                pb: "6px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: "23px",
                  top: 0,
                  bottom: "22px",
                  width: "1.5px",
                  bgcolor: "#86efac",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              />

              {[
                { id: "categories", label: "Category Management", path: "/admin/categories" },
                { id: "subcategories", label: "Subcategory Management", path: "/admin/subcategories" },
                { id: "products", label: "All Products", path: "/admin/products" },
              ].map((subItem) => {
                const isActive = activePage === subItem.id;
                return (
                  <Box
                    key={subItem.id}
                    onClick={() => handleNav(subItem.path)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      height: 32,
                      position: "relative",
                      zIndex: 1,
                      "&:hover .subitem-text": {
                        color: "#0c6b27",
                      },
                      "&:hover .subitem-dot": {
                        bgcolor: isActive ? "#0c6b27" : "#9ca3af",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        className="subitem-dot"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: isActive ? "#0c6b27" : "#d1d5db",
                          transition: "all 0.2s ease",
                        }}
                      />
                    </Box>

                    <Typography
                      className="subitem-text"
                      sx={{
                        fontSize: "13.5px",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#0c6b27" : "#545f73",
                        lineHeight: "20px",
                        transition: "color 0.2s ease",
                        userSelect: "none",
                      }}
                    >
                      {subItem.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Order Management */}
        <ListItemButton
          onClick={() => handleNav("/admin/orders")}
          sx={{
            borderRadius: "8px",
            height: 40,
            minHeight: 40,
            px: "14px",
            py: 0,
            flexGrow: 0,
            bgcolor: activePage === "orders" ? "#ecfdf5" : "transparent",
            border: activePage === "orders" ? "1px solid #a7f3d0" : "1px solid transparent",
            "&:hover": { bgcolor: activePage === "orders" ? "#ecfdf5" : "#f1f5f9" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: activePage === "orders" ? "#0c6b27" : "#545f73" }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Order Management"
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: activePage === "orders" ? 700 : 500,
              color: activePage === "orders" ? "#0c6b27" : "#545f73",
              lineHeight: "20px",
            }}
          />
        </ListItemButton>

        {/* Delivery Options */}
        <ListItemButton
          onClick={() => handleNav("/admin/delivery")}
          sx={{
            borderRadius: "8px",
            height: 40,
            minHeight: 40,
            px: "14px",
            py: 0,
            flexGrow: 0,
            bgcolor: activePage === "delivery" ? "#ecfdf5" : "transparent",
            border: activePage === "delivery" ? "1px solid #a7f3d0" : "1px solid transparent",
            "&:hover": { bgcolor: activePage === "delivery" ? "#ecfdf5" : "#f1f5f9" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: activePage === "delivery" ? "#0c6b27" : "#545f73" }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Delivery Options"
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: activePage === "delivery" ? 700 : 500,
              color: activePage === "delivery" ? "#0c6b27" : "#545f73",
              lineHeight: "20px",
            }}
          />
        </ListItemButton>

        {/* Spacer that pushes Logout to the bottom while keeping menu items compact */}
        <Box sx={{ flex: 1 }} />
      </Box>

      {/* Sidebar Bottom Action: Logout (Docked at the bottom) */}
      <Box
        sx={{
          p: "14px 16px",
          borderTop: "1px solid #e7e5e0",
          flexShrink: 0,
        }}
      >
        <ListItemButton
          sx={{
            borderRadius: "8px",
            height: 40,
            minHeight: 40,
            px: "12px",
            py: 0,
            "&:hover": { bgcolor: "#FEF2F2" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 30, color: "#ba1a1a" }}>
            <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#ba1a1a",
              lineHeight: "20px",
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* 1. Mobile & Tablet Slide Drawer (< 1024px) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: 255,
            boxSizing: "border-box",
            bgcolor: "#fbfbf9",
            borderRight: "1px solid #e7e5e0",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* 2. Desktop & Laptop Fixed Sidebar (>= 1024px) */}
      <Box
        component="nav"
        sx={{
          display: { xs: "none", lg: "flex" },
          width: { lg: 240, xl: 255 },
          height: "100vh",
          bgcolor: "#fbfbf9",
          borderRight: "1px solid #e7e5e0",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </Box>
    </>
  );
}
