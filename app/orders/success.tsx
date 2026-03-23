import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/config/config";

interface RecommendedProduct {
  _id: string;
  name: string;
  price: number;
  images?: Array<{ imageUrl: string; isPrimary?: boolean }>;
}

interface ActiveBanner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  discountPercent?: number;
  products?: Array<{ _id: string }>;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 24;
const PRODUCT_CARD_WIDTH = Math.max(150, (SCREEN_WIDTH - 24 - 32 - 12) / 2);
const PRODUCT_IMAGE_HEIGHT = Math.round(PRODUCT_CARD_WIDTH * 1.2);

const formatCurrency = (value: number): string => {
  return `${value.toLocaleString("vi-VN")}đ`;
};

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { paymentStatus, orderNumber, total } = useLocalSearchParams<{
    paymentStatus?: string;
    orderNumber?: string;
    total?: string;
  }>();
  const [activeBanners, setActiveBanners] = useState<ActiveBanner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(true);
  const bannerListRef = useRef<FlatList<ActiveBanner> | null>(null);

  const isPendingPayment = (paymentStatus || "pending") === "pending";

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        setLoadingBanner(true);
        const response = await fetch(`${API_BASE_URL}/api/product-banners/active`);
        const json = await response.json();

        if (json?.success && Array.isArray(json?.data)) {
          setActiveBanners(json.data.slice(0, 4));
          return;
        }

        setActiveBanners([]);
      } catch (error) {
        console.error("Fetch banners error:", error);
        setActiveBanners([]);
      } finally {
        setLoadingBanner(false);
      }
    };

    fetchActiveBanners();
  }, []);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => {
        const next = (prev + 1) % activeBanners.length;
        bannerListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [activeBanners.length]);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        setLoadingRecommend(true);
        const response = await fetch(`${API_BASE_URL}/api/recommendations/trending?limit=6`);
        const json = await response.json();

        if (json?.success) {
          const products = Array.isArray(json?.data?.products)
            ? json.data.products
            : Array.isArray(json?.data)
              ? json.data
              : [];

          setRecommendedProducts(products.slice(0, 6));
          return;
        }

        setRecommendedProducts([]);
      } catch (error) {
        console.error("Fetch recommendations error:", error);
        setRecommendedProducts([]);
      } finally {
        setLoadingRecommend(false);
      }
    };

    fetchRecommendedProducts();
  }, []);

  const goToProduct = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleBannerPress = (banner: ActiveBanner) => {
    const firstProductId = banner.products?.[0]?._id;
    if (firstProductId) {
      router.push(`/products/${firstProductId}`);
      return;
    }
    router.replace("/(tabs)/products");
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.statusLine}>
            <View style={styles.iconBadge}>
              <Ionicons
                name={isPendingPayment ? "alert" : "checkmark"}
                size={20}
                color={isPendingPayment ? "#26C6DA" : "#0EA75A"}
              />
            </View>
            <Text style={styles.statusTitle}>
              {isPendingPayment ? "Đang chờ thanh toán" : "Đặt hàng thành công"}
            </Text>
          </View>

          <Text style={styles.statusDesc}>
            Để tránh mất tiền vào tay kẻ lừa đảo mạo danh Shipper, bạn tuyệt đối:
          </Text>
          <Text style={styles.statusDesc}>KHÔNG chuyển khoản cho Shipper khi chưa nhận hàng.</Text>
          <Text style={styles.statusDesc}>KHÔNG nhấn vào đường link lạ do Shipper gửi.</Text>

          <View style={styles.metaBox}>
            <Text style={styles.metaText}>Mã đơn: {orderNumber || "Đang cập nhật"}</Text>
            <Text style={styles.metaText}>Tổng tiền: {formatCurrency(Number(total || 0))}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.actionBtnText}>Trang chủ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace("/orders/history")}>
              <Text style={styles.actionBtnText}>Đơn mua</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.bannerSection}>
        {loadingBanner ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#26C6DA" />
            <Text style={styles.loadingText}>Đang tải banner...</Text>
          </View>
        ) : activeBanners.length > 0 ? (
          <FlatList
            ref={bannerListRef}
            data={activeBanners}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerList}
            getItemLayout={(_, index) => ({
              length: BANNER_WIDTH + 10,
              offset: (BANNER_WIDTH + 10) * index,
              index,
            })}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (BANNER_WIDTH + 10));
              if (!Number.isNaN(index)) {
                setActiveBannerIndex(index);
              }
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bannerCard}
                onPress={() => handleBannerPress(item)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay}>
                  <Text numberOfLines={1} style={styles.bannerTitle}>{item.title}</Text>
                  <Text numberOfLines={1} style={styles.bannerDesc}>
                    {item.description || "Ưu đãi hấp dẫn đang chờ bạn"}
                  </Text>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>-{item.discountPercent || 0}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : null}

        {activeBanners.length > 1 && (
          <View style={styles.bannerDots}>
            {activeBanners.map((banner, index) => (
              <View
                key={banner._id}
                style={[styles.bannerDot, index === activeBannerIndex && styles.bannerDotActive]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.recommendBlock}>
        <Text style={styles.recommendTitle}>Có thể bạn cũng thích</Text>
        {loadingRecommend ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#26C6DA" />
            <Text style={styles.loadingText}>Đang tải gợi ý...</Text>
          </View>
        ) : recommendedProducts.length === 0 ? (
          <Text style={styles.recommendSub}>Chưa có gợi ý phù hợp lúc này.</Text>
        ) : (
          <FlatList
            data={recommendedProducts}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendList}
            renderItem={({ item }) => {
              const imageUrl =
                item.images?.find((img) => img.isPrimary)?.imageUrl ||
                item.images?.[0]?.imageUrl ||
                "https://via.placeholder.com/120";

              return (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => goToProduct(item._id)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: imageUrl }} style={styles.productImage} />
                  <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price || 0)}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  hero: {
    backgroundColor: "#26C6DA",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 34,
    marginBottom: 8,
  },
  heroContent: {
    alignItems: "center",
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  statusDesc: {
    marginTop: 6,
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
  metaBox: {
    width: "100%",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  metaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionRow: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  recommendBlock: {
    marginTop: 8,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  bannerSection: {
    marginTop: 10,
    marginHorizontal: 12,
  },
  bannerList: {
    paddingRight: 4,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D7ECF2",
    backgroundColor: "#fff",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(15,23,42,0.45)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  bannerDesc: {
    color: "#E2E8F0",
    fontSize: 12,
    marginTop: 2,
  },
  bannerBadge: {
    position: "absolute",
    top: -10,
    right: -2,
    backgroundColor: "#26C6DA",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  bannerDots: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C7D2FE",
  },
  bannerDotActive: {
    width: 18,
    backgroundColor: "#26C6DA",
  },
  recommendTitle: {
    fontSize: 18,
    color: "#1E3A5F",
    fontWeight: "700",
    marginBottom: 10,
  },
  recommendSub: {
    color: "#6B7280",
    fontSize: 13,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 13,
  },
  recommendList: {
    gap: 12,
    paddingRight: 12,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    minHeight: PRODUCT_IMAGE_HEIGHT + 90,
  },
  productImage: {
    width: "100%",
    height: PRODUCT_IMAGE_HEIGHT,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    color: "#1E293B",
    minHeight: 40,
  },
  productPrice: {
    marginTop: 6,
    color: "#26C6DA",
    fontSize: 16,
    fontWeight: "700",
  },
});
