import axios from 'axios';
import { API_BASE_URL } from '@/config/config';
import { TokenManager } from '@/utils/tokenManager';

export interface ProductInCart {
  _id: string;
  name: string;
  price: number;
  images: { imageUrl: string }[];
}

export interface CartItemType {
  _id: string; // itemId
  productId: ProductInCart | string;
  quantity: number;
  price: number;
}

export interface CartData {
  _id: string;
  userId: string;
  items: CartItemType[];
  totalPrice: number;
}

// Hàm hỗ trợ lấy Header
const getAuthHeaders = async () => {
  const token = await TokenManager.getToken();
  if (!token) throw new Error("Vui lòng đăng nhập để tiếp tục");
  return {
    Authorization: `Bearer ${token}`
  };
};

export const cartService = {
  // Lấy danh sách sản phẩm
  getCart: async (): Promise<{ success: boolean; data?: CartData; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/cart`, { headers });
      
      // Backend trả về: { success: true, data: { cart: { items: [] }, summary: {} } }
      const responseData = response.data.data || response.data;
      return { 
        success: true, 
        data: responseData.cart || responseData 
      };
    } catch (error: any) {
      console.warn("Lấy giỏ hàng thất bại:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Không thể lấy giỏ hàng' 
      };
    }
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (productId: string, quantity: number = 1): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${API_BASE_URL}/api/cart`, {
        productId,
        quantity
      }, { headers });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.warn("Thêm giỏ hàng thất bại:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Lỗi thêm sản phẩm' 
      };
    }
  },

  // Thay đổi số lượng của 1 Item (Dùng itemId)
  updateCartItem: async (itemId: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${API_BASE_URL}/api/cart/${itemId}`, { quantity }, { headers });
      return { success: true };
    } catch (error: any) {
      console.warn("Cập nhật giỏ hàng thất bại:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Lỗi cập nhật số lượng' 
      };
    }
  },

  // Xóa một Item khỏi giỏ hàng
  removeCartItem: async (itemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/api/cart/${itemId}`, { headers });
      return { success: true };
    } catch (error: any) {
      console.warn("Xóa sản phẩm thất bại:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Lỗi xóa sản phẩm' 
      };
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/api/cart`, { headers });
      return { success: true };
    } catch (error: any) {
      console.warn("Xóa toàn bộ giỏ hàng thất bại:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Lỗi xóa giỏ hàng' 
      };
    }
  }
};
