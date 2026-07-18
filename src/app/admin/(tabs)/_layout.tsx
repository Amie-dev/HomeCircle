import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

export default function AdminTabsLayout() {
  const { profile, isLoadingProfile } = useProfileStore();
  const insets = useSafeAreaInsets();

  if (isLoadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  // Route to login if not logged in
  if (!profile) {
    return <Redirect href="/get-started" />;
  }

  // Role verification guard
  if (profile.role !== "Admin") {
    if (profile.role === "Resident") return <Redirect href="/resident" />;
    if (profile.role === "Guard") return <Redirect href="/guard" />;
    return <Redirect href="/request-pass" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          ...theme.typography.labelMd,
          fontSize: 10,
          marginTop: 2,
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="residents"
        options={{
          title: "Residents",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="campaign" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="assessment" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
