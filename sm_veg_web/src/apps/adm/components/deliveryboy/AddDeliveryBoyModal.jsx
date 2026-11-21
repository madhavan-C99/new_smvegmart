import { useState } from "react";
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
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

export default function AddDeliveryBoyModal({ open, onClose, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirm_password: "",
    address_line1: "",
    address_line2: "",
    vehicle_number: "",
    driving_license_no: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

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
    if (!formData.password.trim()) {
      setError("Please enter a password.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    if (!formData.address_line1.trim()) {
      setError("Please enter Address Line 1.");
      return;
    }
    if (!formData.driving_license_no.trim()) {
      setError("Please enter Driving License Number.");
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      mobile_number: formData.mobile_number.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2.trim(),
      vehicle_number: formData.vehicle_number.trim(),
      driving_license_no: formData.driving_license_no.trim(),
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      mobile_number: "",
      email: "",
      password: "",
      confirm_password: "",
      address_line1: "",
      address_line2: "",
      vehicle_number: "",
      driving_license_no: "",
    });
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      {/* Dialog Header with SM VegMart Theme */}
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
            <PersonAddOutlinedIcon sx={{ color: "#ffffff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>
              Add Delivery Boy
            </Typography>
            <Typography sx={{ fontSize: "12px", opacity: 0.85, mt: 0.2 }}>
              Fill in all required details below
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "#ffffff", opacity: 0.85, "&:hover": { opacity: 1 } }}>
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
                placeholder="Ranganath"
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
                placeholder="6374092591"
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
                placeholder="smvegmart@gmail.com"
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

          {/* SECTION 2: ACCOUNT CREDENTIALS */}
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
              Account Credentials
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
              {/* Password */}
              <TextField
                label="Password *"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                fullWidth
                size="small"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                }}
              />

              {/* Confirm Password */}
              <TextField
                label="Confirm Password *"
                placeholder="••••••••"
                type={showConfirmPassword ? "text" : "password"}
                required
                fullWidth
                size="small"
                value={formData.confirm_password}
                onChange={(e) => handleChange("confirm_password", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
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

          {/* SECTION 3: ADDRESS DETAILS */}
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
                label="Address Line 1 *"
                placeholder="16, 1st Floor"
                required
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
                placeholder="Sarathy nagar, opp to Vijaya..."
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

          {/* SECTION 4: VEHICLE & LICENSE DETAILS */}
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
              Vehicle & License Details
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
              {/* Vehicle Number */}
              <TextField
                label="Vehicle Number (Optional)"
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
                label="Driving License No *"
                placeholder="DL-0420110012345"
                required
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
            onClick={handleClose}
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
            startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 18 }} />}
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
            {loading ? "Adding..." : "+ Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
