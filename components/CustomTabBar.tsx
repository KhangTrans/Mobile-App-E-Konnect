import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { IconSymbol } from "./ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { useCart } from "@/contexts/CartContext";

const { width } = Dimensions.get("window");
const MARGIN = 20;
const TAB_BAR_WIDTH = width - MARGIN * 2;

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartCount } = useCart();
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;

  // Animation cho thanh chạy (indicator)
  const translateX = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: withSpring(state.index * tabWidth, {
            damping: 18,
            stiffness: 120,
            mass: 0.8
          }) 
        }
      ],
    };
  });

  return (
    <View style={[
      styles.container, 
      { bottom: Platform.OS === "ios" ? insets.bottom : 20 }
    ]}>
      <View style={styles.tabContent}>
        {/* Thanh trượt chỉ báo Active */}
        <Animated.View style={[
          styles.activeIndicator, 
          { width: tabWidth - 10 }, 
          translateX
        ]} />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name);
            }
          };

          let iconName: any = "house.fill";
          if (route.name === "index") iconName = "house.fill";
          if (route.name === "products") iconName = "bag.fill"; // Icon túi mua sắm cho tab Sản Phẩm
          if (route.name === "profile") iconName = "person.fill";

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name={iconName} 
                size={24} 
                color={isFocused ? "#fff" : "#94a3b8"} 
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => router.push("/cart")}
          style={styles.cartButton}
          activeOpacity={0.75}
        >
          <Ionicons
            name="cart-outline"
            size={24}
            color={cartCount > 0 ? "#26C6DA" : "#94a3b8"}
          />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Animated.Text style={styles.cartBadgeText}>
                {cartCount > 99 ? "99+" : cartCount.toString()}
              </Animated.Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: TAB_BAR_WIDTH,
    zIndex: 100,
    // Đổ bóng cho iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Đổ bóng cho Android
    elevation: 6,
  },
  tabContent: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#fff", // Nền trắng
    borderRadius: 32,
    alignItems: "center",
    paddingHorizontal: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeIndicator: {
    position: "absolute",
    height: 48,
    backgroundColor: "#26C6DA", // Màu xanh Turquoise
    borderRadius: 24,
    marginHorizontal: 5,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cartButton: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  }
});
