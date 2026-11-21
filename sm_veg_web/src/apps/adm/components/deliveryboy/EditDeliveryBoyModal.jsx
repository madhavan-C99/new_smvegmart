import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

export default function EditDeliveryBoyModal({ open, onClose, boy, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    address_line1: "",
    address_line2: "",
    vehicle_number: "",
    driving_license_no: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (boy) {
      setFormData({
        name: boy.name || "",
        mobile_number: boy.mobile || boy.mobile_number || "",
        email: boy.email || "",
        address_line1: boy.address_line1 || "",
        address_line2: boy.address_line2 || "",
        vehicle_number: boy.vehicle_number || "",
        driving_license_no: boy.driving_license_no || "",
      });
      setError("");
    }
  }, [boy, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter the delivery boy's full name.");
      return;
    }
    if (!formData.mobile_number.trim()) {
      setError("Please enter a valid mobile number.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    onSubmit({
      id: boy.id,
      name: formData.name.trim(),
      mobile_number: formData.mobile_number.trim(),
      email: formData.email.trim().toLowerCase(),
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2.trim(),
      vehicle_number: formData.vehicle_number.trim(),
      driving_license_no: formData.driving_license_no.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          bgcolor: "#0c6b27",
          color: "#ffffff",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EditOutlinedIcon sx={{ color: "#ffffff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
              Edit Delivery Boy
            </Typography>
            <Typography sx={{ fontSize: "12px", opacity: 0.85, mt: 0.2 }}>
              Update the delivery boy's information
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#ffffff", opacity: 0.85, "&:hover": { opacity: 1 } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: "8px", fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          {/* SECTION 1: PERSONAL INFORMATION */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#0c6b27",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Personal Information
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
              {/* Full Name */}
              <TextField
                label="Full Name"
                required
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              {/* Mobile Number */}
              <TextField
                label="Mobile Number"
                required
                fullWidth
                size="small"
                value={formData.mobile_number}
                onChange={(e) => handleChange("mobile_number", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneAndroidIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />
            </Box>

            {/* Email Address */}
            <Box sx={{ mt: 1.8 }}>
              <TextField
                label="Email Address"
                type="email"
                required
                fullWidth
                size="small"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* SECTION 2: ADDRESS DETAILS */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#0c6b27",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Address Details
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
              <TextField
                label="Address Line 1"
                fullWidth
                size="small"
                value={formData.address_line1}
                onChange={(e) => handleChange("address_line1", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              <TextField
                label="Address Line 2 (Optional)"
                fullWidth
                size="small"
                value={formData.address_line2}
                onChange={(e) => handleChange("address_line2", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* SECTION 3: VEHICLE & LICENSE DETAILS */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#0c6b27",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                mb: 1.5,
              }}
            >
              Vehicle & License Details (Optional)
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
              {/* Vehicle Number */}
              <TextField
                label="Vehicle Number"
                placeholder="KA-05-MB-8812"
                fullWidth
                size="small"
                value={formData.vehicle_number}
                onChange={(e) => handleChange("vehicle_number", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TwoWheelerIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              {/* Driving License No */}
              <TextField
                label="Driving License No"
                placeholder="DL-0420110012345"
                fullWidth
                size="small"
                value={formData.driving_license_no}
                onChange={(e) => handleChange("driving_license_no", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: "#fbfbf9", borderTop: "1px solid #e2e8f0", gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              color: "#545f73",
              borderColor: "#cbd5e1",
              px: 3,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              bgcolor: "#0c6b27",
              color: "#ffffff",
              px: 3.5,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(12, 107, 39, 0.25)",
              "&:hover": { bgcolor: "#09531e" },
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
