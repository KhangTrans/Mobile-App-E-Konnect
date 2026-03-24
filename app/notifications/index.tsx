import { useNotification } from "@/contexts/NotificationContext";
import { Notification, NotificationType } from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND_COLOR = "#26C6DA";
const UNREAD_BG = "#E0F7FA";
type NotificationIcon = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
};

const DEFAULT_ICON: NotificationIcon = {
  name: "star-outline",
  color: "#EAB308",
};
const ICON_BY_TYPE: Partial<Record<NotificationType, NotificationIcon>> = {
  PAYMENT_CONFIRMED: { name: "card-outline", color: "#16A34A" },
  NEW_MESSAGE: { name: "chatbubble-ellipses-outline", color: "#7C3AED" },
  SYSTEM: { name: "notifications-outline", color: "#F97316" },
  REVIEW_CREATED: { ...DEFAULT_ICON },
  REVIEW_REPLY: { ...DEFAULT_ICON },
};

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const target = new Date(dateString);
  const diffMs = now.getTime() - target.getTime();

  if (diffMs < 60 * 1000) {
    return "vừa xong";
  }

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return `${minutes} phút trước`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ trước`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const getNotificationIcon = (type: NotificationType): NotificationIcon => {
  if (type.startsWith("ORDER_")) {
    return { name: "cube-outline", color: BRAND_COLOR };
  }

  return ICON_BY_TYPE[type] ?? DEFAULT_ICON;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const {
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
    refreshUnreadCount,
  } = useNotification();

  useEffect(() => {
    fetchNotifications(1);
    refreshUnreadCount();
  }, [fetchNotifications, refreshUnreadCount]);

  const handlePressItem = useCallback(
    async (item: Notification) => {
      if (!item.isRead) {
        await markAsRead(item._id);
      }

      if (item.orderId) {
        router.push("/orders/history");
      }
    },
    [markAsRead, router],
  );

  const handleLongPressItem = useCallback(
    (item: Notification) => {
      Alert.alert("Xóa thông báo", "Bạn có chắc muốn xóa thông báo này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            deleteNotification(item._id);
          },
        },
      ]);
    },
    [deleteNotification],
  );

  const renderItem = ({ item }: { item: Notification }) => {
    const iconConfig = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePressItem(item)}
        onLongPress={() => handleLongPressItem(item)}
        style={[
          styles.notificationCard,
          { backgroundColor: item.isRead ? "#FFFFFF" : UNREAD_BG },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
        </View>

        <View style={styles.contentWrapper}>
          <Text
            style={[styles.title, { fontWeight: item.isRead ? "600" : "700" }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.timeText}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listEmptyComponent = (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={52} color="#94A3B8" />
      <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
      <Text style={styles.emptySubTitle}>
        Khi có cập nhật mới, bạn sẽ thấy tại đây.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thông Báo</Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.readAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.85}
          >
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readAllPlaceholder} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 ? styles.emptyListContent : undefined,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotifications(1)}
            colors={[BRAND_COLOR]}
            tintColor={BRAND_COLOR}
          />
        }
        ListEmptyComponent={!loading ? listEmptyComponent : null}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (
            !loading &&
            pagination &&
            pagination.page < pagination.totalPages
          ) {
            loadMoreNotifications();
          }
        }}
        ListFooterComponent={
          loading && notifications.length > 0 ? (
            <Text style={styles.loadingText}>Đang tải thêm...</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    height: 86,
    backgroundColor: BRAND_COLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  readAllButton: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readAllText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  readAllPlaceholder: {
    width: 72,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 10,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  notificationCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contentWrapper: {
    flex: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 15,
  },
  message: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 7,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 12,
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubTitle: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
});
