import axios, { AxiosError } from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../config/config";

/**
 * Banner Service - Manages marketing banners and promotion data
 */

const BANNER_API = `${API_BASE_URL}`;

const apiClient = axios.create({
  baseURL: BANNER_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  active: boolean;
  products?: BannerProduct[];
}

export interface BannerProduct {
  id: string;
  _id: string;
  name: string;
  price: number;
  discountedPrice: number;
  imageUrl?: string;
}

export interface BannerResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export const bannerService = {
  /**
   * Fetch all active marketing banners
   */
  getActiveBanners: async (): Promise<BannerResponse<Banner[]>> => {
    try {
      const resp = await apiClient.get<BannerResponse<Banner[]>>(
        API_ENDPOINTS.BANNERS.ACTIVE
      );
      return resp.data;
    } catch (error) {
      console.error("Fetch banners failed:", error);
      return { success: false, data: [] };
    }
  },

  /**
   * Fetch detail of a specific banner including products
   */
  getBannerDetail: async (id: string): Promise<BannerResponse<Banner | null>> => {
    try {
      const resp = await apiClient.get<BannerResponse<Banner>>(
        API_ENDPOINTS.BANNERS.DETAIL(id)
      );
      return resp.data;
    } catch (error) {
      console.error(`Fetch banner ${id} detail failed:`, error);
      return { success: false, data: null };
    }
  },
};
