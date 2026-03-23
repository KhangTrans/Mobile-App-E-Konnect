// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://backend-node-5re9.onrender.com"; // Fallback

// Debug log
console.log("API_BASE_URL:", API_BASE_URL);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    ME: "/api/auth/me",
    GOOGLE_TOKEN: "/api/auth/google/token",
  },
  BANNERS: {
    ACTIVE: "/api/product-banners/active",
    DETAIL: (id: string) => `/api/product-banners/${id}`,
  },
};
