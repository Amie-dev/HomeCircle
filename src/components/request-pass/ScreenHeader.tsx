import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { useRouter } from "expo-router";
import { useProfileStore } from "../../store/useProfileStore";
import { useGuestProfileStore } from "../../store/useGuestProfileStore";
import { Alert } from "react-native";

interface ScreenHeaderProps {
  onBack: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ onBack }) => {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { guestProfile } = useGuestProfileStore();

  const handleAvatarPress = () => {
    if (profile) {
      if (profile.role === "Resident") {
        router.push("/resident" as any);
      } else if (profile.role === "Guard") {
        router.push("/guard" as any);
      } else if (profile.role === "Admin") {
        router.push("/admin" as any);
      }
    } else if (guestProfile) {
      Alert.alert(
        "Guest Visitor",
        "You are registered under a local guest visitor profile. Create a membership account to map to a smart society.",
        [
          { text: "Join Society", onPress: () => router.push("/create-account" as any) },
          { text: "Dismiss", style: "cancel" },
        ]
      );
    } else {
      router.push("/get-started" as any);
    }
  };

  const activeProfile = profile || guestProfile;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeHeader}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerLogo}>HomeCircle</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerAvatar} onPress={handleAvatarPress}>
            {activeProfile ? (
              activeProfile.avatarUrl ? (
                <Image
                  source={activeProfile.avatarUrl}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {activeProfile.fullName ? activeProfile.fullName.trim().charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialIcons name="person" size={18} color={theme.colors.secondary} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifyButton}>
            <MaterialIcons name="notifications" size={22} color={theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    zIndex: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.md,
    height: 60,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  headerLogo: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.secondaryContainer,
  },
  avatarFallbackText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  notifyButton: {
    padding: 4,
  },
});
