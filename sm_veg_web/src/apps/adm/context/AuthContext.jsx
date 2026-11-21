import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authAPI from "../services/authAPI";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Keep state synced with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  /**
   * Log in with Email/Mobile + Password
   */
  const loginWithPassword = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await authAPI.loginWithPassword(username, password);
      const tokenVal = res?.data?.token;
      const userVal = res?.data?.user;

      if (!tokenVal) {
        throw new Error(res?.message || "Invalid authentication response from server.");
      }

      setToken(tokenVal);
      setUser(userVal || { name: "Operations Admin", role: "admin" });
      return { success: true, user: userVal };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send 6-Digit OTP to Mobile Number
   */
  const sendOtp = useCallback(async (mobile) => {
    setLoading(true);
    try {
      const res = await authAPI.generateOtp(mobile);
      const data = res?.data;
      return {
        success: true,
        otp_id: data?.otp_id,
        message: data?.message || "OTP sent successfully.",
        otp: data?.otp, // Useful for quick testing / dev
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify OTP and Log in
   */
  const loginWithOtp = useCallback(async (otp, otp_id) => {
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(otp, otp_id);
      const data = res?.data;

      if (data?.verify === false) {
        throw new Error(data?.message || "Invalid or expired OTP. Please try again.");
      }

      const tokenVal = data?.token;
      const userVal = data?.user;

      if (!tokenVal) {
        throw new Error(data?.message || "Failed to retrieve access token.");
      }

      setToken(tokenVal);
      setUser(userVal || { name: "Operations Admin", role: "admin" });
      return { success: true, user: userVal };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out and clear stored session
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    loading,
    loginWithPassword,
    sendOtp,
    loginWithOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
