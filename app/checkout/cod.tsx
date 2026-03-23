import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAlert } from "@/contexts/AlertContext";
import { addressService, productService, getProductImageUrl } from "@/services";
import { orderService } from "@/services/orderService";
import { TokenManager } from "@/utils/tokenManager";
import type { Product } from "@/services/productService";

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingNote: string;
}

const DEFAULT_SHIPPING_FEE = 30000;

const formatCurrency = (value: number): string => {
  return `${value.toLocaleString("vi-VN")}đ`;
};

const getShippingFee = (subtotal: number): number => {
  return subtotal >= 500000 ? 0 : DEFAULT_SHIPPING_FEE;
};

export default function CodCheckoutScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { productId, quantity } = useLocalSearchParams<{
    productId?: string;
    quantity?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CheckoutForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingDistrict: "",
    shippingWard: "",
    shippingNote: "",
  });

  useEffect(() => {
    const initCheckout = async () => {
      if (!productId) {
        alert.showError("Thiếu dữ liệu", "Không xác định được sản phẩm cần thanh toán.");
        router.back();
        return;
      }

      const parsedQuantity = Number(quantity);
      const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? Math.floor(parsedQuantity) : 1;

      setLoading(true);
      setItemQuantity(safeQuantity);

      try {
        const token = await TokenManager.getToken();
        if (!token) {
          alert.showWarning("Cần đăng nhập", "Vui lòng đăng nhập để thanh toán đơn hàng.");
          router.replace("/(auth)/login");
          return;
        }

        const [productRes, userData, defaultAddressRes] = await Promise.all([
          productService.getProductById(productId),
          TokenManager.getUserData(),
          addressService.getDefaultAddress(),
        ]);

        if (!productRes.success || !productRes.data) {
          alert.showError("Lỗi", "Không tải được thông tin sản phẩm.");
          router.back();
          return;
        }

        const loadedProduct = productRes.data;
        setProduct(loadedProduct);
        setItemQuantity((prev) => Math.min(prev, Math.max(1, loadedProduct.stock)));

        setForm((prev) => ({
          ...prev,
          customerName: userData?.fullName || userData?.username || "",
          customerEmail: userData?.email || "",
          customerPhone: defaultAddressRes.success && defaultAddressRes.data ? defaultAddressRes.data.phoneNumber : "",
          shippingAddress: defaultAddressRes.success && defaultAddressRes.data ? defaultAddressRes.data.address : "",
          shippingCity: defaultAddressRes.success && defaultAddressRes.data ? defaultAddressRes.data.city : "",
          shippingDistrict: defaultAddressRes.success && defaultAddressRes.data ? defaultAddressRes.data.district || "" : "",
          shippingWard: defaultAddressRes.success && defaultAddressRes.data ? defaultAddressRes.data.ward || "" : "",
        }));
      } catch (error) {
        console.error("Init checkout error:", error);
        alert.showError("Lỗi", "Không thể khởi tạo thông tin thanh toán.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [alert, productId, quantity, router]);

  const subtotal = useMemo(() => {
    if (!product) return 0;
    return product.price * itemQuantity;
  }, [product, itemQuantity]);

  const shippingFee = useMemo(() => getShippingFee(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + shippingFee, [shippingFee, subtotal]);

  const updateForm = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const decreaseQuantity = () => {
    setItemQuantity((prev) => Math.max(1, prev - 1));
  };

  const increaseQuantity = () => {
    if (!product) return;
    setItemQuantity((prev) => Math.min(product.stock, prev + 1));
  };

  const validateForm = (): boolean => {
    if (!product) {
      alert.showError("Lỗi", "Không có thông tin sản phẩm để thanh toán.");
      return false;
    }

    if (product.stock <= 0) {
      alert.showError("Hết hàng", "Sản phẩm hiện đã hết hàng.");
      return false;
    }

    if (itemQuantity > product.stock) {
      alert.showError("Vượt tồn kho", `Số lượng tối đa còn lại là ${product.stock}.`);
      return false;
    }

    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.customerPhone.trim()) {
      alert.showError("Thiếu thông tin", "Vui lòng nhập đầy đủ tên, email và số điện thoại.");
      return false;
    }

    if (!form.shippingAddress.trim() || !form.shippingCity.trim()) {
      alert.showError("Thiếu địa chỉ", "Vui lòng nhập địa chỉ và tỉnh/thành phố giao hàng.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!productId || !validateForm()) return;

    setSubmitting(true);
    try {
      const response = await orderService.buyNow({
        productId,
        quantity: itemQuantity,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        shippingCity: form.shippingCity.trim(),
        shippingDistrict: form.shippingDistrict.trim() || undefined,
        shippingWard: form.shippingWard.trim() || undefined,
        shippingNote: form.shippingNote.trim() || undefined,
        paymentMethod: "cod",
      });

      if (response.success && response.data) {
        router.replace({
          pathname: "/orders/success",
          params: {
            orderNumber: response.data.orderNumber,
            paymentStatus: response.data.paymentStatus,
            total: String(response.data.total),
          },
        });
        return;
      }

      alert.showError("Đặt hàng thất bại", response.message || "Không thể tạo đơn hàng COD.");
    } catch (error: any) {
      console.error("Create COD order error:", error);
      alert.showError(
        "Lỗi kết nối",
        error?.response?.data?.message || "Không thể kết nối tới máy chủ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#26C6DA" />
        <Text style={styles.loadingText}>Đang chuẩn bị thông tin thanh toán...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm để thanh toán.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={22} color="#1E3A5F" />
          <Text style={styles.headerBackText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán COD</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sản phẩm</Text>
          <View style={styles.productRow}>
            <Image
              source={{ uri: getProductImageUrl(product) || "https://via.placeholder.com/120" }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
              <Text style={styles.productStock}>Còn lại: {product.stock}</Text>
            </View>
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.inputLabel}>Số lượng</Text>
            <View style={styles.quantityBox}>
              <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                <Ionicons name="remove" size={18} color="#1E3A5F" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{itemQuantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                <Ionicons name="add" size={18} color="#1E3A5F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin nhận hàng</Text>

          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nguyễn Văn A"
            value={form.customerName}
            onChangeText={(value) => updateForm("customerName", value)}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.customerEmail}
            onChangeText={(value) => updateForm("customerEmail", value)}
          />

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="0912345678"
            keyboardType="phone-pad"
            value={form.customerPhone}
            onChangeText={(value) => updateForm("customerPhone", value)}
          />

          <Text style={styles.inputLabel}>Địa chỉ</Text>
          <TextInput
            style={styles.input}
            placeholder="Số nhà, tên đường"
            value={form.shippingAddress}
            onChangeText={(value) => updateForm("shippingAddress", value)}
          />

          <Text style={styles.inputLabel}>Tỉnh / Thành phố</Text>
          <TextInput
            style={styles.input}
            placeholder="TP. Ho Chi Minh"
            value={form.shippingCity}
            onChangeText={(value) => updateForm("shippingCity", value)}
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Quận / Huyện</Text>
              <TextInput
                style={styles.input}
                placeholder="Tùy chọn"
                value={form.shippingDistrict}
                onChangeText={(value) => updateForm("shippingDistrict", value)}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Phường / Xã</Text>
              <TextInput
                style={styles.input}
                placeholder="Tùy chọn"
                value={form.shippingWard}
                onChangeText={(value) => updateForm("shippingWard", value)}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Ví dụ: giao giờ hành chính"
            multiline
            value={form.shippingNote}
            onChangeText={(value) => updateForm("shippingNote", value)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethodBox}>
            <Ionicons name="cash-outline" size={20} color="#26C6DA" />
            <View>
              <Text style={styles.paymentMethodTitle}>Thanh toán khi nhận hàng (COD)</Text>
              <Text style={styles.paymentMethodDesc}>Bạn chỉ thanh toán khi đơn được giao tận nơi.</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tóm tắt đơn hàng</Text>
          <SummaryRow label="Tạm tính" value={formatCurrency(subtotal)} />
          <SummaryRow
            label="Phí vận chuyển"
            value={shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}
          />
          <View style={styles.summaryDivider} />
          <SummaryRow label="Tổng thanh toán" value={formatCurrency(total)} highlight />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.footerAction}>
        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Đặt hàng COD</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, highlight && styles.summaryLabelHighlight]}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A5F",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 12,
  },
  productRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  productPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
    color: "#26C6DA",
  },
  productStock: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    overflow: "hidden",
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  quantityText: {
    width: 44,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  inputLabel: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  noteInput: {
    minHeight: 84,
    textAlignVertical: "top",
    marginBottom: 0,
  },
  paymentMethodBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#ECFEFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A5F3FC",
    padding: 12,
    alignItems: "flex-start",
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  paymentMethodDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 6,
  },
  summaryLabelHighlight: {
    color: "#0F172A",
    fontWeight: "700",
  },
  summaryValueHighlight: {
    fontSize: 18,
    color: "#0E7490",
    fontWeight: "800",
  },
  footerAction: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#26C6DA",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#1E3A5F",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
