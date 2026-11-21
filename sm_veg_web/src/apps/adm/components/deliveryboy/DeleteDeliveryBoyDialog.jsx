import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

export default function DeleteDeliveryBoyDialog({ open, onClose, boy, onConfirm, loading = false }) {
  if (!boy) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            bgcolor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WarningAmberOutlinedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Typography sx={{ fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
          Delete Delivery Boy?
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        <Typography sx={{ fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
          Are you sure you want to remove <strong>{boy.name}</strong> ({boy.mobile || boy.email})?
        </Typography>
        <Typography sx={{ fontSize: "12.5px", color: "#dc2626", mt: 1, fontWeight: 500 }}>
          This will unassign any active orders and remove them from the active dispatch roster.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            color: "#64748b",
            borderColor: "#cbd5e1",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(boy.id)}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            bgcolor: "#dc2626",
            color: "#ffffff",
            fontWeight: 700,
            "&:hover": { bgcolor: "#b91c1c" },
          }}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
