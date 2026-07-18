import React from "react";
import { Redirect, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function GlobalLayout() {
  const { profile, isLoadingProfile } = useProfileStore();

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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
