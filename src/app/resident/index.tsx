import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { theme } from "../../theme";
import { useProfileStore } from "../../store/useProfileStore";

export default function ResidentDashboard() {
  const router = useRouter();
  const { profile, clearProfile } = useProfileStore();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          router.replace("/get-started" as any);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome home,</Text>
          <Text style={styles.profileName}>{profile.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Verification Status card */}
      <View style={[styles.statusCard, profile.isVerified ? styles.statusCardVerified : styles.statusCardPending]}>
        <MaterialIcons
          name={profile.isVerified ? "verified" : "hourglass-empty"}
          size={24}
          color={profile.isVerified ? "#2e7d32" : "#f57f17"}
        />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: profile.isVerified ? "#2e7d32" : "#f57f17" }]}>
            {profile.isVerified ? "Verified Residency" : "Awaiting Verification"}
          </Text>
          <Text style={styles.statusDesc}>
            {profile.isVerified
              ? `Linked to ${profile.societyName} (T-${profile.towerName}, F-${profile.flatName})`
              : `Your request for ${profile.societyName} is pending administrator review.`}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Invited Visitors</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Recent Entries</Text>
        </View>
      </View>

      {/* Quick actions panel */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.gridRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/request-pass" as any)}
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: "rgba(13, 148, 136, 0.1)" }]}>
            <MaterialIcons name="person-add" size={24} color={theme.colors.secondary} />
          </View>
          <Text style={styles.actionTitle}>Invite Guest</Text>
          <Text style={styles.actionDesc}>Generate entry QR pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/request-pass" as any)} // Or pass history tab
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: "rgba(15, 23, 42, 0.1)" }]}>
            <MaterialIcons name="history" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Pass History</Text>
          <Text style={styles.actionDesc}>View active or expired</Text>
        </TouchableOpacity>
      </View>

      {/* Notices stream */}
      <Text style={styles.sectionTitle}>SOCIETY NOTICES</Text>
      <View style={styles.noticeCard}>
        <MaterialIcons name="campaign" size={22} color={theme.colors.secondary} />
        <View style={styles.noticeTextWrapper}>
          <Text style={styles.noticeHeader}>Water Supply Maintenance</Text>
          <Text style={styles.noticeBody}>
            Water supply will be temporarily suspended tomorrow between 10:00 AM and 12:00 PM for maintenance.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  welcomeText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
  },
  profileName: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  signOutBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  statusCard: {
    flexDirection: "row",
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: theme.spacing.md,
    alignItems: "center",
  },
  statusCardVerified: {
    backgroundColor: "#e8f5e9",
    borderColor: "#a5d6a7",
  },
  statusCardPending: {
    backgroundColor: "#fffde7",
    borderColor: "#fff59d",
  },
  statusInfo: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    ...theme.typography.button,
    fontWeight: "700",
  },
  statusDesc: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  statNumber: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    marginTop: 2,
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 0.8,
    marginTop: theme.spacing.sm,
  },
  gridRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: 6,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  actionTitle: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  actionDesc: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  noticeTextWrapper: {
    flex: 1,
    gap: 2,
  },
  noticeHeader: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  noticeBody: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});
