import React from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useRouter } from "expo-router";
import { theme } from "../../theme";
import { ResidentProfile, useProfileStore } from "../../store/useProfileStore";
import { useGuestProfileStore } from "../../store/useGuestProfileStore";

interface ProfileCardProps {
  profile: ResidentProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of your session?", [
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await useProfileStore.getState().clearProfile();
          await useGuestProfileStore.getState().clearGuestProfile();
          router.replace("/get-started" as any);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarLarge}>
        {profile.avatarUrl ? (
          <Image
            source={profile.avatarUrl}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {profile.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.profileDetails}>
        <View style={styles.profileNameRow}>
          <Text style={styles.profileName}>{profile.fullName}</Text>
          <MaterialIcons name="verified" size={18} color={theme.colors.secondary} />
        </View>
        <View style={styles.profileInfoRow}>
          <MaterialIcons name="mail" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.profileInfoText}>{profile.email}</Text>
        </View>
        <View style={styles.profileInfoRow}>
          <MaterialIcons name="call" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.profileInfoText}>{profile.phone}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 12,
    marginHorizontal: theme.spacing.containerMarginMobile,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.colors.secondaryContainer,
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
    fontSize: 24,
    fontWeight: "700",
  },
  profileDetails: {
    flex: 1,
    gap: 2,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  profileName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileInfoText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
});
