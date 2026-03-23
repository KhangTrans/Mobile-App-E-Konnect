import * as Haptics from "expo-haptics";
import React from "react";
import {
    Dimensions,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./ui/icon-symbol";

const { width } = Dimensions.get("window");
const MARGIN = 20;
const TAB_BAR_WIDTH = width - MARGIN * 2;

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  // Chỉ lấy đúng 3 tab chính, bỏ qua các màn hình chi tiết như banner-detail/[id]
  const validTabNames = ["index", "products", "profile"];
  const visibleRoutes = state.routes.filter((route: any) => {
    return validTabNames.includes(route.name);
  });

  const tabWidth = TAB_BAR_WIDTH / visibleRoutes.length;

  // Xác định index thực tế của item đang active trong danh sách hiển thị
  const activeRoute = state.routes[state.index];
  const activeVisibleIndex = visibleRoutes.findIndex(
    (r: any) => r.name === activeRoute.name,
  );

  // Animation cho thanh chạy (indicator)
  const translateX = useAnimatedStyle(() => {
    // Nếu màn hình hiện tại không nằm trong tab bar (ví dụ banner-detail)
    // thì giữ indicator ở vị trí trước đó (hoặc ẩn đi, ở đây ta để nó ở tab gần nhất)
    const targetIndex =
      activeVisibleIndex !== -1 ? activeVisibleIndex : state.index;

    return {
      transform: [
        {
          translateX: withSpring(targetIndex * tabWidth, {
            damping: 18,
            stiffness: 120,
            mass: 0.8,
          }),
        },
      ],
      opacity: activeVisibleIndex === -1 ? 0 : 1, // Ẩn indicator nếu ở trang chi tiết
    };
  });

  return (
    <View
      style={[
        styles.container,
        { bottom: Platform.OS === "ios" ? insets.bottom : 20 },
      ]}
    >
      <View style={styles.tabContent}>
        {/* Thanh trượt chỉ báo Active */}
        <Animated.View
          style={[styles.activeIndicator, { width: tabWidth - 10 }, translateX]}
        />

        {visibleRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = activeVisibleIndex === index;

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

          let iconName: any = "percent";
          if (route.name === "index") iconName = "house.fill";
          if (route.name === "products") iconName = "bag.fill";
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
});
