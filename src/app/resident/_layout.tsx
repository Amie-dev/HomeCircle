import React from "react";
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function ResidentLayout() {
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
  if (profile.role !== "Resident") {
    if (profile.role === "Admin") return <Redirect href="/admin" />;
    if (profile.role === "Guard") return <Redirect href="/guard" />;
    return <Redirect href="/request-pass" />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(home)" />
          <Stack.Screen name="(setting)" />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}