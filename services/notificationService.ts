import { API_BASE_URL } from "@/config/config";
import { TokenManager } from "@/utils/tokenManager";
import axios from "axios";

export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPING"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PAYMENT_CONFIRMED"
  | "NEW_MESSAGE"
  | "SYSTEM"
  | "REVIEW_CREATED"
  | "REVIEW_REPLY";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: NotificationPagination;
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

const NOTIFICATION_API = `${API_BASE_URL}/api/notifications`;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await TokenManager.getToken();

  if (!token) {
    throw new Error("Người dùng chưa đăng nhập");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const withAuth = async () => ({ headers: await getAuthHeaders() });

const withOptionalAuth = async () => {
  const token = await TokenManager.getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const notificationService = {
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    isRead?: boolean,
  ): Promise<NotificationsResponse> => {
    const params: { page: number; limit: number; isRead?: string } = {
      page,
      limit,
    };

    if (typeof isRead === "boolean") {
      params.isRead = String(isRead);
    }

    const response = await axios.get<NotificationsResponse>(NOTIFICATION_API, {
      ...(await withAuth()),
      params,
    });

    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${NOTIFICATION_API}/unread-count`,
        await withOptionalAuth(),
      );

      return response.data.data.count;
    } catch (error) {
      console.error("getUnreadCount error:", error);
      return 0;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    await axios.put(`${NOTIFICATION_API}/${id}/read`, {}, await withAuth());
  },

  markAllAsRead: async (): Promise<void> => {
    await axios.put(`${NOTIFICATION_API}/read-all`, {}, await withAuth());
  },

  deleteNotification: async (id: string): Promise<void> => {
    await axios.delete(`${NOTIFICATION_API}/${id}`, await withAuth());
  },

  clearReadNotifications: async (): Promise<void> => {
    await axios.delete(`${NOTIFICATION_API}/clear-read`, await withAuth());
  },
};
