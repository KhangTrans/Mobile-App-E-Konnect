import { bannerService, Banner } from "@/services/bannerService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Carousel from "react-native-reanimated-carousel";

const { width } = Dimensions.get("window");

/**
 * 🎡 Home Banner Carousel Component
 * Displays active marketing banners with autoplay and navigation.
 */
export default function BannerCarousel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      const resp = await bannerService.getActiveBanners();
      if (resp.success) {
        setBanners(resp.data);
      }
      setLoading(false);
    };
    fetchBanners();
  }, []);

  /**
   * Navigate to banner detail screen
   */
  const handlePress = (banner: Banner) => {
    router.push({
      pathname: "/banner-detail/[id]",
      params: { id: banner.id, title: banner.title },
    });
  };

  /**
   * Render single banner item
   */
  const renderItem = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handlePress(item)}
      style={styles.bannerContainer}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={styles.overlay}
      >
        <Text style={styles.title}>{item.title}</Text>
        {item.description && <Text style={styles.desc}>{item.description}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  /**
   * If no banners, don't show anything
   */
  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={width - 40}
        height={180}
        autoPlay={true}
        data={banners}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => setActiveIdx(index)}
        renderItem={renderItem}
        style={styles.carousel}
      />
      
      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              activeIdx === i ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    alignItems: "center",
  },
  carousel: {
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 15,
    paddingBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  desc: {
    color: "#fff",
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: "row",
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: "#6366f1",
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#cbd5e1",
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    width: "100%",
    height: 180,
    marginTop: 15,
  },
  skeleton: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
  },
});
