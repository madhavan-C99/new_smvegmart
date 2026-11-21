import { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

// Avatar palettes matching Figma design
const AVATAR_PALETTES = [
  { bg: "#dcfce7", text: "#15803d" }, // Green (RV)
  { bg: "#ffedd5", text: "#c2410c" }, // Orange (AD)
  { bg: "#f3e8ff", text: "#7e22ce" }, // Purple (VS)
  { bg: "#dbeafe", text: "#1d4ed8" }, // Blue (PS)
  { bg: "#ccfbf1", text: "#0f766e" }, // Teal (KN)
  { bg: "#ffe4e6", text: "#be123c" }, // Rose (SK)
  { bg: "#e0e7ff", text: "#4338ca" }, // Indigo (AG)
];

const getAvatarStyle = (name = "", index = 0) => {
  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const parts = name.trim().split(" ");
  let initials = "";
  if (parts.length >= 2) {
    initials = `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  } else if (parts.length === 1 && parts[0]) {
    initials = parts[0].slice(0, 2).toUpperCase();
  } else {
    initials = "D";
  }
  return { initials, ...palette };
};

// 3-Mode Status Configurations driven by Order Management
export const STATUS_MODES = {
  online: {
    key: "online",
    label: "Online",
    dotColor: "#16a34a",
    bgColor: "#ecfdf5",
    textColor: "#166534",
    borderColor: "#bbf7d0",
    description: "Available for deliveries",
  },
  busy: {
    key: "busy",
    label: "Busy",
    dotColor: "#d97706",
    bgColor: "#fffbeb",
    textColor: "#b45309",
    borderColor: "#fde68a",
    description: "Currently on delivery / occupied",
  },
  offline: {
    key: "offline",
    label: "Offline",
    dotColor: "#94a3b8",
    bgColor: "#f1f5f9",
    textColor: "#64748b",
    borderColor: "#e2e8f0",
    description: "Off duty / unavailable",
  },
};

export const getDeliveryBoyStatus = (boy) => {
  const s = String(boy?.status || "").toLowerCase().trim();
  if (s === "busy" || Number(boy?.active_orders_count) > 0) {
    return STATUS_MODES.busy;
  }
  if (s === "offline" || boy?.is_active === false) {
    return STATUS_MODES.offline;
  }
  return STATUS_MODES.online;
};

export default function DeliveryBoyTable({
  deliveryBoys = [],
  loading = false,
  onViewDetails = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedDeliveryBoys = useMemo(() => {
    const start = page * rowsPerPage;
    return deliveryBoys.slice(start, start + rowsPerPage);
  }, [deliveryBoys, page, rowsPerPage]);

  const maxPage = Math.max(0, Math.ceil(deliveryBoys.length / rowsPerPage) - 1);
  if (page > maxPage && maxPage >= 0) {
    setPage(0);
  }

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderRadius: "12px",
          p: 6,
          textAlign: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <CircularProgress size={36} sx={{ color: "#0c6b27" }} />
        <Typography sx={{ mt: 2, fontSize: "14px", color: "#64748b" }}>
          Loading delivery agents...
        </Typography>
      </Box>
    );
  }

  if (deliveryBoys.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderRadius: "12px",
          p: 6,
          textAlign: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
          No Delivery Boys Found
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: "13.5px", color: "#64748b" }}>
          Try clearing your search query or click "Add Delivery Boy" to register a new agent.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1100 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f8fafc" }}>
            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
                px: 3,
                width: 60,
              }}
            >
              S.NO
            </TableCell>

            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              NAME
            </TableCell>

            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              EMAIL
            </TableCell>

            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              MOBILE NUMBER
            </TableCell>

            <TableCell
              align="center"
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              TOTAL DEL
            </TableCell>

            <TableCell
              align="center"
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              TODAY
            </TableCell>

            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              ROLE NAME
            </TableCell>

            <TableCell
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
              }}
            >
              STATUS
            </TableCell>

            <TableCell
              align="right"
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.5px",
                py: "14px",
                pr: 3,
              }}
            >
              ACTION
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {paginatedDeliveryBoys.map((boy, index) => {
            const avatar = getAvatarStyle(boy.name, index);
            const statusCfg = getDeliveryBoyStatus(boy);
            const totalDel = boy.total_delivered ?? (boy.total_orders || 0);
            const todayDel = boy.delivered_today ?? (boy.today_deliveries || "-");
            const serialNumber = page * rowsPerPage + index + 1;

            return (
              <TableRow
                key={boy.id}
                hover
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  transition: "background-color 0.15s ease",
                  "&:hover": { bgcolor: "#fbfcfd" },
                }}
              >
                {/* S.NO */}
                <TableCell
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "#64748b",
                    py: 2,
                    px: 3,
                  }}
                >
                  {serialNumber}
                </TableCell>

                {/* NAME with Avatar & Registered Date */}
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        bgcolor: avatar.bg,
                        color: avatar.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {avatar.initials}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1e293b",
                          lineHeight: 1.3,
                        }}
                      >
                        {boy.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: 400,
                          mt: 0.2,
                        }}
                      >
                        Registered: {boy.registered_date || (boy.created_at ? new Date(boy.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—")}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* EMAIL */}
                <TableCell
                  sx={{
                    fontSize: "13px",
                    color: "#475569",
                    fontFamily: "monospace, sans-serif",
                    py: 2,
                  }}
                >
                  {boy.email || "—"}
                </TableCell>

                {/* MOBILE NUMBER */}
                <TableCell
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "#334155",
                    py: 2,
                  }}
                >
                  {boy.mobile || boy.mobile_number || "—"}
                </TableCell>

                {/* TOTAL DEL */}
                <TableCell
                  align="center"
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    py: 2,
                  }}
                >
                  {totalDel}
                </TableCell>

                {/* TODAY */}
                <TableCell
                  align="center"
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: todayDel !== "-" ? "#0c6b27" : "#64748b",
                    py: 2,
                  }}
                >
                  {todayDel}
                </TableCell>

                {/* ROLE NAME */}
                <TableCell sx={{ py: 2 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.4,
                      borderRadius: "16px",
                      bgcolor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Delivery Boy
                  </Box>
                </TableCell>

                {/* STATUS: Online, Busy, Offline (Clean non-clickable badge synced with Order Management) */}
                <TableCell sx={{ py: 2 }}>
                  <Tooltip title={statusCfg.description} arrow>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.5,
                        py: 0.4,
                        borderRadius: "16px",
                        bgcolor: statusCfg.bgColor,
                        border: `1px solid ${statusCfg.borderColor}`,
                        color: statusCfg.textColor,
                        fontSize: "12px",
                        fontWeight: 600,
                        userSelect: "none",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: statusCfg.dotColor,
                        }}
                      />
                      {statusCfg.label}
                    </Box>
                  </Tooltip>
                </TableCell>

                {/* ACTION */}
                <TableCell align="right" sx={{ py: 2, pr: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(boy)}
                        sx={{
                          color: "#64748b",
                          "&:hover": { color: "#0c6b27", bgcolor: "#ecfdf5" },
                        }}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Delivery Boy">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(boy)}
                        sx={{
                          color: "#64748b",
                          "&:hover": { color: "#0c6b27", bgcolor: "#ecfdf5" },
                        }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Delivery Boy">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(boy)}
                        sx={{
                          color: "#64748b",
                          "&:hover": { color: "#dc2626", bgcolor: "#fef2f2" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

      {/* Table Pagination Bar matching Figma / Standard Admin UI */}
      <TablePagination
        component="div"
        count={deliveryBoys.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Items per page"
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        showFirstButton
        showLastButton
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: "300px",
                overflowY: "auto",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                "&::-webkit-scrollbar": { width: "5px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cbd5e1",
                  borderRadius: "4px",
                },
              },
            },
          },
        }}
        sx={{
          borderTop: "1px solid #e2e8f0",
          "& .MuiTablePagination-toolbar": { minHeight: "56px", px: 2 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "14px",
            color: "#4b5563",
            fontWeight: 500,
          },
          "& .MuiSelect-select": { fontSize: "14px", fontWeight: 500 },
        }}
      />
    </Box>
  );
}
