/**
 * ============================================================
 * TRANG CHI TIẾT SẢN PHẨM
 * ============================================================
 * Route: /products/[id]  (id = product ID từ backend)
 * Gọi API: GET /api/products/:id
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Import service đã có sẵn
import {
  productService,
  formatPrice,
  getProductImageUrl,
  isLowStock,
  isOutOfStock,
  type Product,
} from "@/services/productService";

const { width } = Dimensions.get("window");

// ============================================================
// COMPONENT CHÍNH
// ============================================================
export default function ProductDetailScreen() {
  // Lấy product ID từ URL (route params)
  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- State: thông tin sản phẩm ---
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  // --- State: loading & error ---
  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State: ảnh đang xem ---
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // --- State: số lượng mua ---
  const [quantity, setQuantity] = useState(1);

  // ============================================================
  // LẤY THÔNG TIN SẢN PHẨM
  // ============================================================
  useEffect(() => {
    // Nếu không có ID thì không gọi API
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API lấy chi tiết sản phẩm theo ID
        const result = await productService.getProductById(id);

        if (result.success && result.data) {
          setProduct(result.data);

          // Sau khi có sản phẩm -> gọi API lấy sản phẩm tương tự
          // (cùng danh mục, loại trừ sản phẩm hiện tại)
          if (result.data.categoryId?._id) {
            fetchSimilarProducts(result.data.categoryId._id, id);
          }
        } else {
          setError("Không tìm thấy sản phẩm này.");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Đã xảy ra lỗi khi tải sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ============================================================
  // LẤY SẢN PHẨM TƯƠNG TỰ (cùng danh mục)
  // ============================================================
  const fetchSimilarProducts = async (categoryId: string, currentId: string) => {
    try {
      setLoadingSimilar(true);

      // Gọi API lấy sản phẩm, lọc theo danh mục
      const result = await productService.getAllProducts(1, 6, categoryId);

      if (result.success && result.data) {
        // Loại bỏ sản phẩm hiện tại khỏi danh sách tương tự
        const filtered = result.data.products.filter(
          (p: Product) => p._id !== currentId
        );
        setSimilarProducts(filtered.slice(0, 4)); // Chỉ lấy 4 sản phẩm
      }
    } catch (err) {
      console.error("Error fetching similar products:", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // ============================================================
  // XỬ LÝ: TĂNG / GIẢM SỐ LƯỢNG
  // ============================================================
  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  // ============================================================
  // XỬ LÝ: THÊM VÀO GIỎ HÀNG (tạm thời - chưa có cart service)
  // ============================================================
  const handleAddToCart = () => {
    // TODO: Khi có cart service thì thay bằng API thực tế
    alert(`Đã thêm ${quantity} sản phẩm "${product?.name}" vào giỏ hàng!`);
  };

  // ============================================================
  // XỬ LÝ: MUA NGAY
  // ============================================================
  const handleBuyNow = () => {
    if (!id || !product) return;

    router.push({
      pathname: "/checkout/cod",
      params: {
        productId: id,
        quantity: String(quantity),
      },
    });
  };

  // ============================================================
  // RENDER: MÀN HÌNH LOADING
  // ============================================================
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#26C6DA" />
        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  // ============================================================
  // RENDER: CÓ LỖI
  // ============================================================
  if (error || !product) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>
          {error || "Sản phẩm không tồn tại."}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // LẤY DANH SÁCH ẢNH SẢN PHẨM
  // ============================================================
  // Nếu có ảnh từ API thì dùng, không thì dùng placeholder
  const imageUrls =
    product.images.length > 0
      ? product.images.map((img) => img.imageUrl)
      : [""];

  // ============================================================
  // RENDER: NỘI DUNG CHÍNH
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* =============================================== */}
        {/* HEADER: Nút quay lại + breadcrumb */}
        {/* =============================================== */}
        <View style={styles.header}>
          {/* Nút quay lại */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1E3A5F" />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>

          {/* Breadcrumb */}
          <Text style={styles.breadcrumb}>
            <Text style={styles.breadcrumbLink} onPress={() => router.push("/products")}>
              Sản phẩm
            </Text>
            {" / "}
            {product.name}
          </Text>
        </View>

        {/* =============================================== */}
        {/* PHẦN 1: ẢNH SẢN PHẨM */}
        {/* =============================================== */}
        <View style={styles.imageSection}>
          {/* Ảnh chính */}
          <View style={styles.mainImageContainer}>
            {imageUrls[selectedImageIndex] ? (
              <Image
                source={{ uri: imageUrls[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={80} color="#ccc" />
              </View>
            )}

            {/* Nút yêu thích */}
            <TouchableOpacity style={styles.wishlistButton}>
              <Ionicons name="heart-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Ảnh thumbnails (danh sách ảnh nhỏ) */}
          {imageUrls.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
            >
              {imageUrls.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnailItem,
                    selectedImageIndex === index &&
                      styles.thumbnailItemActive,
                  ]}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* =============================================== */}
        {/* PHẦN 2: THÔNG TIN SẢN PHẨM */}
        {/* =============================================== */}
        <View style={styles.infoSection}>
          {/* Tên sản phẩm */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Giá */}
          <View style={styles.priceBar}>
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          </View>

          {/* Thông tin cơ bản */}
          <View style={styles.specList}>
            {/* Danh mục */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Danh mục</Text>
              <Text style={styles.specValue}>
                {product.categoryId?.name || "Đang cập nhật"}
              </Text>
            </View>

            {/* Kho hàng */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Kho hàng</Text>
              <Text
                style={[
                  styles.specValue,
                  isOutOfStock(product)
                    ? styles.outOfStock
                    : styles.inStock,
                ]}
              >
                {isOutOfStock(product)
                  ? "Hết hàng"
                  : `Còn ${product.stock} sản phẩm`}
              </Text>
            </View>

            {/* Thương hiệu */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Thương hiệu</Text>
              <Text style={styles.specValue}>Đang cập nhật</Text>
            </View>
          </View>

          {/* =============================================== */}
          {/* MÃ GIẢM GIÁ */}
          {/* =============================================== */}
          {/* <View style={styles.voucherSection}>
            <Text style={styles.voucherTitle}>Mã giảm giá</Text>
            <View style={styles.voucherCard}> */}
              {/* Nhãn FREE Ship */}
              {/* <View style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>FREE Ship</Text>
              </View> */}

              {/* Thông tin voucher */}
              {/* <View style={styles.voucherInfo}>
                <Text style={styles.voucherCode}>SUMMER2024</Text>
                <Text style={styles.voucherDesc}>Mô tả mới</Text>
                <Text style={styles.voucherMin}>
                  Đơn tối thiểu: 150.000đ | HSD: 30/06/2026
                </Text>
              </View> */}

              {/* Nút LƯU */}
              {/* <TouchableOpacity style={styles.voucherSaveButton}>
                <Text style={styles.voucherSaveText}>LƯU</Text>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* =============================================== */}
          {/* SỐ LƯỢNG */}
          {/* =============================================== */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Số lượng:</Text>

            <View style={styles.quantityControl}>
              {/* Nút giảm */}
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={decreaseQuantity}
              >
                <Ionicons name="remove" size={18} color="#1E3A5F" />
              </TouchableOpacity>

              {/* Số lượng */}
              <TextInput
                style={styles.quantityInput}
                value={String(quantity)}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setQuantity(Math.max(1, Math.min(num, product.stock)));
                }}
              />

              {/* Nút tăng */}
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={increaseQuantity}
              >
                <Ionicons name="add" size={18} color="#1E3A5F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* =============================================== */}
          {/* NÚT HÀNH ĐỘNG */}
          {/* =============================================== */}
          <View style={styles.actionButtons}>
            {/* Nút: Thêm vào giỏ hàng */}
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                isOutOfStock(product) && styles.disabledBtn,
              ]}
              onPress={handleAddToCart}
              disabled={isOutOfStock(product)}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
            </TouchableOpacity>

            {/* Nút: Mua ngay */}
            <TouchableOpacity
              style={[
                styles.buyNowBtn,
                isOutOfStock(product) && styles.disabledBtn,
              ]}
              onPress={handleBuyNow}
              disabled={isOutOfStock(product)}
            >
              <Text style={styles.buyNowText}>Mua ngay</Text>
            </TouchableOpacity>
          </View>

          {/* =============================================== */}
          {/* MÔ TẢ SẢN PHẨM */}
          {/* =============================================== */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText}>
              {product.description || "Sản phẩm hiện chưa có mô tả chi tiết."}
            </Text>
          </View>

          {/* =============================================== */}
          {/* SẢN PHẨM TƯƠNG TỰ */}
          {/* =============================================== */}
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>Sản phẩm tương tự</Text>
            <Text style={styles.similarSubtitle}>
              Các sản phẩm cùng phân khúc và danh mục
            </Text>

            {loadingSimilar ? (
              <ActivityIndicator
                size="small"
                color="#26C6DA"
                style={{ marginVertical: 20 }}
              />
            ) : similarProducts.length === 0 ? (
              <Text style={styles.noSimilarText}>
                Chưa có sản phẩm tương tự.
              </Text>
            ) : (
              <FlatList
                data={similarProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.similarList}
                renderItem={({ item }) => (
                  <SimilarProductCard
                    product={item}
                    onPress={() => router.push(`/products/${item._id}`)}
                  />
                )}
              />
            )}
          </View>
        </View>

        {/* Padding dưới cùng */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// COMPONENT: CARD SẢN PHẨM TƯƠNG TỰ
// ============================================================
interface SimilarProductCardProps {
  product: Product;
  onPress: () => void;
}

function SimilarProductCard({ product, onPress }: SimilarProductCardProps) {
  // Lấy ảnh đầu tiên của sản phẩm
  const imageUrl = getProductImageUrl(product);

  return (
    <TouchableOpacity style={styles.similarCard} onPress={onPress}>
      {/* Hình ảnh */}
      <View style={styles.similarCardImage}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.similarCardImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.similarNoImage}>
            <Ionicons name="image-outline" size={30} color="#ccc" />
          </View>
        )}
      </View>

      {/* Thông tin */}
      <View style={styles.similarCardInfo}>
        {/* Danh mục */}
        <Text style={styles.similarCategory}>
          {product.categoryId?.name?.toUpperCase() || "CHƯA PHÂN LOẠI"}
        </Text>

        {/* Tên */}
        <Text style={styles.similarName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Mô tả */}
        <Text style={styles.similarDesc} numberOfLines={2}>
          {product.description || "Không có mô tả"}
        </Text>

        {/* Giá + nút */}
        <View style={styles.similarFooter}>
          <Text style={styles.similarPrice}>
            {formatPrice(product.price)}
          </Text>
          <View style={styles.similarAddBtn}>
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.similarAddBtnText}>Thêm</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================
const CARD_WIDTH = (width - 64) / 2; // Grid 2 cột, padding 24 mỗi bên

const styles = StyleSheet.create({
  // --- Container ---
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  // --- Header ---
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backText: {
    fontSize: 15,
    color: "#1E3A5F",
    fontWeight: "600",
    marginLeft: 4,
  },
  breadcrumb: {
    fontSize: 13,
    color: "#94a3b8",
  },
  breadcrumbLink: {
    color: "#26C6DA",
  },

  // --- Loading / Error ---
  loadingText: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 12,
  },
  errorText: {
    fontSize: 15,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#26C6DA",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // --- Ảnh sản phẩm ---
  imageSection: {
    paddingHorizontal: 16,
  },
  mainImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailList: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  thumbnailItem: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailItemActive: {
    borderColor: "#26C6DA",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  // --- Thông tin sản phẩm ---
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#26C6DA",
    marginBottom: 12,
  },
  priceBar: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#26C6DA",
  },

  // --- Thông số cơ bản ---
  specList: {
    gap: 10,
    marginBottom: 16,
  },
  specItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  specLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  specValue: {
    fontSize: 14,
    color: "#1E3A5F",
    fontWeight: "600",
  },
  inStock: {
    color: "#22c55e",
  },
  outOfStock: {
    color: "#ef4444",
  },

  // --- Voucher ---
  voucherSection: {
    marginBottom: 16,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 8,
  },
  voucherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
    padding: 12,
  },
  voucherBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  voucherBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  voucherInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  voucherDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  voucherMin: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  voucherSaveButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voucherSaveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // --- Số lượng ---
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A5F",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  quantityBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  quantityInput: {
    width: 50,
    height: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },

  // --- Nút hành động ---
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#26C6DA",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  buyNowBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#26C6DA",
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#26C6DA",
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // --- Mô tả ---
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E3A5F",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 22,
  },

  // --- Sản phẩm tương tự ---
  similarSection: {
    marginBottom: 16,
  },
  similarSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 12,
    marginTop: -8,
  },
  similarList: {
    gap: 12,
    paddingRight: 16,
  },
  noSimilarText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginVertical: 20,
  },

  // --- Card sản phẩm tương tự ---
  similarCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  similarCardImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
  },
  similarCardImg: {
    width: "100%",
    height: "100%",
  },
  similarNoImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  similarCardInfo: {
    padding: 10,
  },
  similarCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#26C6DA",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  similarName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 4,
    lineHeight: 18,
  },
  similarDesc: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 15,
    marginBottom: 8,
  },
  similarFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#26C6DA",
  },
  similarAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#26C6DA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  similarAddBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
