import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { ResidentProfile } from "../../store/useProfileStore";

interface ProfileCardProps {
  profile: ResidentProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarLarge}>
        <Image
          source="https://lh3.googleusercontent.com/aida-public/AB6AXuBTMBh4-GIrTmlW0UH0iX_HS4vl7kjhrp-NhiMa556X8KgMN-JUGyoNkL_aokODbofEzt2S_lB8yIeE1qNAE0AVaoF1Ly7B2XjDrMy478nszltXlQ2SelaWYfNBDgA5jAVe3QQK1SNzGFtvs7uQU7Azx4lRH9donpkcJgfkFYy-gMe6cwKAxYnDCRV-N8Q9Alo2VgvkRkBsSjeikCxUHIflDuWY0PC6GAFtlO9F_co9xs4lqQPQ1CIZ7g"
          style={styles.avatarImage}
          contentFit="cover"
        />
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
});
