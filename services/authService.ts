import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager, UserData } from "../utils/tokenManager";

/**
 * Auth Service - Handle all authentication API calls
 */

const AUTH_API = `${API_BASE_URL}/api/auth`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: AUTH_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth data
      await TokenManager.clearAuthData();
    }
    return Promise.reject(error);
  },
);

/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  type?: string;
  value?: string;
  msg: string;
  path: string;
  location?: string;
}

export interface LoginResponse {
  user: UserData;
  token: string;
}

export interface RegisterResponse {
  user: UserData;
}

/**
 * Auth Service Methods
 */

export const authService = {
  /**
   * Login with email and password
   */
  login: async (
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        "/login",
        {
          email: email.trim(),
          password,
        },
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<ApiResponse<RegisterResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>(
        "/register",
        {
          username: userData.username.trim(),
          email: userData.email.trim(),
          password: userData.password,
          fullName: userData.fullName?.trim() || undefined,
        },
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Send OTP to email for password reset
   */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>("/forgot-password", {
        email: email.trim(),
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>("/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Get current user info
   */
  getMe: async (): Promise<ApiResponse<UserData>> => {
    try {
      const response = await apiClient.get<ApiResponse<UserData>>("/me");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Google Sign-In (Mobile)
   */
  googleTokenLogin: async (googleData: {
    googleId: string;
    email: string;
    fullName?: string;
    avatar?: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        "/google/token",
        googleData,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Logout (clear local storage)
   */
  logout: async (): Promise<void> => {
    await TokenManager.clearAuthData();
  },
};

/**
 * Helper function to extract error message from API response
 */
export const getErrorMessage = (response: ApiResponse): string => {
  // Check for validation errors array
  if (response.errors && response.errors.length > 0) {
    return response.errors[0].msg;
  }

  // Check for error field
  if (response.error) {
    return response.error;
  }

  // Check for message field
  if (response.message) {
    return response.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
};

/**
 * Helper function to get all validation errors by field
 */
export const getValidationErrors = (
  response: ApiResponse,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (response.errors && response.errors.length > 0) {
    response.errors.forEach((error) => {
      errors[error.path] = error.msg;
    });
  }

  return errors;
};
