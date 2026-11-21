import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useNavigate } from "react-router-dom";

export default function ActiveDispatchQueueTable({
  orders = [],
  totalActiveCount = 0,
  onOrderClick,
}) {
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Keep page index safe if orders list changes
  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= orders.length) {
      setPage(0);
    }
  }, [orders.length, page, rowsPerPage]);

  const paginatedOrders = useMemo(() => {
    return orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [orders, page, rowsPerPage]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Helper to render delivery mode badge without text wrapping
  const renderDeliveryMode = (modeStr) => {
    const raw = String(modeStr || "").toLowerCase();
    if (raw.includes("express") || raw.includes("instant") || raw.includes("25")) {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "20px",
            px: 1.3,
            py: 0.4,
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <BoltIcon sx={{ fontSize: 13, color: "#ef4444" }} />
          Express 25-Min
        </Box>
      );
    }

    const cleanLabel = modeStr.replace(/^Slot:\s*/i, "").replace(/[⚡🕒]/g, "").trim();

    if (raw.includes("today")) {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            color: "#0284c7",
            borderRadius: "20px",
            px: 1.3,
            py: 0.4,
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 13, color: "#0284c7" }} />
          {cleanLabel || "Today Slot"}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          backgroundColor: "#f5f3ff",
          border: "1px solid #ddd6fe",
          color: "#7c3aed",
          borderRadius: "20px",
          px: 1.3,
          py: 0.4,
          fontSize: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <AccessTimeIcon sx={{ fontSize: 13, color: "#7c3aed" }} />
        {cleanLabel || "Scheduled Delivery"}
      </Box>
    );
  };

  // Helper to render fulfillment status badge
  const renderStatus = (statusStr) => {
    const st = String(statusStr || "").toLowerCase();
    if (st.includes("out for delivery") || st.includes("ofd")) {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.6,
            backgroundColor: "#ecfdf5",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            borderRadius: "20px",
            px: 1.3,
            py: 0.4,
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <FiberManualRecordIcon sx={{ fontSize: 8, color: "#16a34a" }} />
          Out for Delivery
        </Box>
      );
    }
    if (st.includes("dispatch")) {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#b45309",
            borderRadius: "20px",
            px: 1.3,
            py: 0.4,
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Dispatch
        </Box>
      );
    }
    if (st.includes("packing")) {
      return (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#c2410c",
            borderRadius: "20px",
            px: 1.3,
            py: 0.4,
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Packing
        </Box>
      );
    }
    // New Order / Default
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          backgroundColor: "#eef2ff",
          border: "1px solid #c7d2fe",
          color: "#4338ca",
          borderRadius: "20px",
          px: 1.3,
          py: 0.4,
          fontSize: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        New Order
      </Box>
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        p: { xs: 2, sm: 2.5, md: 3 },
        border: "1px solid #eef0f2",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Top Header Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
            }}
          >
            <ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#1b1b1e",
              letterSpacing: "-0.4px",
            }}
          >
            Active Dispatch Queue
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            sx={{
              fontSize: "12.5px",
              color: "#9ca3af",
              fontWeight: 500,
              display: { xs: "none", md: "block" },
            }}
          >
            Auto-refresh: 15s
          </Typography>

          <Button
            variant="outlined"
            onClick={() => navigate("/admin/orders")}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e293b",
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              px: 1.75,
              py: 0.6,
              backgroundColor: "#ffffff",
              "&:hover": {
                borderColor: "#cbd5e1",
                backgroundColor: "#f8fafc",
              },
            }}
          >
            View All {totalActiveCount || orders.length} Orders
          </Button>
        </Box>
      </Box>

      {/* Table Container */}
      <TableContainer
        sx={{
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#e2e8f0",
            borderRadius: 3,
          },
        }}
      >
        <Table sx={{ minWidth: 920 }}>
          <TableHead>
            <TableRow sx={{ borderBottom: "1px solid #f1f5f9" }}>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                ORDER ID
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                CUSTOMER NAME
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                CUSTOMER HUB ZONE
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                PHONE NUMBER
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                DELIVERY MODE
              </TableCell>
              <TableCell
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                ORDER VALUE
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  py: 1.25,
                  px: 2,
                  whiteSpace: "nowrap",
                }}
              >
                FULFILLMENT STATUS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 6, color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}
                >
                  No active dispatch orders at this moment.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((row) => (
                <TableRow
                  key={row.id || row.order_id}
                  onClick={() => onOrderClick && onOrderClick(row)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    borderBottom: "1px solid #f8fafc",
                    "&:hover": {
                      backgroundColor: "#f8fafc",
                    },
                  }}
                >
                  {/* Order ID without wrapping */}
                  <TableCell
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#0f172a",
                      py: 1.75,
                      px: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.order_id}
                  </TableCell>

                  {/* Customer Name */}
                  <TableCell
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                      py: 1.75,
                      px: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.customer_name}
                  </TableCell>

                  {/* Customer Hub Zone with Tooltip & Ellipsis */}
                  <TableCell sx={{ py: 1.75, px: 2, maxWidth: { xs: 180, sm: 220, md: 260 } }}>
                    <Tooltip title={row.full_address || row.customer_hub_zone} arrow>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
                        <PlaceOutlinedIcon
                          sx={{ fontSize: 16, color: "#10b981", flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#64748b",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.customer_hub_zone}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Phone Number */}
                  <TableCell sx={{ py: 1.75, px: 2, whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <PhoneOutlinedIcon
                        sx={{ fontSize: 15, color: "#94a3b8", flexShrink: 0 }}
                      />
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#64748b",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.phone}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Delivery Mode */}
                  <TableCell sx={{ py: 1.75, px: 2, whiteSpace: "nowrap" }}>
                    {renderDeliveryMode(row.delivery_mode)}
                  </TableCell>

                  {/* Order Value */}
                  <TableCell
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#0f172a",
                      py: 1.75,
                      px: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(row.amount)}
                  </TableCell>

                  {/* Fulfillment Status */}
                  <TableCell align="right" sx={{ py: 1.75, px: 2, whiteSpace: "nowrap" }}>
                    {renderStatus(row.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table Pagination Bar matching Screenshot */}
      <TablePagination
        component="div"
        count={orders.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Items per page"
        rowsPerPageOptions={[5, 10, 25, 50]}
        showFirstButton
        showLastButton
        sx={{
          borderTop: "1px solid #f1f5f9",
          mt: 0.5,
          "& .MuiTablePagination-toolbar": { minHeight: "52px", px: { xs: 1, sm: 2 } },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "13px",
            color: "#64748b",
            fontWeight: 500,
          },
          "& .MuiSelect-select": { fontSize: "13px", fontWeight: 600, color: "#1e293b" },
          "& .MuiTablePagination-actions button": {
            color: "#64748b",
            p: 0.8,
            "&:hover": { color: "#0c6b27" },
          },
        }}
      />
    </Box>
  );
}
