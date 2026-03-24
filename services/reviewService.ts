import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager } from "../utils/tokenManager";
import { ApiResponse } from "./authService";

const REVIEW_API = `${API_BASE_URL}/api/reviews`;

const apiClient = axios.create({
  baseURL: REVIEW_API,
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

export interface ReviewUser {
  _id: string;
  username?: string;
  fullName?: string;
  avatar?: string;
}

export interface ReviewReply {
  comment?: string;
  repliedAt?: string;
  repliedBy?: string;
}

export interface ProductReview {
  _id: string;
  user: ReviewUser;
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: ReviewReply;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const reviewService = {
  getProductReviews: async (productId: string): Promise<ApiResponse<ProductReview[]>> => {
    try {
      const response = await apiClient.get<ApiResponse<ProductReview[]>>(`/${productId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  getReviewStats: async (productId: string): Promise<ApiResponse<ReviewStats>> => {
    try {
      const response = await apiClient.get<ApiResponse<ReviewStats>>(`/stats/${productId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  createReview: async (payload: {
    productId: string;
    rating: number;
    comment: string;
  }): Promise<ApiResponse<ProductReview>> => {
    try {
      const response = await apiClient.post<ApiResponse<ProductReview>>("/", payload);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};
