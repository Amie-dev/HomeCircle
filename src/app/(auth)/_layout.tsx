import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

/**
 * Auth Group Layout Guard
 *
 * Prevents already-authenticated users from accessing auth screens
 * (login, create-account, guard-details, resident-details, society-setup).
 * Redirects them to their role-appropriate home screen.
 */
export default function AuthLayout() {
  const { profile, isLoadingProfile } = useProfileStore();

  // While profile is being loaded from storage, show a spinner
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

  // If the user is already logged in, redirect away from auth screens
  if (profile) {
    if (profile.role === "Guard") return <Redirect href="/guard" />;
    if (profile.role === "Admin") return <Redirect href="/admin" />;
    if (profile.role === "Resident") return <Redirect href="/resident" />;
    // Guest / unknown role
    return <Redirect href="/request-pass" />;
  }

  // Not logged in — render the auth screens normally
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
