import React from "react";
import { Redirect, Tabs } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function AdminLayout() {
  const { profile, isLoadingProfile } = useProfileStore();

  if (isLoadingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
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
    if (profile.role === "Resident") return <Redirect href="/(resident)" />;
    if (profile.role === "Guard") return <Redirect href="/(guard)" />;
    return <Redirect href="/request-pass" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
