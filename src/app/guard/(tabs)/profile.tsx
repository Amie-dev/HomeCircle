import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GuardProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, clearProfile } = useProfileStore();

  const [loading, setLoading] = useState(false);
  const [onDuty, setOnDuty] = useState(false);
  const [activeGate, setActiveGate] = useState("");

  const checkDutyStatus = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from("guard_assignments")
        .select("*")
        .eq("guard_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOnDuty(true);
        setActiveGate(data.gate_name);
      } else {
        setOnDuty(false);
        setActiveGate("");
      }
    } catch (err: any) {
      console.error("Error checking duty status:", err.message);
    }
  };

  useEffect(() => {
    checkDutyStatus();
  }, [profile?.id]);

  const handleToggleDuty = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      if (onDuty) {
        // End Shift: delete from guard_assignments
        const { error } = await supabase
          .from("guard_assignments")
          .delete()
          .eq("guard_id", profile.id);

        if (error) throw error;

        // Log to guardlogs
        if (profile.societyId) {
          try {
            await supabase.from("guardlogs").insert({
              guard_id: profile.id,
              society_id: profile.societyId,
              gate_name: activeGate || "Main Gate",
              action_type: "Logout",
              details: { action: "End Shift", time: new Date().toISOString() },
            });
          } catch (logErr) {
            console.warn("Failed to insert guard log:", logErr);
          }
        }

        Alert.alert("Shift Ended", "You are now Off Duty.");
        setOnDuty(false);
        setActiveGate("");
      } else {
        // Start Shift: insert into guard_assignments
        const { error } = await supabase
          .from("guard_assignments")
          .insert({
            guard_id: profile.id,
            gate_name: "Main Gate",
            shift_start: "08:00:00",
            shift_end: "20:00:00",
          });

        if (error) throw error;

        // Log to guardlogs
        if (profile.societyId) {
          try {
            await supabase.from("guardlogs").insert({
              guard_id: profile.id,
              society_id: profile.societyId,
              gate_name: "Main Gate",
              action_type: "Login",
              details: { action: "Start Shift", time: new Date().toISOString() },
            });
          } catch (logErr) {
            console.warn("Failed to insert guard log:", logErr);
          }
        }

        Alert.alert("Shift Started", "You are now On Duty at Main Gate.");
        setOnDuty(true);
        setActiveGate("Main Gate");
      }
    } catch (err: any) {
      Alert.alert("Duty Toggle Error", err.message || "Failed to update shift status.");
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert("Error", "Direct dial is not supported on this device.");
    });
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of your session?", [
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          // If on duty, clear assignment first
          if (onDuty && profile?.id) {
            try {
              await supabase
                .from("guard_assignments")
                .delete()
                .eq("guard_id", profile.id);

              if (profile.societyId) {
                await supabase.from("guardlogs").insert({
                  guard_id: profile.id,
                  society_id: profile.societyId,
                  gate_name: activeGate || "Main Gate",
                  action_type: "Logout",
                  details: { action: "Sign Out", time: new Date().toISOString() },
                });
              }
            } catch (err) {
              console.warn("Failed to clear assignment or log out from guard assignments/logs:", err);
            }
          }
          await clearProfile();
          router.replace("/get-started" as any);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!profile) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guard Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={22} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Guard details header */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={{
                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random&size=120`,
              }}
            />
            <View style={styles.shieldBadge}>
              <MaterialIcons name="shield" size={16} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.guardName}>{profile.fullName}</Text>
          <Text style={styles.guardSub}>Security Gate Staff</Text>
          {profile.isVerified && (
            <View style={styles.verifiedChip}>
              <MaterialIcons name="verified-user" size={14} color={theme.colors.secondary} style={{ marginRight: 4 }} />
              <Text style={styles.verifiedText}>Verified Officer</Text>
            </View>
          )}
        </View>

        {/* Shift Duty Status Card */}
        <View style={styles.dutyCard}>
          <View style={styles.dutyHeader}>
            <View>
              <Text style={styles.dutyLabel}>DUTY STATUS</Text>
              <View style={styles.dutyStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: onDuty ? theme.colors.secondary : theme.colors.outline }]} />
                <Text style={styles.dutyStatusText}>
                  {onDuty ? `Currently On Duty (${activeGate})` : "Currently Off Duty"}
                </Text>
              </View>
            </View>
            <MaterialIcons name="badge" size={32} color="rgba(255,255,255,0.4)" />
          </View>

          <View style={styles.dutyFooter}>
            <View>
              <Text style={styles.dutyLabel}>ACTIVE SHIFT</Text>
              <Text style={styles.shiftHours}>Day Shift (08:00 - 20:00)</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <TouchableOpacity
                style={[styles.toggleBtn, onDuty ? styles.toggleBtnOff : styles.toggleBtnOn]}
                onPress={handleToggleDuty}
                activeOpacity={0.8}
              >
                <Text style={styles.toggleBtnText}>
                  {onDuty ? "END SHIFT" : "START SHIFT"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactsCard}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleCall("+919876543210")}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactIconBox, { backgroundColor: "rgba(0, 106, 97, 0.08)" }]}>
                  <MaterialIcons name="business" size={20} color={theme.colors.secondary} />
                </View>
                <View>
                  <Text style={styles.contactName}>Society Manager</Text>
                  <Text style={styles.contactPhone}>+91 98765 43210</Text>
                </View>
              </View>
              <MaterialIcons name="phone" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactRow, { borderBottomWidth: 0 }]}
              onPress={() => handleCall("100")}
              activeOpacity={0.7}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactIconBox, { backgroundColor: "rgba(186, 26, 26, 0.08)" }]}>
                  <MaterialIcons name="local-police" size={20} color={theme.colors.error} />
                </View>
                <View>
                  <Text style={styles.contactName}>Local Police Station</Text>
                  <Text style={styles.contactPhone}>Dial 100 / 112</Text>
                </View>
              </View>
              <MaterialIcons name="phone" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* System Settings & Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Access</Text>
          <View style={styles.contactsCard}>
            <View style={styles.settingRow}>
              <View style={styles.contactLeft}>
                <MaterialIcons name="lock" size={20} color={theme.colors.outline} />
                <Text style={styles.settingLabel}>Change login passcode pin</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outlineVariant} />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.contactLeft}>
                <MaterialIcons name="fingerprint" size={20} color={theme.colors.outline} />
                <Text style={styles.settingLabel}>Enable Biometric Login</Text>
              </View>
              <MaterialIcons name="toggle-on" size={32} color={theme.colors.secondary} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(186, 26, 26, 0.08)",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  profileHero: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  shieldBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  guardName: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  guardSub: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 106, 97, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  verifiedText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.secondary,
    textTransform: "uppercase",
  },
  dutyCard: {
    backgroundColor: theme.colors.primaryFixed,
    borderRadius: 20,
    padding: theme.spacing.lg,
    gap: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  dutyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dutyLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    letterSpacing: 1.2,
    fontSize: 9,
    fontWeight: "700",
  },
  dutyStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyStatusText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
  },
  dutyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16,
  },
  shiftHours: {
    ...theme.typography.bodyLg,
    color: "#ffffff",
    fontWeight: "500",
    marginTop: 4,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtnOn: {
    backgroundColor: theme.colors.secondary,
  },
  toggleBtnOff: {
    backgroundColor: theme.colors.error,
  },
  toggleBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    paddingLeft: 4,
  },
  contactsCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  contactName: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  contactPhone: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  settingLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "500",
  },
});
