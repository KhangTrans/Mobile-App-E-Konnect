/**
 * Product Service - Handle all product-related API calls
 * Kết nối tới backend-node để lấy dữ liệu sản phẩm
 */

import axios, { AxiosError, isAxiosError } from "axios";
import { API_BASE_URL } from "../config/config";
import { TokenManager } from "../utils/tokenManager";
import { ApiResponse } from "./authService";

/**
 * Cấu hình API sản phẩm
 */
const PRODUCT_API = `${API_BASE_URL}/api/products`;

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: PRODUCT_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 giây timeout
});

// Request interceptor - tự động thêm token vào header
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
  }
);

// Response interceptor - xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await TokenManager.clearAuthData();
    }
    return Promise.reject(error);
  }
);

/**
 * ============================================================
 * KIỂU DỮ LIỆU (Type Definitions)
 * ============================================================
 */

// Hình ảnh sản phẩm
export interface ProductImage {
  imageUrl: string;
  isPrimary: boolean;
  order: number;
}

// Biến thể sản phẩm (màu sắc, kích thước...)
export interface ProductVariant {
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  color?: string;
  size?: string;
  material?: string;
  isActive?: boolean;
}

// Danh mục (populate từ backend)
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

// Người tạo sản phẩm
export interface ProductCreator {
  _id: string;
  username?: string;
  fullName?: string;
  email?: string;
}

// Sản phẩm - khớp với backend MongoDB schema
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: Category;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  createdBy?: ProductCreator;
  createdAt: string;
  updatedAt: string;
  // Discount fields (computed by backend)
  hasDiscount?: boolean;
  discountedPrice?: number;  // Giá sau khi giảm (dùng để hiển thị)
  discountPercent?: number;  // % giảm giá
  originalPrice?: number;    // Giá gốc (= price)
}

// Kết quả phân trang - khớp với backend controller trả về
export interface ProductPagination {
  products: Product[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
  };
}

// ============================================================
// SERVICE METHODS
// ============================================================

export const productService = {
  /**
   * Lấy danh sách tất cả sản phẩm (có phân trang)
   *
   * @param page        - Trang hiện tại (mặc định: 1)
   * @param limit       - Số sản phẩm mỗi trang (mặc định: 20)
   * @param categoryId  - Lọc theo danh mục (tùy chọn)
   * @param search      - Tìm kiếm theo tên (tùy chọn)
   *
   * Backend trả về:
   * {
   *   success: true,
   *   count: number,
   *   total: number,
   *   totalPages: number,
   *   currentPage: number,
   *   data: Product[]   <-- là mảng sản phẩm
   * }
   *
   * Ta convert sang ProductPagination để code dễ đọc hơn
   */
  getAllProducts: async (
    page: number = 1,
    limit: number = 20,
    categoryId?: string,
    search?: string
  ): Promise<{
    success: boolean;
    data?: ProductPagination;
    message?: string;
  }> => {
    try {
      // Xây dựng query params
      const params: Record<string, string | number> = { page, limit };
      if (categoryId) params.categoryId = categoryId;
      if (search) params.search = search;

      const response = await apiClient.get("/", { params });
      const result = response.data;

      // Convert backend format -> app format
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            products: result.data, // backend trả về data là mảng Product[]
            pagination: {
              total: result.total,
              totalPages: result.totalPages,
              page: result.currentPage,
            },
          },
        };
      }

      return {
        success: false,
        message: result.message || "Không thể tải sản phẩm",
      };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || "Lỗi kết nối server",
        };
      }
      throw error;
    }
  },

  /**
   * Lấy thông tin một sản phẩm theo ID
   * @param productId - ID của sản phẩm
   */
  getProductById: async (
    productId: string
  ): Promise<ApiResponse<Product>> => {
    try {
      const response = await apiClient.get(`/${productId}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },

  /**
   * Lấy thông tin một sản phẩm theo slug (URL thân thiện)
   * @param slug - Slug của sản phẩm
   */
  getProductBySlug: async (
    slug: string
  ): Promise<ApiResponse<Product>> => {
    try {
      const response = await apiClient.get(`/slug/${slug}`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw error;
    }
  },
};

/**
 * ============================================================
 * HÀM TIỆN ÍCH (Helper Functions)
 * ============================================================
 */

/**
 * Format giá tiền VND
 * Ví dụ: 29990000 -> "29.990.000đ"
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString("vi-VN") + "đ";
};

/**
 * Lấy URL hình ảnh chính của sản phẩm
 * Ưu tiên: isPrimary = true > image đầu tiên > placeholder
 */
export const getProductImageUrl = (product: Product): string => {
  if (!product.images || product.images.length === 0) {
    return ""; // Không có hình -> để Image component tự xử lý placeholder
  }

  // Tìm hình ảnh chính (isPrimary = true)
  const primaryImage = product.images.find((img) => img.isPrimary);
  if (primaryImage) return primaryImage.imageUrl;

  // Lấy hình đầu tiên
  return product.images[0]?.imageUrl || "";
};

/**
 * Kiểm tra sản phẩm sắp hết hàng
 * Sắp hết = stock > 0 && stock <= 5
 */
export const isLowStock = (product: Product): boolean => {
  return product.stock > 0 && product.stock <= 5;
};

/**
 * Kiểm tra sản phẩm hết hàng
 */
export const isOutOfStock = (product: Product): boolean => {
  return product.stock <= 0;
};
