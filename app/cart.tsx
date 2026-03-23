import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cartService, CartItemType } from '@/services/cartService';
import { TokenManager } from '@/utils/tokenManager';
import { formatPrice } from '@/services/productService'; // Utility format tiền VND
import CartItem from '@/components/cart/CartItem'; 
import { useAlert } from '@/contexts/AlertContext';
import { useCartContext } from '@/contexts/CartContext';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const alert = useAlert();
  const { fetchCartCount } = useCartContext();

  // Mảng dữ liệu chứa giỏ hàng
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  
  // Trạng thái Loading và Lỗi ứng dụng
  const [loading, setLoading] = useState(true);
  const [errorContext, setErrorContext] = useState<string | null>(null);

  // Debounce refs để quản lý Timer tránh spam API Call
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // ============================================================
  // Lấy dữ liệu giỏ hàng 
  // ============================================================
  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorContext(null);

      // 1. Kiểm tra trạng thái Authentication
      const isLoggedIn = await TokenManager.isLoggedIn();
      if (!isLoggedIn) {
        setErrorContext("Vui lòng đăng nhập để xem giỏ hàng");
        setCartItems([]);
        return;
      }

      // 2. Fetch API
      const response = await cartService.getCart();
      if (response.success && response.data) {
        setCartItems(response.data.items || []);
      } else {
        // Có thể backend gọi rỗng / trống => không báo lỗi
        setCartItems([]);
      }
    } catch (error) {
      setErrorContext("Bị lỗi trong khi tải dữ liệu giỏ hàng.");
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
      fetchCartCount();
    }
  }, [fetchCartCount]);

  useEffect(() => {
    isComponentMounted.current = true;
    fetchCartData();
    return () => {
      isComponentMounted.current = false;
    };
  }, [fetchCartData]);

  // ============================================================
  // Cập nhật số lượng sản phẩm (Debounce)
  // ============================================================
  const handleUpdateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    // 1. Cập nhật UI ngay lập tức
    setCartItems(prev => prev.map(item => item._id === itemId ? { ...item, quantity: newQuantity } : item));

    // 2. Hủy các request cũ đang chờ nếu user spam Click nút [+] [-]
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // 3. Phân luồng API với Timeout (500ms Delay) -> Debounce Mechanism
    updateTimeoutRef.current = setTimeout(async () => {
      const response = await cartService.updateCartItem(itemId, newQuantity);
      if (!response.success) {
        // Rollback nếu Server trả lỗi mạng/vượt quyền/số lượng trong kho báo hết
        alert.showError("Lỗi", "Không thể cập nhật số lượng.");
        fetchCartData(); // Khôi phục trạng thái ban đầu
      }
      fetchCartCount();
    }, 500) as unknown as NodeJS.Timeout;
  }, [fetchCartData, fetchCartCount]);

  // ============================================================
  // Xóa sản phẩm khỏi giỏ
  // ============================================================
  const handleRemoveSingleItem = useCallback(async (itemId: string) => {
    // Tạm xoá trước lên UI cho phản hồi mượt
    setCartItems(prev => prev.filter(item => item._id !== itemId));

    // Gọi Database xoá Item thật
    const response = await cartService.removeCartItem(itemId);
    if (!response.success) {
      alert.showError("Lỗi", response.error || "Có lỗi mạng khi xóa. Vui lòng thử lại!");
      fetchCartData();
    }
    fetchCartCount();
  }, [fetchCartData, fetchCartCount]);

  // ============================================================
  // Tính tổng hoá đơn thanh toán
  // ============================================================
  const calculatedTotalBill = cartItems.reduce((sum, item) => {
    const productPrice = item.price || (typeof item.productId === 'object' ? item.productId.price : 0);
    return sum + (productPrice * item.quantity);
  }, 0);

  // ============================================================
  // UI KHỐI "GIỎ HÀNG TRỐNG" (Empty State Placeholder)
  // ============================================================
  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCircle}>
        <Ionicons name="cart-outline" size={70} color="#26C6DA" />
      </View>
      <Text style={styles.emptyHeader}>Giỏ hàng trống trơn</Text>
      <Text style={styles.emptySub}>Có vẻ như bạn chưa chọn mua bất kỳ mặt hàng nào. Trở lại cửa hàng nào!</Text>
      <TouchableOpacity style={styles.emptyBtnAction} onPress={() => router.push('/(tabs)/products' as any)}>
        <Text style={styles.emptyBtnText}>Tiếp tục mua sắm</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.mainLayout, { paddingTop: insets.top }]}>
      {/* ---------------- Navigation Header ---------------- */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Giỏ Hàng</Text>
        <View style={{ width: 35 }} /> 
      </View>

      {/* ---------------- Core Engine ---------------- */}
      {loading ? (
        <View style={styles.centralBox}>
          <ActivityIndicator size="large" color="#26C6DA" />
          <Text style={styles.systemNote}>Đang đồng bộ dữ liệu...</Text>
        </View>
      ) : errorContext ? (
        <View style={styles.centralBox}>
          <Ionicons name="information-circle-outline" size={60} color="#E63946" />
          <Text style={styles.errLabel}>{errorContext}</Text>
          {errorContext.includes("đăng nhập") ? (
            <TouchableOpacity style={styles.retryAction} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.retryActionLabel}>Thực hiện Đăng nhập</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.retryAction} onPress={fetchCartData}>
              <Text style={styles.retryActionLabel}>Thử Lại Ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={it => it._id}
            contentContainerStyle={styles.listConfig}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartItem 
                item={item}
                onUpdateQuantity={handleUpdateItemQuantity}
                onRemove={handleRemoveSingleItem}
              />
            )}
            ListEmptyComponent={renderEmptyState}
          />

          {/* ---------------- Footer Đáy - Checkout System ---------------- */}
          {cartItems.length > 0 && (
            <View style={[styles.summaryFooter, { paddingBottom: insets.bottom || 24 }]}>
              <View style={styles.summaryBar1}>
                <Text style={styles.sumHeadline}>Tổng thanh toán:</Text>
                <Text style={styles.sumMoneyValue}>{formatPrice(calculatedTotalBill)}</Text>
              </View>

              <TouchableOpacity style={styles.processCheckoutButton} onPress={() => router.push('/checkout/cart-checkout' as any)}>
                <Text style={styles.processCheckoutText}>Tiến hành Đặt Hàng</Text>
                <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ============================================================
// STYLES 
// ============================================================
const styles = StyleSheet.create({
  mainLayout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
    zIndex: 99,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  centralBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  systemNote: {
    marginTop: 15,
    fontSize: 16,
    color: '#64748B',
  },
  errLabel: {
    marginTop: 15,
    fontSize: 16,
    color: '#E63946',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  retryAction: {
    backgroundColor: '#26C6DA',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryActionLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyCircle: {
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  emptyHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  emptySub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 35,
  },
  emptyBtnAction: {
    backgroundColor: '#26C6DA',
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 30,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  listConfig: {
    padding: 16,
    paddingBottom: 25,
  },
  summaryFooter: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  summaryBar1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sumHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  sumMoneyValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#26C6DA', // Teal giống trang sản phẩm
  },
  processCheckoutButton: {
    backgroundColor: '#26C6DA', // Teal giống trang sản phẩm
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  processCheckoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
});
