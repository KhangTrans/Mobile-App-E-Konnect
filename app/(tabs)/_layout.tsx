import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Sản Phẩm",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài Khoản",
        }}
      />
    </Tabs>
  );
}
