import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAlert } from "@/contexts/AlertContext";
import { orderService, type Order, type OrderStatus } from "@/services/orderService";

type TabFilter = "all" | OrderStatus;

const TABS: Array<{ key: TabFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipping", label: "Vận chuyển" },
  { key: "delivered", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const formatCurrency = (value: number): string => {
  return `${value.toLocaleString("vi-VN")}đ`;
};

export default function OrdersHistoryScreen() {
  const router = useRouter();
  const alert = useAlert();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (tab: TabFilter, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await orderService.getMyOrders({
          status: tab === "all" ? undefined : tab,
          page: 1,
          limit: 30,
        });

        if (response.success && response.data) {
          setOrders(response.data);
          return;
        }

        setOrders([]);
        alert.showError("Lỗi", response.message || "Không thể tải lịch sử đơn hàng.");
      } catch (error: any) {
        console.error("Get order history error:", error);
        setOrders([]);
        alert.showError(
          "Lỗi kết nối",
          error?.response?.data?.message || "Không thể kết nối máy chủ.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [alert],
  );

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);

  const onRefresh = () => {
    fetchOrders(activeTab, true);
  };

  const emptyMessage = useMemo(() => {
    if (activeTab === "all") return "Bạn chưa có đơn hàng nào.";
    return "Không có đơn hàng ở trạng thái này.";
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#26C6DA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn đã mua</Text>
        <View style={styles.rightIcons}>
          <Ionicons name="search-outline" size={22} color="#26C6DA" />
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#26C6DA" />
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <FlatList
          data={TABS}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
                {active && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#26C6DA" />
          <Text style={styles.stateText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#26C6DA"]} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="file-tray-outline" size={42} color="#9CA3AF" />
              <Text style={styles.stateText}>{emptyMessage}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPressDetail={() => {}} />
          )}
        />
      )}
    </View>
  );
}

function OrderCard({
  order,
  onPressDetail,
}: {
  order: Order;
  onPressDetail: () => void;
}) {
  const firstItem = order.items?.[0];

  return (
    <View style={styles.card}>
      <View style={styles.shopRow}>
        <View style={styles.shopLeft}>
          <Ionicons name="storefront-outline" size={16} color="#6B7280" />
          <Text style={styles.shopName}>{firstItem?.productName || "Cửa hàng"}</Text>
        </View>
        <Text style={styles.statusText}>{STATUS_TEXT[order.orderStatus]}</Text>
      </View>

      <View style={styles.productRow}>
        <Image
          source={{ uri: firstItem?.productImage || "https://via.placeholder.com/120" }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text numberOfLines={2} style={styles.productName}>
            {firstItem?.productName || "Sản phẩm"}
          </Text>
          <Text style={styles.productMeta}>x{firstItem?.quantity || 0}</Text>
          <Text style={styles.productPrice}>{formatCurrency(order.total)}</Text>
        </View>
      </View>

      <Text style={styles.totalText}>
        Tổng số tiền ({order.items?.length || 0} sản phẩm): <Text style={styles.totalPrice}>{formatCurrency(order.total)}</Text>
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onPressDetail}>
          <Text style={styles.secondaryBtnText}>Xem chi tiết</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onPressDetail}>
          <Text style={styles.primaryBtnText}>Mua lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tabsWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  tabsContent: {
    paddingHorizontal: 6,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#26C6DA",
    fontWeight: "700",
  },
  tabUnderline: {
    marginTop: 8,
    height: 3,
    width: "100%",
    backgroundColor: "#26C6DA",
    borderRadius: 3,
  },
  listContent: {
    padding: 10,
    gap: 10,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  stateText: {
    marginTop: 10,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 10,
  },
  shopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  shopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusText: {
    color: "#26C6DA",
    fontSize: 16,
    fontWeight: "600",
  },
  productRow: {
    flexDirection: "row",
    gap: 10,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "500",
  },
  productMeta: {
    color: "#6B7280",
  },
  productPrice: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    textAlign: "right",
  },
  totalText: {
    marginTop: 12,
    textAlign: "right",
    color: "#374151",
    fontSize: 17,
  },
  totalPrice: {
    color: "#111827",
    fontWeight: "800",
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#26C6DA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFEFF",
  },
  primaryBtnText: {
    color: "#26C6DA",
    fontSize: 14,
    fontWeight: "700",
  },
});
