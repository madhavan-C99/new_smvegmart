import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GreenSwitch from "../common/CustomSwitch";
import GenericTable from "../common/GenericTable";

export default function SubcategoryTable({
  subcategories = [],
  totalSubcategories,
  loading = false,
  maxHeight,
  onToggleVisibility,
  onEdit,
  onDelete,
  onExportCSV,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const currentScreenSubcategories = useMemo(() => {
    const start = page * rowsPerPage;
    return subcategories.slice(start, start + rowsPerPage);
  }, [subcategories, page, rowsPerPage]);
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
      headerName: "SUBCATEGORY",
      minWidth: 180,
      align: "left",
      renderCell: (row) => (
        <Box>
          <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: "#1b1b1e" }}>
            {row.name}
          </Typography>
          {row.tamil_name && (
            <Typography sx={{ fontSize: "12px", color: "#707a6d", lineHeight: "16px", mt: 0.3 }}>
              {row.tamil_name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "category_name",
      headerName: "CATEGORY",
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
          {row.category_name}
        </Box>
      ),
    },
    {
      field: "description",
      headerName: "DESCRIPTION",
      minWidth: 240,
      align: "left",
      renderCell: (row) => (
        <Typography sx={{ fontSize: "13px", color: "#545f73", maxWidth: 350, whiteSpace: "normal" }}>
          {row.description || "—"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "STATUS",
      minWidth: 110,
      align: "center",
      renderCell: (row) => (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            px: "10px",
            py: "3px",
            borderRadius: "9999px",
            bgcolor: row.visibility ? "#ecfdf5" : "#f1f5f9",
            border: row.visibility
              ? "1px solid rgba(167,243,208,0.6)"
              : "1px solid #e2e8f0",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: row.visibility ? "#059669" : "#94a3b8",
            }}
          />
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: row.visibility ? "#15803d" : "#545f73",
              lineHeight: "16px",
            }}
          >
            {row.visibility ? "Active" : "Inactive"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "visibility",
      headerName: "VISIBILITY",
      minWidth: 100,
      align: "center",
      renderCell: (row) => (
        <GreenSwitch
          checked={Boolean(row.visibility)}
          onChange={() => onToggleVisibility && onToggleVisibility(row.id)}
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
      {/* Table Section Controls matching Figma */}
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
            Showing {subcategories.length} of {totalSubcategories !== undefined ? totalSubcategories : subcategories.length}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => onExportCSV?.(currentScreenSubcategories)}
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
        rows={subcategories}
        loading={loading}
        minWidth={850}
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
