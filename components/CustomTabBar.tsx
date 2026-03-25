import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./ui/icon-symbol";

const { width } = Dimensions.get("window");
const MARGIN = 20;
const TAB_BAR_WIDTH = width - MARGIN * 2;

const ACTIVE_COLOR = "#26C6DA";
const INACTIVE_COLOR = "#94a3b8";
const GLOW_COLOR = "rgba(38, 198, 218, 0.3)";

function TabIcon({
  iconName,
  isFocused,
  onPress,
}: {
  iconName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
        speed: 80,
        bounciness: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 18,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.8],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.tabItem}
      activeOpacity={1}
    >
      {/* Glow burst on tap */}
      <Animated.View
        style={[
          styles.glowBurst,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Icon with scale bounce */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconSymbol
          name={iconName}
          size={26}
          color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </Animated.View>

      {/* Active dot indicator below icon */}
      {isFocused && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const validTabNames = ["index", "products", "profile"];
  const visibleRoutes = state.routes.filter((route: any) =>
    validTabNames.includes(route.name)
  );

  const activeRoute = state.routes[state.index];
  const activeVisibleIndex = visibleRoutes.findIndex(
    (r: any) => r.name === activeRoute.name
  );

  return (
    <View
      style={[
        styles.container,
        { bottom: Platform.OS === "ios" ? insets.bottom + 8 : 20 },
      ]}
    >
      {/* Gradient border */}
      <LinearGradient
        colors={["#26C6DA", "#1E3A5F", "#26C6DA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.tabContent}>
          {visibleRoutes.map((route: any, index: number) => {
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
              <TabIcon
                key={route.key}
                iconName={iconName}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </LinearGradient>

      {/* Glow shadow under bar */}
      <View style={styles.shadowGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: TAB_BAR_WIDTH,
    zIndex: 100,
  },
  gradientBorder: {
    borderRadius: 36,
    padding: 2,
    shadowColor: "#26C6DA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  tabContent: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#fff",
    borderRadius: 34,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  glowBurst: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GLOW_COLOR,
  },
  activeDot: {
    position: "absolute",
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ACTIVE_COLOR,
  },
  shadowGlow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: "60%",
    height: 12,
    borderRadius: 10,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
