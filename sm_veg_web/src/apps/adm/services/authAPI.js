import api from "./apiClient";

export const authAPI = {
  /**
   * Log in using Username (Email or Mobile) & Password
   * Calls POST /adm/create_token
   */
  loginWithPassword: async (username, password) => {
    const response = await api.post("/adm/create_token", {
      username: username?.trim(),
      password,
    });
    return response.data;
  },

  /**
   * Generate 6-digit OTP for a Mobile Number
   * Calls POST /adm/generate_otp
   */
  generateOtp: async (mobile) => {
    const cleanMobile = String(mobile).replace(/\D/g, "");
    const response = await api.post("/adm/generate_otp", {
      mobile: cleanMobile,
    });
    return response.data;
  },

  /**
   * Verify 6-digit OTP & retrieve JWT token
   * Calls POST /adm/verify_otp
   */
  verifyOtp: async (otp, otp_id) => {
    const response = await api.post("/adm/verify_otp", {
      otp: String(otp).trim(),
      otp_id: Number(otp_id),
    });
    return response.data;
  },
};

export default authAPI;
