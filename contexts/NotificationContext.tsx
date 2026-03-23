import { API_BASE_URL } from "@/config/config";
import {
    Notification,
    NotificationPagination,
    notificationService,
} from "@/services/notificationService";
import { TokenManager } from "@/utils/tokenManager";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  pagination: NotificationPagination | null;
  fetchNotifications: (page?: number) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<NotificationPagination | null>(
    null,
  );

  const socketRef = useRef<Socket | null>(null);
  const currentTokenRef = useRef<string | null>(null);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const clearNotificationState = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setPagination(null);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = await TokenManager.getToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("refreshUnreadCount error:", error);
    }
  }, []);

  const fetchNotifications = useCallback(
    async (page: number = 1) => {
      try {
        const token = await TokenManager.getToken();
        if (!token) {
          clearNotificationState();
          return;
        }

        if (page === 1) {
          if (notifications.length > 0) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        } else {
          setLoading(true);
        }

        const response = await notificationService.getNotifications(page, 20);

        setPagination(response.pagination);
        setNotifications((prev) => {
          if (page === 1) {
            return response.data;
          }

          const existingIds = new Set(prev.map((item) => item._id));
          const merged = [
            ...prev,
            ...response.data.filter((item) => !existingIds.has(item._id)),
          ];
          return merged;
        });
      } catch (error) {
        console.error("fetchNotifications error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clearNotificationState, notifications.length],
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!pagination) {
      return;
    }

    if (loading || refreshing) {
      return;
    }

    if (pagination.page >= pagination.totalPages) {
      return;
    }

    await fetchNotifications(pagination.page + 1);
  }, [fetchNotifications, loading, pagination, refreshing]);

  const markAsRead = useCallback(
    async (id: string) => {
      const currentNotification = notifications.find((item) => item._id === id);
      if (!currentNotification || currentNotification.isRead) {
        return;
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(id);
        if (socketRef.current?.connected) {
          socketRef.current.emit("mark_notification_read", {
            notificationId: id,
          });
        }
      } catch (error) {
        console.error("markAsRead error:", error);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === id
              ? {
                  ...item,
                  isRead: false,
                }
              : item,
          ),
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("markAllAsRead error:", error);
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((item) => item._id === id);
      const previousNotifications = notifications;

      setNotifications((prev) => prev.filter((item) => item._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationService.deleteNotification(id);
      } catch (error) {
        console.error("deleteNotification error:", error);
        setNotifications(previousNotifications);
        if (target && !target.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    },
    [notifications],
  );

  const clearReadNotifications = useCallback(async () => {
    const previousNotifications = notifications;

    setNotifications((prev) => prev.filter((item) => !item.isRead));

    try {
      await notificationService.clearReadNotifications();
    } catch (error) {
      console.error("clearReadNotifications error:", error);
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  useEffect(() => {
    let cancelled = false;

    const initializeNotificationSystem = async () => {
      try {
        const token = await TokenManager.getToken();

        if (cancelled) {
          return;
        }

        if (!token) {
          currentTokenRef.current = null;
          disconnectSocket();
          clearNotificationState();
          return;
        }

        currentTokenRef.current = token;

        await refreshUnreadCount();

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        const socket = io(API_BASE_URL, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("new_notification", (notification: Notification) => {
          setNotifications((prev) => {
            const existed = prev.some((item) => item._id === notification._id);
            if (existed) {
              return prev;
            }
            return [notification, ...prev];
          });

          if (!notification.isRead) {
            setUnreadCount((prev) => prev + 1);
          }
        });

        socketRef.current = socket;
      } catch (error) {
        console.error("initializeNotificationSystem error:", error);
      }
    };

    initializeNotificationSystem();

    const authWatcher = setInterval(async () => {
      const latestToken = await TokenManager.getToken();

      if (!latestToken && currentTokenRef.current) {
        currentTokenRef.current = null;
        disconnectSocket();
        clearNotificationState();
      }

      if (latestToken && latestToken !== currentTokenRef.current) {
        currentTokenRef.current = latestToken;
        initializeNotificationSystem();
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(authWatcher);
      disconnectSocket();
    };
  }, [clearNotificationState, disconnectSocket, refreshUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshing,
    pagination,
    fetchNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }

  return context;
};
