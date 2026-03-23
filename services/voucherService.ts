import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager } from "../utils/tokenManager";
import { ApiResponse } from "./authService";

const VOUCHER_API = `${API_BASE_URL}/api/vouchers`;

const apiClient = axios.create({
  baseURL: VOUCHER_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await TokenManager.clearAuthData();
    }
    return Promise.reject(error);
  },
);

export interface Voucher {
  _id: string;
  code: string;
  type: "DISCOUNT" | "FREE_SHIP";
  description: string;
  discountPercent: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  userId?: string; 
}

export const voucherService = {
  getPublicVouchers: async (type?: "DISCOUNT" | "FREE_SHIP"): Promise<ApiResponse<Voucher[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<Voucher[]>>("/public", { params: { type } });
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) return error.response.data;
      throw error;
    }
  },

  getMyVouchers: async (): Promise<ApiResponse<Voucher[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<Voucher[]>>("/my-vouchers");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) return error.response.data;
      throw error;
    }
  },

  collectVoucher: async (voucherId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.post<ApiResponse<null>>(`/collect/${voucherId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) return error.response.data;
      throw error;
    }
  },
};
