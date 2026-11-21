import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPassword, sendOtp, loginWithOtp, isAuthenticated, loading } = useAuth();

  // Mode: "password" (default) or "otp"
  const [isOtpMode, setIsOtpMode] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP specific states
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState(null);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // General feedback states
  const [errorMessage, setErrorMessage] = useState("");

  // Target destination after successful login
  const from = location.state?.from?.pathname || "/admin/categories";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Toggle mode & clear transient errors
  const handleToggleMode = () => {
    setIsOtpMode((prev) => !prev);
    setErrorMessage("");
    setOtpSentMessage("");
  };

  // Handle Send OTP click
  const handleSendOtp = async () => {
    setErrorMessage("");
    setOtpSentMessage("");

    const cleanNumber = identifier.trim().replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number above to receive OTP.");
      return;
    }

    try {
      const res = await sendOtp(cleanNumber);
      setOtpId(res.otp_id);
      setResendCooldown(45);
      const devHint = res.otp ? ` (Test code: ${res.otp})` : "";
      setOtpSentMessage(`OTP sent to ${identifier}${devHint}`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to send OTP. Please check your number."
      );
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim()) {
      setErrorMessage("Please enter your email address or mobile number.");
      return;
    }

    if (!isOtpMode) {
      // Password Sign In
      if (!password) {
        setErrorMessage("Please enter your password.");
        return;
      }

      try {
        await loginWithPassword(identifier, password);
        navigate(from, { replace: true });
      } catch (err) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Invalid credentials. Please check your password.";
        setErrorMessage(errorDetail);
      }
    } else {
      // OTP Sign In
      if (!otpId) {
        setErrorMessage("Please click 'Send OTP' first to receive your verification code.");
        return;
      }
      if (!otp.trim() || otp.trim().length !== 6) {
        setErrorMessage("Please enter the 6-digit OTP sent to your mobile.");
        return;
      }

      try {
        await loginWithOtp(otp, otpId);
        navigate(from, { replace: true });
      } catch (err) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Invalid or expired OTP. Please try again.";
        setErrorMessage(errorDetail);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        p: 2,
        position: "relative",
      }}
    >
      {/* Top Brand Bar */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          px: { xs: 2, sm: 4 },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            bgcolor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🥬
        </Box>
        <Typography sx={{ fontSize: "16px", fontWeight: 900, color: "#0c6b27", letterSpacing: "-0.3px" }}>
          SM VEG MART
        </Typography>
        <Typography sx={{ color: "#94a3b8", fontSize: "14px" }}>|</Typography>
        <Typography sx={{ color: "#475569", fontSize: "13px", fontWeight: 600 }}>
          Admin Operations Portal
        </Typography>
      </Box>

      {/* Centered Minimal Login Card */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: "16px",
          boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          mt: 4,
        }}
      >
        {/* Top Green Accent Stripe */}
        <Box sx={{ height: 5, bgcolor: "#0c6b27" }} />

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header & Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.8,
                bgcolor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                px: 1.5,
                py: 0.4,
                borderRadius: "20px",
                mb: 1.2,
              }}
            >
              <Typography sx={{ fontSize: 13 }}>🥬</Typography>
              <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>
                SM MART
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.4px" }}
            >
              {isOtpMode ? "OTP Verification" : "Admin Sign In"}
            </Typography>

            <Typography sx={{ fontSize: "13px", color: "#64748b", mt: 0.5 }}>
              {isOtpMode
                ? "Enter your mobile number to receive a 6-digit code"
                : "Enter your credentials to access operations"}
            </Typography>
          </Box>

          {/* Feedback Messages */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "8px", fontSize: "12.5px" }}>
              {errorMessage}
            </Alert>
          )}

          {otpSentMessage && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: "8px", fontSize: "12.5px" }}>
              {otpSentMessage}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Input 1: Email or Mobile Number */}
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: "#334155", mb: 0.8 }}>
                {isOtpMode ? "Mobile Number" : "Email or Mobile Number"} <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isOtpMode ? "9876543210" : "admin@smvegmart.com or 9876543210"}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon sx={{ fontSize: 18, color: "#64748b" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    bgcolor: "#ffffff",
                    "&.Mui-focused fieldset": { borderColor: "#0c6b27" },
                  },
                }}
              />
            </Box>

            {/* Input 2: Conditional Render (Password OR OTP) */}
            {!isOtpMode ? (
              /* Password Field */
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                    Password <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                  </Typography>
                  <Typography
                    onClick={() => alert("Please contact system administrator to reset password.")}
                    sx={{
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#0c6b27",
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Forgot?
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                          ) : (
                            <VisibilityOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      bgcolor: "#ffffff",
                      "&.Mui-focused fieldset": { borderColor: "#0c6b27" },
                    },
                  }}
                />
              </Box>
            ) : (
              /* OTP Field + Send OTP Button */
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: "#334155", mb: 0.8 }}>
                  6-Digit OTP <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: "#64748b" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        fontSize: "14px",
                        letterSpacing: "2px",
                        bgcolor: "#ffffff",
                        "&.Mui-focused fieldset": { borderColor: "#0c6b27" },
                      },
                    }}
                  />
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || resendCooldown > 0}
                    variant="outlined"
                    sx={{
                      whiteSpace: "nowrap",
                      px: 2,
                      borderRadius: "10px",
                      borderColor: "#a7f3d0",
                      color: "#065f46",
                      bgcolor: "#ecfdf5",
                      fontWeight: 700,
                      fontSize: "12px",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#d1fae5", borderColor: "#6ee7b7" },
                    }}
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Send OTP"}
                  </Button>
                </Box>
              </Box>
            )}

            {/* ONE LINE TOGGLE: "Log in with OTP" / "Log in with Password instead" */}
            <Box sx={{ textAlign: "center", my: 2 }}>
              <Typography
                onClick={handleToggleMode}
                sx={{
                  display: "inline-block",
                  color: "#0c6b27",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {isOtpMode ? "🔑 Log in with Password instead" : "📱 Log in with OTP"}
              </Typography>
            </Box>

            {/* Primary Action Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.3,
                borderRadius: "10px",
                bgcolor: "#0c6b27",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(12, 107, 39, 0.3)",
                "&:hover": { bgcolor: "#09531e" },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : isOtpMode ? (
                "Verify & Sign In →"
              ) : (
                "Sign In →"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
