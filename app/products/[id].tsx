/**
 * ============================================================
 * TRANG CHI TIẾT SẢN PHẨM
 * ============================================================
 * Route: /products/[id]  (id = product ID từ backend)
 * Gọi API: GET /api/products/:id
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import service đã có sẵn
import { useAlert } from "@/contexts/AlertContext";
import { useCartContext } from "@/contexts/CartContext";
import { cartService } from "@/services/cartService";
import {
  formatPrice,
  getProductImageUrl,
  isOutOfStock,
  productService,
  type Product,
} from "@/services/productService";
import type { ProductReview, ReviewStats } from "@/services/reviewService";
import { reviewService } from "@/services/reviewService";
import { TokenManager } from "@/utils/tokenManager";

const { width } = Dimensions.get("window");

const DEFAULT_REVIEW_STATS: ReviewStats = {
  averageRating: 0,
  totalReviews: 0,
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

// ============================================================
// COMPONENT CHÍNH
// ============================================================
export default function ProductDetailScreen() {
  // Lấy product ID từ URL (route params)
  const { id, focusReview } = useLocalSearchParams<{
    id: string;
    focusReview?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { cartCount, incrementCartCount } = useCartContext();

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

  // --- State: đánh giá ---
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewStats, setReviewStats] =
    useState<ReviewStats>(DEFAULT_REVIEW_STATS);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrolledReviewRef = useRef(false);
  const [reviewSectionY, setReviewSectionY] = useState(0);

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
  // LẤY ĐÁNH GIÁ SẢN PHẨM
  // ============================================================
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const [reviewsRes, statsRes] = await Promise.all([
          reviewService.getProductReviews(id),
          reviewService.getReviewStats(id),
        ]);

        if (reviewsRes.success && Array.isArray(reviewsRes.data)) {
          setReviews(reviewsRes.data);
        } else {
          setReviews([]);
        }

        if (statsRes.success && statsRes.data) {
          setReviewStats(statsRes.data);
        } else {
          setReviewStats(DEFAULT_REVIEW_STATS);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
        setReviewStats(DEFAULT_REVIEW_STATS);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const shouldFocusReview = focusReview === "1" || focusReview === "true";
    if (!shouldFocusReview || loading) return;
    if (reviewSectionY <= 0 || autoScrolledReviewRef.current) return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(reviewSectionY - 12, 0),
        animated: true,
      });
      autoScrolledReviewRef.current = true;
    }, 220);

    return () => clearTimeout(timer);
  }, [focusReview, loading, reviewSectionY]);

  // ============================================================
  // LẤY SẢN PHẨM TƯƠNG TỰ (cùng danh mục)
  // ============================================================
  const fetchSimilarProducts = async (
    categoryId: string,
    currentId: string,
  ) => {
    try {
      setLoadingSimilar(true);

      // Gọi API lấy sản phẩm, lọc theo danh mục
      const result = await productService.getAllProducts(1, 6, categoryId);

      if (result.success && result.data) {
        // Loại bỏ sản phẩm hiện tại khỏi danh sách tương tự
        const filtered = result.data.products.filter(
          (p: Product) => p._id !== currentId,
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
  // XỬ LÝ: THÊM VÀO GIỎ HÀNG
  // ============================================================
  const handleAddToCart = async () => {
    if (!product || !id) return;

    // Check nếu người dùng chưa đăng nhập
    const isLoggedIn = await TokenManager.isLoggedIn();
    if (!isLoggedIn) {
      alert.showAlert({
        type: "info",
        title: "Yêu cầu đăng nhập",
        message: "Bạn cần đăng nhập trước để thêm sản phẩm vào giỏ hàng.",
        buttons: [
          { text: "Bỏ qua", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => router.push("/(auth)/login" as any),
          },
        ],
      });
      return;
    }

    // Call API thêm giỏ hàng
    const response = await cartService.addToCart(id as string, quantity);
    if (response.success) {
      incrementCartCount(quantity);
      alert.showSuccess(
        "Thành công",
        `Đã thêm ${quantity} sản phẩm "${product?.name}" vào giỏ hàng!`,
      );
    } else {
      alert.showError(
        "Lỗi",
        response.error || "Có lỗi xảy ra khi thêm vào giỏ hàng.",
      );
    }
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

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color="#facc15"
          />
        ))}
      </View>
    );
  };

  const handleSubmitReview = async () => {
    if (!id) return;

    const isLoggedIn = await TokenManager.isLoggedIn();
    if (!isLoggedIn) {
      alert.showAlert({
        type: "info",
        title: "Yêu cầu đăng nhập",
        message: "Bạn cần đăng nhập trước để gửi đánh giá.",
        buttons: [
          { text: "Bỏ qua", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => router.push("/(auth)/login" as any),
          },
        ],
      });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      alert.showWarning(
        "Đánh giá chưa hợp lệ",
        "Vui lòng chọn số sao từ 1 đến 5.",
      );
      return;
    }

    if (reviewComment.trim().length < 3) {
      alert.showWarning(
        "Thiếu nội dung",
        "Vui lòng nhập nhận xét tối thiểu 3 ký tự.",
      );
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await reviewService.createReview({
        productId: id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      if (response.success) {
        alert.showSuccess("Thành công", "Đánh giá của bạn đã được ghi nhận.");
        setReviewComment("");
        setReviewRating(5);

        const [reviewsRes, statsRes] = await Promise.all([
          reviewService.getProductReviews(id),
          reviewService.getReviewStats(id),
        ]);

        if (reviewsRes.success && Array.isArray(reviewsRes.data)) {
          setReviews(reviewsRes.data);
        }
        if (statsRes.success && statsRes.data) {
          setReviewStats(statsRes.data);
        }
        return;
      }

      alert.showError(
        "Không thể đánh giá",
        response.message || "Bạn chưa đủ điều kiện để đánh giá sản phẩm này.",
      );
    } catch (error: any) {
      console.error("Submit review error:", error);
      alert.showError(
        "Lỗi",
        error?.response?.data?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setSubmittingReview(false);
    }
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
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
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
            <Text
              style={styles.breadcrumbLink}
              onPress={() => router.push("/products")}
            >
              Sản phẩm
            </Text>
            {" / "}
            {product.name}
          </Text>
        </View>

        {/* Icon giỏ hàng bên dưới Header nếu cần (Nổi lên) */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            padding: 8,
            backgroundColor: "#f1f5f9",
            borderRadius: 12,
            zIndex: 10,
          }}
          onPress={() => router.push("/cart")}
        >
          <Ionicons name="cart-outline" size={26} color="#1E3A5F" />
          {cartCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                backgroundColor: "#E63946",
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
                borderWidth: 1.5,
                borderColor: "#fff",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
                    selectedImageIndex === index && styles.thumbnailItemActive,
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
            {product.hasDiscount && product.discountedPrice ? (
              <>
                {/* Giá đã giảm (giá thực trả) */}
                <Text style={styles.productPrice}>
                  {formatPrice(product.discountedPrice)}
                </Text>
                {/* Giá gốc gạch ngang */}
                <Text style={styles.originalPrice}>
                  {formatPrice(product.originalPrice ?? product.price)}
                </Text>
                {/* Badge % giảm */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>
                    -{product.discountPercent}%
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.productPrice}>
                {formatPrice(product.price)}
              </Text>
            )}
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
                  isOutOfStock(product) ? styles.outOfStock : styles.inStock,
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
            {product.description ? (
              <RenderHtml
                contentWidth={width - 32}
                source={{ html: product.description }}
                tagsStyles={{
                  p: {
                    color: "#334155",
                    fontSize: 15,
                    lineHeight: 24,
                    marginBottom: 8,
                  },
                  strong: { fontWeight: "700", color: "#1E3A5F" },
                  em: { fontStyle: "italic" },
                  ul: { paddingLeft: 16 },
                  ol: { paddingLeft: 16 },
                  li: { color: "#334155", fontSize: 15, lineHeight: 24 },
                  h1: {
                    fontSize: 20,
                    fontWeight: "800",
                    color: "#1E3A5F",
                    marginBottom: 8,
                  },
                  h2: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#1E3A5F",
                    marginBottom: 6,
                  },
                  h3: {
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#1E3A5F",
                    marginBottom: 4,
                  },
                  a: { color: "#26C6DA" },
                }}
                baseStyle={{ color: "#334155", fontSize: 15 }}
              />
            ) : (
              <Text style={styles.descriptionText}>
                Sản phẩm hiện chưa có mô tả chi tiết.
              </Text>
            )}
          </View>

          {/* =============================================== */}
          {/* ĐÁNH GIÁ SẢN PHẨM */}
          {/* =============================================== */}
          <View
            style={styles.reviewSection}
            onLayout={(event) => setReviewSectionY(event.nativeEvent.layout.y)}
          >
            <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>

            {loadingReviews ? (
              <ActivityIndicator
                size="small"
                color="#26C6DA"
                style={{ marginVertical: 12 }}
              />
            ) : (
              <>
                <View style={styles.reviewStatsCard}>
                  <View style={styles.reviewAverageBox}>
                    <Text style={styles.reviewAverageText}>
                      {reviewStats.averageRating.toFixed(1)}
                    </Text>
                    {renderStars(Math.round(reviewStats.averageRating), 18)}
                    <Text style={styles.reviewTotalText}>
                      {reviewStats.totalReviews} đánh giá
                    </Text>
                  </View>

                  <View style={styles.reviewDistributionBox}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        reviewStats.distribution[star as 1 | 2 | 3 | 4 | 5] ||
                        0;
                      const percent =
                        reviewStats.totalReviews > 0
                          ? Math.round((count / reviewStats.totalReviews) * 100)
                          : 0;

                      return (
                        <View key={star} style={styles.distributionRow}>
                          <Text style={styles.distributionLabel}>
                            {star} sao
                          </Text>
                          <View style={styles.distributionBarBg}>
                            <View
                              style={[
                                styles.distributionBarFill,
                                { width: `${percent}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.distributionCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.reviewFormCard}>
                  <Text style={styles.reviewFormTitle}>
                    Gửi đánh giá của bạn
                  </Text>

                  <View style={styles.reviewRatingRow}>
                    <Text style={styles.reviewRatingLabel}>
                      Chất lượng sản phẩm:
                    </Text>
                    <View style={styles.reviewRatingStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setReviewRating(star)}
                        >
                          <Ionicons
                            name={
                              star <= reviewRating ? "star" : "star-outline"
                            }
                            size={24}
                            color="#facc15"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TextInput
                    style={styles.reviewCommentInput}
                    multiline
                    maxLength={500}
                    placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này..."
                    value={reviewComment}
                    onChangeText={setReviewComment}
                  />
                  <Text style={styles.reviewCounterText}>
                    {reviewComment.length} / 500
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.submitReviewBtn,
                      submittingReview && styles.disabledBtn,
                    ]}
                    onPress={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitReviewBtnText}>
                        Gửi đánh giá
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.reviewListSection}>
                  <Text style={styles.reviewListTitle}>
                    Nhận xét từ khách hàng
                  </Text>
                  {reviews.length === 0 ? (
                    <Text style={styles.noReviewText}>
                      Sản phẩm chưa có đánh giá nào.
                    </Text>
                  ) : (
                    reviews.map((review) => (
                      <View key={review._id} style={styles.reviewItemCard}>
                        <View style={styles.reviewItemHeader}>
                          <View>
                            <Text style={styles.reviewUserName}>
                              {review.user?.fullName ||
                                review.user?.username ||
                                "Người dùng"}
                            </Text>
                            {renderStars(review.rating, 14)}
                          </View>
                          <Text style={styles.reviewDateText}>
                            {new Date(review.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </Text>
                        </View>
                        <Text style={styles.reviewCommentText}>
                          {review.comment}
                        </Text>

                        {review.reply?.comment ? (
                          <View style={styles.replyBox}>
                            <Text style={styles.replyTitle}>
                              Phản hồi từ Shop
                            </Text>
                            <Text style={styles.replyComment}>
                              {review.reply.comment}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              </>
            )}
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
          {(product.description || "Không có mô tả")
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim()}
        </Text>

        {/* Giá + nút */}
        <View style={styles.similarFooter}>
          <Text style={styles.similarPrice}>
            {formatPrice(
              product.hasDiscount && product.discountedPrice
                ? product.discountedPrice
                : product.price,
            )}
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
  originalPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
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

  // --- Đánh giá ---
  reviewSection: {
    marginBottom: 24,
  },
  reviewStatsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 14,
  },
  reviewAverageBox: {
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAverageText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1E3A5F",
    marginBottom: 6,
  },
  reviewTotalText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },
  reviewDistributionBox: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  distributionLabel: {
    width: 44,
    fontSize: 12,
    color: "#334155",
  },
  distributionBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    overflow: "hidden",
  },
  distributionBarFill: {
    height: "100%",
    backgroundColor: "#facc15",
    borderRadius: 999,
  },
  distributionCount: {
    width: 24,
    textAlign: "right",
    fontSize: 12,
    color: "#334155",
  },
  reviewFormCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 14,
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 10,
  },
  reviewRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewRatingLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  reviewRatingStarsRow: {
    flexDirection: "row",
    gap: 4,
  },
  reviewCommentInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlignVertical: "top",
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  reviewCounterText: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 12,
    color: "#94a3b8",
  },
  submitReviewBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#26C6DA",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
  },
  submitReviewBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  reviewListSection: {
    gap: 10,
  },
  reviewListTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  noReviewText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 8,
  },
  reviewItemCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 4,
  },
  reviewDateText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  reviewCommentText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  replyBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 10,
  },
  replyTitle: {
    fontSize: 13,
    color: "#0284C7",
    fontWeight: "700",
    marginBottom: 4,
  },
  replyComment: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
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
