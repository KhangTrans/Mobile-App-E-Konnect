import React from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useCart } from "@/contexts/CartContext";
import { useAlert } from "@/contexts/AlertContext";
import { formatPrice, getProductImageUrl, type Product } from "@/services/productService";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cartItems, isCartLoading, removeFromCart, updateQuantity } = useCart();
  const { showConfirm, showWarning } = useAlert();
  const [minNoticeProductId, setMinNoticeProductId] = React.useState<string | null>(null);
  const minNoticeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (minNoticeTimerRef.current) {
        clearTimeout(minNoticeTimerRef.current);
      }
    };
  }, []);

  const showMinNotice = (productId: string) => {
    setMinNoticeProductId(productId);

    if (minNoticeTimerRef.current) {
      clearTimeout(minNoticeTimerRef.current);
    }

    minNoticeTimerRef.current = setTimeout(() => {
      setMinNoticeProductId((prev) => (prev === productId ? null : prev));
    }, 1400);
  };

  const handleDecrease = (product: Product, currentQty: number) => {
    if (currentQty === 2) {
      updateQuantity(product._id, 1);
      showMinNotice(product._id);
      return;
    }

    updateQuantity(product._id, currentQty - 1);
  };

  const handleIncrease = (product: Product, currentQty: number) => {
    if (currentQty >= product.stock) {
      showWarning("Không đủ hàng", `Chỉ còn ${product.stock} sản phẩm trong kho`);
      return;
    }
    updateQuantity(product._id, currentQty + 1);
  };

  const handleRemove = (productId: string, productName: string) => {
    showConfirm(
      "Xóa sản phẩm",
      `Bạn có chắc muốn xóa \"${productName}\" khỏi giỏ hàng?`,
      () => removeFromCart(productId)
    );
  };

  const renderItem = ({ item }: any) => {
    const imageUrl = getProductImageUrl(item.product);
    const categoryName = item.product.categoryId?.name
      ? item.product.categoryId.name.toUpperCase()
      : "CHƯA PHÂN LOẠI";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/products/${item.product._id}`)}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={32} color="#adb5bd" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          {minNoticeProductId === item.product._id && (
            <View style={styles.minNotice}>
              <Text style={styles.minNoticeText}>Da dat so luong toi thieu</Text>
            </View>
          )}

          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.productCategory} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text style={styles.productPrice}>{formatPrice(item.product.price)}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.qtyButton, item.quantity === 1 && styles.qtyButtonDisabled]}
              onPress={() => handleDecrease(item.product, item.quantity)}
              disabled={item.quantity === 1}
            >
              <Ionicons name="remove" size={18} color="#1E3A5F" />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              style={[
                styles.qtyButton,
                item.quantity >= item.product.stock && styles.qtyButtonDisabled,
              ]}
              onPress={() => handleIncrease(item.product, item.quantity)}
              disabled={item.quantity >= item.product.stock}
            >
              <Ionicons name="add" size={18} color="#1E3A5F" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemove(item.product._id, item.product.name)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isCartLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color="#26C6DA" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Giỏ Hàng</Text>
          <Text style={styles.headerSubtitle}>{itemCount} items</Text>
        </View>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={60} color="#adb5bd" />
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Text style={styles.continueButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.product._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E3A5F",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#94a3b8",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#64748b",
  },
  continueButton: {
    backgroundColor: "#26C6DA",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  minNotice: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  minNoticeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
    lineHeight: 20,
  },
  productCategory: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#26C6DA",
    letterSpacing: 0.5,
  },
  productPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#26C6DA",
  },
  actionRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyText: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  deleteButton: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
});
