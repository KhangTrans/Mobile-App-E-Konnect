import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager } from "../utils/tokenManager";
import { ApiResponse } from "./authService";

const ORDER_API = `${API_BASE_URL}/api/orders`;

const apiClient = axios.create({
  baseURL: ORDER_API,
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
  (error) => {
    return Promise.reject(error);
  },
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

export interface BuyNowPayload {
  productId: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingNote?: string;
  paymentMethod: "cod";
  voucherIds?: string[];
}

export interface OrderItem {
  productId: string | { _id: string; name?: string };
  productName: string;
  productImage?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  _id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingNote?: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MyOrdersResponse {
  data: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const orderService = {
  buyNow: async (payload: BuyNowPayload): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        "/buy-now",
        payload,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getMyOrders: async (params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<Order[]> & {
      pagination?: MyOrdersResponse["pagination"];
    }
  > => {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>("/my", {
        params,
      });
      return {
        ...response.data,
        pagination: (response.data as any).pagination,
      };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/${orderId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Repurchase (Mua lại) - Tái sử dụng buyNow
   * Frontend: Gọi getOrderById() trước để lấy chi tiết đơn,
   * sau đó bóc tách sản phẩm và gọi hàm nay đưa sang trang thanh toán
   */
  repurchase: async (payload: BuyNowPayload): Promise<ApiResponse<Order>> => {
    // Nếu chỉ có 1 sản phẩm mua lại thẳng bằng buyNow
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        "/buy-now",
        payload,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};
