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
import { useCartContext } from "@/contexts/CartContext";
import { addressService, productService, getProductImageUrl } from "@/services";
import { orderService } from "@/services/orderService";
import { TokenManager } from "@/utils/tokenManager";
import { cartService, CartData } from "@/services/cartService";
import AddressSelectionModal from "@/components/checkout/AddressSelectionModal";
import type { CustomerAddress } from "@/services/addressService";

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingWard: string;
}

const DEFAULT_SHIPPING_FEE = 30000;

const formatCurrency = (value: number): string => {
  return `${value.toLocaleString("vi-VN")}đ`;
};

const getShippingFee = (subtotal: number): number => {
  return subtotal >= 500000 ? 0 : DEFAULT_SHIPPING_FEE;
};

export default function CartCheckoutScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { clearCartCount } = useCartContext();

  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [form, setForm] = useState<CheckoutForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingDistrict: "",
    shippingWard: "",
  });

  useEffect(() => {
    const initCheckout = async () => {
      setLoading(true);

      try {
        const token = await TokenManager.getToken();
        if (!token) {
          alert.showWarning("Cần đăng nhập", "Vui lòng đăng nhập để thanh toán đơn hàng.");
          router.replace("/(auth)/login");
          return;
        }

        const [cartRes, userData, defaultAddressRes] = await Promise.all([
          cartService.getCart(),
          TokenManager.getUserData(),
          addressService.getDefaultAddress(),
        ]);

        let defaultAddr = defaultAddressRes.success ? defaultAddressRes.data : null;
        if (!defaultAddr) {
          // Fallback to first address if no default address is explicitly set
          const allAddrRes = await addressService.getAddresses();
          if (allAddrRes.success && allAddrRes.data?.length) {
            defaultAddr = allAddrRes.data[0];
          }
        }

        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }

        if (!cartRes.success || !cartRes.data || !cartRes.data.items?.length) {
          alert.showError("Lỗi", "Giỏ hàng trống.");
          router.back();
          return;
        }

        setCartData(cartRes.data);

        setForm((prev) => ({
          ...prev,
          customerName: userData?.fullName || userData?.username || "",
          customerEmail: userData?.email || "",
          customerPhone: defaultAddr ? defaultAddr.phoneNumber : "",
          shippingAddress: defaultAddr ? defaultAddr.address : "",
          shippingCity: defaultAddr ? defaultAddr.city : "",
          shippingDistrict: defaultAddr ? defaultAddr.district || "" : "",
          shippingWard: defaultAddr ? defaultAddr.ward || "" : "",
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
  }, [alert, router]);

  // Handle derived cart state from response
  // Since cart API returns cart object and summary conditionally based on backend
  const subtotal = useMemo(() => {
    // If the data is parsed as { items: [] } directly
    if (cartData?.items) {
      return cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    return 0;
  }, [cartData]);

  const shippingFee = useMemo(() => getShippingFee(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + shippingFee, [shippingFee, subtotal]);

  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddress(address);
    setForm((prev) => ({
      ...prev,
      customerName: address.fullName,
      customerPhone: address.phoneNumber,
      shippingAddress: address.address,
      shippingCity: address.city,
      shippingDistrict: address.district || "",
      shippingWard: address.ward || "",
    }));
    setShowAddressModal(false);
  };

  const updateForm = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    if (!cartData || !cartData.items?.length) {
      alert.showError("Lỗi", "Giỏ hàng của bạn đang trống.");
      return false;
    }

    if (!selectedAddress) {
      alert.showError("Thiếu địa chỉ", "Vui lòng chọn địa chỉ giao hàng.");
      return false;
    }

    if (!form.customerEmail.trim()) {
      alert.showError("Thiếu thông tin", "Vui lòng nhập email.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await orderService.checkoutCart({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        shippingCity: form.shippingCity.trim(),
        shippingDistrict: form.shippingDistrict.trim() || undefined,
        shippingWard: form.shippingWard.trim() || undefined,
        paymentMethod: "cod",
      });

      if (response.success && response.data) {
        clearCartCount();
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

      alert.showError("Đặt hàng thất bại", response.message || "Không thể tạo đơn hàng COD từ giỏ hàng.");
    } catch (error: any) {
      console.error("Create Cart COD order error:", error);
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

  if (!cartData || cartData.items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm trong giỏ hàng để thanh toán.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Quay lại giỏ hàng</Text>
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
          <Text style={styles.cardTitle}>Sản phẩm trong giỏ</Text>
          {cartData.items.map((item, index) => {
            const activeProduct = typeof item.productId === 'object' ? item.productId : null;
            const name = activeProduct?.name || 'Sản phẩm không rõ';
            
            // Lấy ảnh hiển thị
            let imageUri = 'https://via.placeholder.com/84';
            if (activeProduct) {
              imageUri = getProductImageUrl(activeProduct as any);
            }
            
            return (
              <View style={styles.productRow} key={item._id || index}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.productStock}>Số lượng: {item.quantity}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Thông tin nhận hàng</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)}>
              <Text style={styles.changeAddressText}>Thay đổi</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.selectedAddressBox}>
              <View style={styles.addressHeaderLeft}>
                <Ionicons name="location-sharp" size={20} color="#EE4D2D" />
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <Text style={styles.addressPhone}> | {selectedAddress.phoneNumber}</Text>
              </View>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              <Text style={styles.addressText}>
                {[selectedAddress.ward, selectedAddress.district, selectedAddress.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectAddressBtn} onPress={() => setShowAddressModal(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#EE4D2D" />
              <Text style={styles.selectAddressText}>Chọn địa chỉ nhận hàng</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.customerEmail}
            onChangeText={(value) => updateForm("customerEmail", value)}
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

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelect={handleSelectAddress}
        selectedAddressId={selectedAddress?._id}
      />
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EE4D2D",
    paddingBottom: 12,
  },
  selectedAddressBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  addressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: "#64748B",
  },
  addressText: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 24,
    lineHeight: 20,
  },
  selectAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#EE4D2D",
    backgroundColor: "#FFF8F6",
    marginBottom: 16,
    gap: 8,
  },
  selectAddressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EE4D2D",
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
