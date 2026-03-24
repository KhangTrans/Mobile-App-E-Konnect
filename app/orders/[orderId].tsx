import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAlert } from "@/contexts/AlertContext";
import { orderService, type Order, type OrderStatus } from "@/services/orderService";

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const formatCurrency = (value: number): string => `${value.toLocaleString("vi-VN")}đ`;

const formatDateTime = (value: string): string => {
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { orderId } = useLocalSearchParams<{ orderId?: string | string[] }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizedOrderId = useMemo(() => {
    if (!orderId) return "";
    return Array.isArray(orderId) ? orderId[0] : orderId;
  }, [orderId]);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!normalizedOrderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await orderService.getOrderById(normalizedOrderId);

        if (response.success && response.data) {
          setOrder(response.data);
          return;
        }

        setOrder(null);
        alert.showError("Lỗi", response.message || "Không thể tải chi tiết đơn hàng.");
      } catch (error: any) {
        console.error("Get order detail error:", error);
        setOrder(null);
        alert.showError(
          "Lỗi kết nối",
          error?.response?.data?.message || "Không thể kết nối máy chủ.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [alert, normalizedOrderId]);

  if (loading) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator size="large" color="#26C6DA" />
        <Text style={styles.stateText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top + 24 }]}>
        <Ionicons name="file-tray-outline" size={44} color="#9CA3AF" />
        <Text style={styles.stateText}>Không tìm thấy thông tin đơn hàng.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#26C6DA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Mã đơn</Text>
            <Text style={styles.value}>#{order.orderNumber}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Trạng thái</Text>
            <Text style={styles.statusText}>{STATUS_TEXT[order.orderStatus]}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Thanh toán</Text>
            <Text style={styles.value}>{order.paymentMethod.toUpperCase()} - {order.paymentStatus}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Ngày đặt</Text>
            <Text style={styles.value}>{formatDateTime(order.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>
          <Text style={styles.infoText}>{order.customerName} - {order.customerPhone}</Text>
          <Text style={styles.infoText}>{order.customerEmail}</Text>
          <Text style={styles.infoText}>
            {order.shippingAddress}, {order.shippingWard || ""}
            {order.shippingWard ? ", " : ""}
            {order.shippingDistrict || ""}
            {order.shippingDistrict ? ", " : ""}
            {order.shippingCity}
          </Text>
          {!!order.shippingNote && (
            <Text style={styles.noteText}>Ghi chú: {order.shippingNote}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {order.items.map((item, index) => (
            <View key={`${item.productName}-${index}`} style={styles.itemRow}>
              <Image
                source={{ uri: item.productImage || "https://via.placeholder.com/120" }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                <Text style={styles.itemMeta}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tổng thanh toán</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Tạm tính</Text>
            <Text style={styles.value}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Phí vận chuyển</Text>
            <Text style={styles.value}>{formatCurrency(order.shippingFee)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Giảm giá</Text>
            <Text style={styles.value}>- {formatCurrency(order.discount)}</Text>
          </View>
          <View style={[styles.rowBetween, styles.totalRow]}>
            <Text style={styles.totalLabel}>Thành tiền</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
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
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  content: {
    padding: 12,
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    color: "#6B7280",
    fontSize: 14,
  },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
  statusText: {
    color: "#26C6DA",
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    color: "#111827",
    fontSize: 14,
  },
  noteText: {
    marginTop: 4,
    color: "#374151",
    fontSize: 14,
    fontStyle: "italic",
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 6,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  itemMeta: {
    color: "#6B7280",
    fontSize: 13,
  },
  itemPrice: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  backHomeBtn: {
    marginTop: 16,
    backgroundColor: "#26C6DA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
