import React from "react";
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function GuardLayout() {
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
  if (profile.role !== "Guard") {
    if (profile.role === "Admin") return <Redirect href="/admin" />;
    if (profile.role === "Resident") return <Redirect href="/resident" />;
    return <Redirect href="/request-pass" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
