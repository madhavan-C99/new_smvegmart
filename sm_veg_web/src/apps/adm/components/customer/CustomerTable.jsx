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
  CircularProgress,
  TablePagination,
} from "@mui/material";

// Avatar palettes matching Figma design
const AVATAR_PALETTES = [
  { bg: "#dcfce7", text: "#15803d" }, // Green
  { bg: "#ffedd5", text: "#c2410c" }, // Orange
  { bg: "#dbeafe", text: "#1d4ed8" }, // Blue
  { bg: "#ffe4e6", text: "#be123c" }, // Rose
  { bg: "#e0e7ff", text: "#4338ca" }, // Indigo
  { bg: "#f3e8ff", text: "#7e22ce" }, // Purple
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
    initials = "U";
  }
  return { initials, ...palette };
};

export default function CustomerTable({
  customers = [],
  loading = false,
  onToggleStatus = () => {},
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return customers.slice(start, start + rowsPerPage);
  }, [customers, page, rowsPerPage]);

  const maxPage = Math.max(0, Math.ceil(customers.length / rowsPerPage) - 1);
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
          Loading customers...
        </Typography>
      </Box>
    );
  }

  if (customers.length === 0) {
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
          No Customers Found
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: "13.5px", color: "#64748b" }}>
          No customer accounts matched your search criteria.
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
        <Table sx={{ minWidth: 750 }}>
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
                  width: 70,
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
                MOBILE NUMBER
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
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCustomers.map((cust, index) => {
              const avatar = getAvatarStyle(cust.name, index);
              const isActive = cust.is_active;
              const serialNumber = page * rowsPerPage + index + 1;

              return (
                <TableRow
                  key={cust.id}
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
                          {cust.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: 400,
                            mt: 0.2,
                          }}
                        >
                          Registered: {cust.registered_date || "—"}
                        </Typography>
                      </Box>
                    </Box>
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
                    {cust.mobile_number || "—"}
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
                      {cust.role_name || "Customer"}
                    </Box>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell sx={{ py: 2, pr: 3 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.5,
                        py: 0.4,
                        borderRadius: "16px",
                        bgcolor: isActive ? "#ecfdf5" : "#f1f5f9",
                        border: isActive ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        color: isActive ? "#166534" : "#64748b",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: isActive ? "#16a34a" : "#94a3b8",
                        }}
                      />
                      {isActive ? "Active" : "Inactive"}
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
        count={customers.length}
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
