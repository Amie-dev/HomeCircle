import { Stack } from "expo-router";
import React from "react";

export default function AdminHomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="staff" />
      <Stack.Screen name="complaints" />
      <Stack.Screen name="dues" />
    </Stack>
  );
}
