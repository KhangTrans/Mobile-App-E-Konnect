import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager } from "../utils/tokenManager";
import { ApiResponse } from "./authService";

const ADDRESS_API = `${API_BASE_URL}/api/addresses`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: ADDRESS_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
      await TokenManager.clearAuthData();
    }
    return Promise.reject(error);
  },
);

export interface CustomerAddress {
  _id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
  label?: string;
}

export type CreateAddressInput = Omit<CustomerAddress, '_id' | 'userId'>;

export const addressService = {
  getAddresses: async (): Promise<ApiResponse<CustomerAddress[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<CustomerAddress[]>>("/");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getDefaultAddress: async (): Promise<ApiResponse<CustomerAddress>> => {
    try {
      const response = await apiClient.get<ApiResponse<CustomerAddress>>("/default");
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getAddressById: async (addressId: string): Promise<ApiResponse<CustomerAddress>> => {
    try {
      const response = await apiClient.get<ApiResponse<CustomerAddress>>(`/${addressId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  createAddress: async (data: CreateAddressInput): Promise<ApiResponse<CustomerAddress>> => {
    try {
      const response = await apiClient.post<ApiResponse<CustomerAddress>>("/", data);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateAddress: async (addressId: string, data: Partial<CreateAddressInput>): Promise<ApiResponse<CustomerAddress>> => {
    try {
      const response = await apiClient.put<ApiResponse<CustomerAddress>>(`/${addressId}`, data);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  setDefaultAddress: async (addressId: string): Promise<ApiResponse<CustomerAddress>> => {
    try {
      const response = await apiClient.put<ApiResponse<CustomerAddress>>(`/${addressId}/set-default`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  deleteAddress: async (addressId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/${addressId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
};
