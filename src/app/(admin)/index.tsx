import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { theme } from "../../theme";
import { useProfileStore } from "../../store/useProfileStore";
import { supabase } from "../../../utils/supabase";

interface VerificationRequest {
  id: string;
  user_id: string;
  role: string;
  society_id: string;
  is_verified: boolean;
  guestusers: {
    full_name: string;
    email: string;
    phone: string;
  };
  verification_details: {
    societyName?: string;
    towerName?: string;
    flatNumber?: string;
  } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, clearProfile } = useProfileStore();
  const [approvingId, setApprovingId] = useState<string | null>(null);

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

  // 1. Fetch pending verifications
  const { data: pendingRequests = [], isLoading, error: queryError } = useQuery<VerificationRequest[]>({
    queryKey: ["pendingVerifications", profile?.societyId],
    queryFn: async () => {
      if (!profile?.societyId) return [];

      const { data, error } = await supabase
        .from("userverifications")
        .select(`
          id,
          user_id,
          role,
          society_id,
          is_verified,
          guestusers (
            full_name,
            email,
            phone
          ),
          verification_details
        `)
        .eq("is_verified", false)
        .eq("society_id", profile.societyId);

      if (error) {
        throw new Error(error.message);
      }

      // Map Supabase layout structure to typed keys
      return (data as any[] || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        society_id: item.society_id,
        is_verified: item.is_verified,
        guestusers: item.guestusers || { full_name: "Anonymous User", email: "N/A", phone: "N/A" },
        verification_details: item.verification_details || null,
      }));
    },
    enabled: !!profile?.societyId,
  });

  // 2. Approve Request Mutation
  const approveMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      setApprovingId(verificationId);
      const { error } = await supabase
        .from("userverifications")
        .update({
          is_verified: true,
          verified_by: profile?.fullName || "System Admin",
          verify_user_id: profile?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", verificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert("User Approved", "The profile has been successfully verified.");
      queryClient.invalidateQueries({ queryKey: ["pendingVerifications"] });
    },
    onError: (err: any) => {
      Alert.alert("Approval Error", err.message || "Failed to approve user.");
    },
    onSettled: () => {
      setApprovingId(null);
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleApproveMock = (id: string, name: string) => {
    Alert.alert("Mock Approve", `Mocking approval check for ${name}.`, [
      { text: "Confirm", onPress: () => handleApprove(id) },
    ]);
  };

  if (!profile) return null;

  // Mock list fallback if DB tables aren't matching
  const hasDbError = !!queryError;
  const mockRequests: VerificationRequest[] = [
    {
      id: "mock-v-1",
      user_id: "mock-u-1",
      role: "Resident",
      society_id: "mock-soc-1",
      is_verified: false,
      guestusers: {
        full_name: "Amit Patel",
        email: "amit@example.com",
        phone: "9823456789",
      },
      verification_details: {
        societyName: "Skyline Residency",
        towerName: "Tower A",
        flatNumber: "302",
      },
    },
    {
      id: "mock-v-2",
      user_id: "mock-u-2",
      role: "Guard",
      society_id: "mock-soc-1",
      is_verified: false,
      guestusers: {
        full_name: "Rohan Kumar",
        email: "rohan@example.com",
        phone: "9123456780",
      },
      verification_details: {
        societyName: "Skyline Residency",
      },
    },
  ];

  const activeRequests = hasDbError ? mockRequests : pendingRequests;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badgeText}>SOCIETY ADMINISTRATOR</Text>
          <Text style={styles.profileName}>{profile.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Society Details Card */}
      <View style={styles.societyCard}>
        <MaterialIcons name="apartment" size={32} color={theme.colors.onSecondaryContainer} />
        <View style={styles.societyDetails}>
          <Text style={styles.societyName}>{profile.societyName}</Text>
          <Text style={styles.societyDesc}>Central Dashboard Registry Control</Text>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{activeRequests.length}</Text>
          <Text style={styles.statLabel}>Pending Approvals</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>18</Text>
          <Text style={styles.statLabel}>Active Residents</Text>
        </View>
      </View>

      {/* Verification List Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PENDING VERIFICATIONS</Text>
        {hasDbError && <Text style={styles.dbWarning}>⚠️ Using Mock fallback</Text>}
      </View>

      {/* Approvals list */}
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginVertical: 20 }} />
      ) : activeRequests.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="done-all" size={48} color={theme.colors.outlineVariant} />
          <Text style={styles.emptyText}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>No pending resident or guard verification requests.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {activeRequests.map((item) => (
            <View key={item.id} style={styles.requestCard}>
              <View style={styles.requestCardTop}>
                <View style={styles.requestInfo}>
                  <Text style={styles.visitorName}>{item.guestusers.full_name}</Text>
                  <View style={[styles.roleBadge, item.role === "Guard" ? styles.roleGuard : styles.roleResident]}>
                    <Text style={styles.roleBadgeText}>{item.role}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => hasDbError ? handleApproveMock(item.id, item.guestusers.full_name) : handleApprove(item.id)}
                  disabled={approvingId === item.id || approveMutation.isPending}
                >
                  {approvingId === item.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.requestCardBottom}>
                <View style={styles.contactRow}>
                  <MaterialIcons name="call" size={14} color={theme.colors.outline} />
                  <Text style={styles.contactText}>{item.guestusers.phone}</Text>
                </View>
                <View style={styles.contactRow}>
                  <MaterialIcons name="mail" size={14} color={theme.colors.outline} />
                  <Text style={styles.contactText}>{item.guestusers.email}</Text>
                </View>
                {item.role === "Resident" && item.verification_details && (
                  <View style={styles.contactRow}>
                    <MaterialIcons name="meeting-room" size={14} color={theme.colors.outline} />
                    <Text style={styles.contactText}>
                      Flat: {item.verification_details.towerName} - {item.verification_details.flatNumber}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
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
  badgeText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 1,
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
  societyCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    borderRadius: 16,
    gap: theme.spacing.md,
    alignItems: "center",
  },
  societyDetails: {
    flex: 1,
  },
  societyName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSecondaryContainer,
    fontWeight: "700",
  },
  societyDesc: {
    ...theme.typography.labelMd,
    color: theme.colors.onSecondaryContainer,
    opacity: 0.8,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 0.8,
  },
  dbWarning: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
  },
  list: {
    gap: theme.spacing.md,
  },
  requestCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
  },
  requestCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  visitorName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleResident: {
    backgroundColor: "rgba(13, 148, 136, 0.1)",
  },
  roleGuard: {
    backgroundColor: "rgba(15, 23, 42, 0.1)",
  },
  roleBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
  },
  approveBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    height: 36,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  approveBtnText: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: theme.spacing.sm,
  },
  requestCardBottom: {
    gap: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    gap: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  emptySubtitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
