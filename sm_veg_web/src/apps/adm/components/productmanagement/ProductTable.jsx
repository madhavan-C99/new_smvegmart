import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Checkbox,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GenericTable from "../common/GenericTable";

const formatWeight = (w) => {
  if (!w) return "";
  let clean = String(w).trim();
  clean = clean.replace(/^\((.*)\)$/, "$1").trim();
  clean = clean.replace(/^([\d.]+)\s*([a-zA-Z]+)$/, "$1 $2");
  return `(${clean})`;
};

export default function ProductTable({
  products = [],
  totalProducts,
  loading = false,
  maxHeight,
  onToggleDailyVegetables,
  onEdit,
  onDelete,
  onExportCSV,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const currentScreenProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return products.slice(start, start + rowsPerPage);
  }, [products, page, rowsPerPage]);
  const columns = [
    {
      field: "s_no",
      headerName: "S.NO",
      minWidth: 60,
      align: "center",
      sticky: true,
      stickyWidth: 60,
      hideable: false,
      renderCell: (row, index, globalIndex) => (
        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1b1b1e" }}>
          {row.s_no || globalIndex + 1}
        </Typography>
      ),
    },
    {
      field: "image",
      headerName: "IMAGE",
      minWidth: 80,
      align: "center",
      renderCell: (row) => (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #e7e5e0",
            p: "3px",
            bgcolor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
          }}
        >
          {row.image ? (
            <img
              src={row.image}
              alt={row.name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                bgcolor: "#f3f4f6",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              No Img
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "PRODUCT",
      minWidth: 180,
      align: "left",
      renderCell: (row) => (
        <Box>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#1b1b1e",
              lineHeight: "16px",
            }}
          >
            {row.name}
          </Typography>
          {row.tamil_name && (
            <Typography
              sx={{
                fontSize: "12px",
                color: "#707a6d",
                lineHeight: "16px",
                mt: 0.3,
              }}
            >
              {row.tamil_name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "category_name",
      headerName: "CATEGORY",
      minWidth: 130,
      align: "left",
      renderCell: (row) => (
        <Box
          sx={{
            display: "inline-block",
            px: "10px",
            py: "2px",
            borderRadius: "9999px",
            bgcolor: "#f1f5f9",
            color: "#334155",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            whiteSpace: "nowrap",
          }}
        >
          {row.category_name}
        </Box>
      ),
    },
    {
      field: "subcategory_name",
      headerName: "SUBCATEGORY",
      minWidth: 140,
      align: "left",
      renderCell: (row) => (
        <Box
          sx={{
            display: "inline-block",
            px: "10px",
            py: "2px",
            borderRadius: "9999px",
            bgcolor: "#f1f5f9",
            color: "#334155",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: "16px",
            whiteSpace: "nowrap",
          }}
        >
          {row.subcategory_name}
        </Box>
      ),
    },
    {
      field: "variants",
      headerName: "PRICE,WEIGHT,STK",
      minWidth: 200,
      align: "left",
      renderCell: (row) => {
        const variantsList = row.variants || [];
        return (
          <Box
            sx={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {variantsList.map((v, i) => {
              const isOutOfStock =
                (v.stock_quantity !== undefined &&
                  v.stock_quantity !== null &&
                  Number(v.stock_quantity) <= 0) ||
                v.stock === "(0 In stock)" ||
                (typeof v.stock === "string" &&
                  (v.stock.toLowerCase().includes("out of stock") ||
                    v.stock.startsWith("(0 "))) ||
                Number(v.stock) === 0;

              return (
                <Box
                  key={i}
                  sx={{
                    bgcolor: "#f4f4f0",
                    border: "0.87px solid rgba(231,229,224,0.8)",
                    borderRadius: "4px",
                    px: "6px",
                    py: "4px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 58,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1b1b1e",
                      lineHeight: "14px",
                    }}
                  >
                    {v.price} {formatWeight(v.weight)}
                  </Typography>
                  {Boolean(v.discount && Number(v.discount) > 0) && (
                    <Typography
                      sx={{
                        fontSize: "9.5px",
                        color: "#15803d",
                        fontWeight: 700,
                        lineHeight: "12px",
                        mt: "1px",
                      }}
                    >
                      {v.discount}% off
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: "9px",
                      color: isOutOfStock ? "#dc2626" : "#545f73",
                      fontWeight: isOutOfStock ? 700 : 400,
                      lineHeight: "15px",
                      mt: "2px",
                    }}
                  >
                    {isOutOfStock ? "Out of Stock" : v.stock}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "STATUS",
      minWidth: 120,
      align: "center",
      renderCell: (row) => {
        if (row.status === "Out of Stock") {
          return (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: "10px",
                py: "3px",
                borderRadius: "9999px",
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: "16px",
              }}
            >
              Out of Stock
            </Box>
          );
        }
        if (!row.visibility || row.status === "Inactive") {
          return (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                px: "10px",
                py: "3px",
                borderRadius: "9999px",
                bgcolor: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#9ca3af",
                }}
              />
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#4b5563",
                  lineHeight: "16px",
                }}
              >
                Inactive
              </Typography>
            </Box>
          );
        }
        return (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              px: "10px",
              py: "3px",
              borderRadius: "9999px",
              bgcolor: "#ecfdf5",
              border: "1px solid rgba(167,243,208,0.6)",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#059669",
              }}
            />
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#15803d",
                lineHeight: "16px",
              }}
            >
              Active
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "daily_vegetables",
      headerName: "DAILY VEG",
      minWidth: 95,
      align: "center",
      renderCell: (row) => (
        <Checkbox
          checked={Boolean(row.daily_vegetables)}
          onChange={() =>
            onToggleDailyVegetables &&
            onToggleDailyVegetables(row.id, row.daily_vegetables)
          }
          size="small"
          sx={{
            color: "#9ca3af",
            "&.Mui-checked": {
              color: "#0c6b27",
            },
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      minWidth: 90,
      align: "center",
      hideable: false,
      renderCell: (row) => (
        <Box sx={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <IconButton
            size="small"
            onClick={() => onEdit && onEdit(row)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              color: "#545f73",
              "&:hover": { bgcolor: "#f1f5f9", color: "#1b1b1e" },
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete && onDelete(row.id)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              color: "#545f73",
              "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
            }}
          >
            <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Sub-header for bulk & views matching Figma */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          py: "16px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#1b1b1e",
              lineHeight: "24px",
            }}
          >
            Configured Categories
          </Typography>
          <Box
            sx={{
              px: "10px",
              py: "2px",
              borderRadius: "9999px",
              bgcolor: "#f0edf1",
              color: "#545f73",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.33px",
              lineHeight: "14px",
            }}
          >
            Showing {products.length} of {totalProducts !== undefined ? totalProducts : products.length}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => onExportCSV?.(currentScreenProducts)}
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #eae7eb",
              borderRadius: "8px",
              px: "12px",
              py: "6px",
              color: "#1b1b1e",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.13px",
              textTransform: "none",
              lineHeight: "16px",
              boxShadow: "0px 1px 1px rgba(0,0,0,0.02)",
              "&:hover": { bgcolor: "#F9FAFB" },
            }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Generic Table */}
      <GenericTable
        columns={columns}
        rows={products}
        loading={loading}
        minWidth={1050}
        maxHeight={maxHeight}
        pagination
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
}
