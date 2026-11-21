import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Fade,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";

const TYPE_CONFIG = {
  danger: {
    icon: DeleteOutlineOutlinedIcon,
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    confirmBg: "#dc2626",
    confirmHoverBg: "#b91c1c",
    defaultConfirmText: "Delete",
  },
  error: {
    icon: ErrorOutlineOutlinedIcon,
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    confirmBg: "#dc2626",
    confirmHoverBg: "#b91c1c",
    defaultConfirmText: "Okay",
  },
  warning: {
    icon: WarningAmberOutlinedIcon,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    confirmBg: "#d97706",
    confirmHoverBg: "#b45309",
    defaultConfirmText: "Understood",
  },
  info: {
    icon: InfoOutlinedIcon,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
    confirmBg: "#0f6838",
    confirmHoverBg: "#0c532d",
    defaultConfirmText: "Okay",
  },
  success: {
    icon: CheckCircleOutlineOutlinedIcon,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    confirmBg: "#16a34a",
    confirmHoverBg: "#15803d",
    defaultConfirmText: "Great",
  },
};

export default function CommonPopup({
  open = false,
  onClose,
  onConfirm,
  title = "Confirmation",
  message = "Are you sure you want to proceed?",
  type = "danger", // 'danger' | 'warning' | 'info' | 'success' | 'error'
  confirmText,
  cancelText = "Cancel",
  isConfirm = true, // true: shows Cancel + Confirm; false: shows single Action button
  loading = false,
}) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const IconComponent = config.icon;
  const actionButtonText = confirmText || config.defaultConfirmText;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      TransitionComponent={Fade}
      transitionDuration={200}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          p: { xs: 2, sm: 2.5 },
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          bgcolor: "#ffffff",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 1, pt: 1.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Centered Circular Icon Badge */}
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            bgcolor: config.iconBg,
            color: config.iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            transition: "transform 0.2s ease",
            boxShadow: `0 0 0 8px ${config.iconBg}40`,
          }}
        >
          <IconComponent sx={{ fontSize: 28 }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#0f172a",
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          sx={{
            fontSize: "13.5px",
            color: "#64748b",
            lineHeight: 1.55,
            px: 1,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", gap: 1.5, p: 1.5, pt: 2 }}>
        {isConfirm && (
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13.5px",
              color: "#475569",
              borderColor: "#cbd5e1",
              px: 2.5,
              py: 0.9,
              minWidth: "100px",
              "&:hover": {
                borderColor: "#94a3b8",
                bgcolor: "#f8fafc",
              },
            }}
          >
            {cancelText}
          </Button>
        )}

        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "13.5px",
            bgcolor: config.confirmBg,
            color: "#ffffff",
            px: 3,
            py: 0.9,
            minWidth: isConfirm ? "110px" : "130px",
            boxShadow: "none",
            "&:hover": {
              bgcolor: config.confirmHoverBg,
              boxShadow: "none",
            },
          }}
        >
          {loading ? "Processing..." : actionButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
