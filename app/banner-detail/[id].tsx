import { IconSymbol } from "@/components/ui/icon-symbol";
import { bannerService, BannerProduct } from "@/services/bannerService";
import { formatPrice, getProductImageUrl } from "@/services/productService";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * 📦 Banner Detail Screen (Sale Products Page)
 * Displays all products associated with a specific marketing banner.
 */
export default function BannerDetailScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<BannerProduct[]>([]);
  const [bannerTitle, setBannerTitle] = useState(title || "Chương trình khuyến mãi");

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      const resp = await bannerService.getBannerDetail(id);
      if (resp.success && resp.data) {
        setProducts(resp.data.products || []);
        if (resp.data.title) setBannerTitle(resp.data.title);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  /**
   * Render single product item
   */
  const renderProduct = ({ item }: { item: any }) => {
    const productId = item._id || item.id;
    // Sử dụng chung hàm lấy ảnh từ productService để hỗ trợ cả 2 format (imageUrl hoặc images[])
    const imageUrl = item.imageUrl || getProductImageUrl(item as any);

    return (
      <TouchableOpacity 
        style={styles.productCard}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: "/products/[id]", params: { id: productId } })}
      >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImg}>
             <IconSymbol name="eye.slash" size={32} color="#cbd5e1" />
          </View>
        )}
        <View style={styles.saleBadge}>
          <Text style={styles.saleText}>Giảm giá</Text>
        </View>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.productFooter}>
          <View>
            <Text style={styles.discountedPrice}>{formatPrice(item.discountedPrice)}</Text>
            <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={(e) => {
               // Prevent parent ripple
               e.stopPropagation();
            }}
          >
            <Ionicons name="cart-outline" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{
          headerTitle: bannerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <IconSymbol name="arrow.left" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
          headerTitleStyle: { fontWeight: "700" },
          headerShown: true, 
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#26C6DA" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="eye.slash" size={60} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Thông báo</Text>
          <Text style={styles.emptyText}>Hiện chưa có sản phẩm khuyến mãi cho chương trình này.</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
             <Text style={styles.goBackText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => `${item._id || item.id}-${index}`}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => <View style={{ height: 100 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },
  listContent: {
    padding: 12,
  },
  productCard: {
    flex: 0.5,
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#f1f5f9",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    height: 38,
  },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  discountedPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  originalPrice: {
    fontSize: 10,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#26C6DA",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  goBackBtn: {
    backgroundColor: "#26C6DA",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goBackText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
