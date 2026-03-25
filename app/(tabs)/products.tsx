/**
 * Trang Sản Phẩm (Explore Tab)
 * - Hiển thị danh sách sản phẩm từ API backend-node
 * - Filter theo danh mục
 * - Grid 2 cột trên mobile
 * - UI giống bản web
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import service và kiểu dữ liệu
import { useAlert } from "@/contexts/AlertContext";
import { useCartContext } from "@/contexts/CartContext";
import { cartService } from "@/services/cartService";
import {
    formatPrice,
    getProductImageUrl,
    isLowStock,
    isOutOfStock,
    productService,
    type Product,
} from "@/services/productService";
import { TokenManager } from "@/utils/tokenManager";

// Import API_BASE_URL để lấy danh mục
import BannerCarousel from "@/components/home/BannerCarousel";
import { API_BASE_URL } from "@/config/config";

// Hàm strip HTML tags để hiển thị text thuần trong card nhỏ
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")   // Xóa tags
    .replace(/&nbsp;/g, " ")    // &nbsp; -> space
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")       // Nhiều space -> 1 space
    .trim();
};

const { width } = Dimensions.get("window");

// Số cột grid trên mobile
const NUM_COLUMNS = 2;

// Chiều rộng mỗi card sản phẩm
const CARD_WIDTH = (width - 48 - 12) / NUM_COLUMNS; // 48 = padding 24 mỗi bên, 12 = gap giữa 2 cột

// ============================================================
// KIỂU DỮ LIỆU CỤC BỘ (Local Types)
// ============================================================

interface CategoryFilter {
  _id: string;
  name: string;
  slug: string;
}

// ============================================================
// COMPONENT CHÍNH
// ============================================================

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const alert = useAlert();

  // --- State: danh sách sản phẩm ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); // Loading lần đầu
  const [loadingMore, setLoadingMore] = useState(false); // Load more (pagination)
  const [refreshing, setRefreshing] = useState(false); // Pull to refresh
  const { incrementCartCount } = useCartContext();

  // --- State: phân trang ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // --- State: danh mục (filter) ---
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // --- State: thanh tìm kiếm ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- State: thông báo lỗi ---
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // LẤY DANH SÁCH DANH MỤC (gọi 1 lần khi mount)
  // ============================================================
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const json = await response.json();
      if (json.success && json.data) {
        // Ép kiểu từng item để đảm bảo đúng cấu trúc
        const cats: CategoryFilter[] = json.data.map((c: any) => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
        }));
        setCategories(cats);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // ============================================================
  // LẤY DANH SÁCH SẢN PHẨM
  // ============================================================
  const fetchProducts = useCallback(
    async (page: number = 1, isRefresh: boolean = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        // Gọi API lấy sản phẩm
        const result = await productService.getAllProducts(
          page,
          20, // 20 sản phẩm mỗi trang
          selectedCategory || undefined,
          searchQuery || undefined,
        );

        if (result.success && result.data) {
          const { products: newProducts, pagination } = result.data;

          // Lần đầu (page=1): thay thế toàn bộ danh sách
          // Trang sau (page>1): thêm vào danh sách cũ
          if (page === 1 || isRefresh) {
            setProducts(newProducts);
          } else {
            setProducts((prev) => [...prev, ...newProducts]);
          }

          // Cập nhật phân trang
          setTotalProducts(pagination.total);
          setHasMore(page < pagination.totalPages);
          setCurrentPage(page);
        } else {
          setError("Không thể tải sản phẩm. Vui lòng thử lại.");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Đã xảy ra lỗi khi tải sản phẩm.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, searchQuery], // Chạy lại khi filter/search thay đổi
  );

  // ============================================================
  // EFFECT: GỌI API KHI MOUNT VÀ KHI FILTER THAY ĐỔI
  // ============================================================
  useEffect(() => {
    // Lấy danh mục trước (gọi 1 lần)
    fetchCategories();
  }, [fetchCategories]);

  // Mỗi khi selectedCategory hoặc searchQuery thay đổi -> reset và gọi lại
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    fetchProducts(1);
  }, [selectedCategory, searchQuery, fetchProducts]);

  // ============================================================
  // PULL TO REFRESH
  // ============================================================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1, true);
  }, [fetchProducts]);

  // ============================================================
  // LOAD MORE (Pagination)
  // ============================================================
  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(currentPage + 1);
    }
  }, [loadingMore, hasMore, loading, currentPage, fetchProducts]);

  // ============================================================
  // XỬ LÝ CHỌN DANH MỤC
  // ============================================================
  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // Bỏ chọn nếu click vào category đang active
      setSelectedCategory("");
    } else {
      setSelectedCategory(categoryId);
    }
    setSearchQuery(""); // Reset search khi đổi danh mục
  };

  // ============================================================
  // RENDER: 1 ITEM SẢN PHẨM
  // ============================================================
  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    // Lấy URL hình ảnh
    const imageUrl = getProductImageUrl(item);

    // Kiểm tra sắp hết hàng
    const lowStock = isLowStock(item);
    const outOfStock = isOutOfStock(item);

    // Tên danh mục (viết hoa)
    const categoryName = item.categoryId?.name
      ? item.categoryId.name.toUpperCase()
      : "CHƯA PHÂN LOẠI";

    // Số thứ tự trong hàng (để canh lề)
    const isLastItem = (index + 1) % NUM_COLUMNS === 0;

    // Hàm xử lý khi bấm vào card sản phẩm -> chuyển sang trang chi tiết
    const handlePress = () => {
      router.push(`/products/${item._id}`);
    };

    return (
      // Bọc toàn bộ card bằng TouchableOpacity để bấm được
      <TouchableOpacity
        style={[styles.productCard, isLastItem && styles.productCardLast]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* ---- Hình ảnh sản phẩm ---- */}
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            // Placeholder khi không có hình
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={40} color="#adb5bd" />
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}

          {/* Badge "SẮP HẾT" */}
          {lowStock && !outOfStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>SẮP HẾT</Text>
            </View>
          )}

          {/* Badge "HẾT HÀNG" + Overlay mờ */}
          {outOfStock && (
            <>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  zIndex: 1,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "#94a3b8",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                  zIndex: 2,
                }}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}
                >
                  HẾT HÀNG
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ---- Thông tin sản phẩm ---- */}
        <View style={styles.productInfo}>
          {/* Tên danh mục */}
          <Text style={styles.productCategory} numberOfLines={1}>
            {categoryName}
          </Text>

          {/* Tên sản phẩm */}
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Mô tả (strip HTML tags) */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {stripHtml(item.description || "") || "Không có mô tả"}
          </Text>

          {/* Giá + Nút Thêm */}
          <View style={styles.productFooter}>
            <View style={styles.priceColumn}>
              {/* Giá cuối (đã giảm hoặc giá gốc) */}
              <Text style={styles.productPrice}>
                {formatPrice(item.hasDiscount && item.discountedPrice ? item.discountedPrice : item.price)}
              </Text>
              {/* Giá gốc gạch ngang + badge % (chỉ khi có giảm giá) */}
              {item.hasDiscount && item.discountedPrice && (
                <View style={styles.discountRow}>
                  <Text style={styles.originalPriceSmall}>
                    {formatPrice(item.originalPrice ?? item.price)}
                  </Text>
                  <View style={styles.discountBadgeSmall}>
                    <Text style={styles.discountBadgeSmallText}>-{item.discountPercent}%</Text>
                  </View>
                </View>
              )}
            </View>
            {outOfStock ? (
              <View style={[styles.addButton, { backgroundColor: "#94a3b8" }]}>
                <Text style={styles.addButtonText}>Hết hàng</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={async () => {
                  const isLoggedIn = await TokenManager.isLoggedIn();
                  if (!isLoggedIn) {
                    alert.showAlert({
                      type: "info",
                      title: "Yêu cầu đăng nhập",
                      message: "Bạn cần đăng nhập để mua hàng.",
                      buttons: [
                        { text: "Đóng", style: "cancel" },
                        {
                          text: "Đăng nhập",
                          onPress: () => router.push("/(auth)/login" as any),
                        },
                      ],
                    });
                    return;
                  }
                  const res = await cartService.addToCart(item._id, 1);
                  if (res.success) {
                    incrementCartCount(1);
                    alert.showSuccess(
                      "Thành công",
                      `Đã thêm ${item.name} vào giỏ hàng`,
                    );
                  } else {
                    alert.showError(
                      "Lỗi",
                      res.error || "Thêm sản phẩm thất bại",
                    );
                  }
                }}
              >
                <Ionicons name="cart-outline" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDER: FOOTER (Loading more / Hết sản phẩm)
  // ============================================================
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#26C6DA" />
        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  // ============================================================
  // RENDER: NỘI DUNG CHÍNH
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* =============================================== */}
      {/* HEADER: Tiêu đề + Thanh tìm kiếm */}
      {/* =============================================== */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <View>
          <Text style={styles.headerTitle}>Sản Phẩm</Text>
          <Text style={styles.headerSubtitle}>
            Hiển thị {totalProducts} sản phẩm
          </Text>
        </View>
      </View>

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#94a3b8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* =============================================== */}
      {/* BANNER CAROUSEL: Marketing Banners */}
      {/* =============================================== */}
      <BannerCarousel />

      {/* =============================================== */}
      {/* DANH MỤC: Filter ngang có scroll */}
      {/* =============================================== */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {/* Nút "Tất cả" */}
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === "" && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory("")}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === "" && styles.categoryChipTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          {/* Các nút danh mục */}
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={`${cat._id}-${index}`}
              style={[
                styles.categoryChip,
                selectedCategory === cat._id && styles.categoryChipActive,
              ]}
              onPress={() => handleSelectCategory(cat._id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat._id && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* =============================================== */}
      {/* GRID SẢN PHẨM */}
      {/* =============================================== */}
      {loading ? (
        // Loading ban đầu: hiển thị spinner giữa màn hình
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#26C6DA" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : error ? (
        // Có lỗi
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchProducts(1)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        // Không có sản phẩm
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={60} color="#adb5bd" />
          <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
        </View>
      ) : (
        // Danh sách sản phẩm
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.productListContent}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#26C6DA"
              colors={["#26C6DA"]}
            />
          }
        />
      )}

      {/* Padding dưới cho Tab Bar */}
      <View style={{ height: 100 }} />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // --- Container chính ---
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // --- Header ---
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E3A5F",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },

  // --- Thanh tìm kiếm ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },

  // --- Danh mục filter ---
  categoryFilterContainer: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 24,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#26C6DA",
    borderColor: "#26C6DA",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  categoryChipTextActive: {
    color: "#fff",
  },

  // --- Grid sản phẩm ---
  productListContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  productRow: {
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    overflow: "hidden",
    flexDirection: "column",
  },
  productCardLast: {
    // Không có margin-right cho item cuối hàng
  },

  // --- Hình ảnh sản phẩm ---
  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 6,
  },
  lowStockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF9800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lowStockBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  // --- Thông tin sản phẩm ---

  productInfo: {
    padding: 12,
    flex: 1, // ← add this
    justifyContent: "space-between", // ← add this
  },
  productCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: "#26C6DA",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 4,
    lineHeight: 20,
  },
  productDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#26C6DA",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#26C6DA",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  // --- Loading / Error / Empty ---
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
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
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
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

  // --- Load more ---
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#64748b",
  },

  // --- Discount price styles ---
  priceColumn: {
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  originalPriceSmall: {
    fontSize: 11,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  discountBadgeSmall: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  discountBadgeSmallText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
});
