import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
} from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const MARGIN = 20;
const TAB_BAR_WIDTH = width - MARGIN * 2;

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
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
          const { options } = descriptors[route.key];
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
          if (route.name === "explore") iconName = "paperplane.fill";
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Đổ bóng cho Android
    elevation: 10,
  },
  tabContent: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#1e293b", // Navy đậm hiện đại
    borderRadius: 32,
    alignItems: "center",
    paddingHorizontal: 5,
    overflow: "hidden",
  },
  activeIndicator: {
    position: "absolute",
    height: 48,
    backgroundColor: "#6366f1", // Màu Indigo rực rỡ
    borderRadius: 24,
    marginHorizontal: 5,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  }
});
