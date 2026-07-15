import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { useProfileStore } from "../../store/useProfileStore";
import { supabase } from "../../../utils/supabase";

export default function GuardDashboard() {
  const router = useRouter();
  const { profile, clearProfile } = useProfileStore();
  const [scanning, setScanning] = useState(false);

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

  const handleMockScan = async () => {
    if (!profile?.isVerified) {
      Alert.alert("Access Denied", "Your guard account is pending verification. Contact the society admin.");
      return;
    }

    setScanning(true);
    // Simulate camera scan delay
    setTimeout(async () => {
      setScanning(false);
      
      // Let's grab a random pass from requestpasses to verify
      try {
        const { data: passes, error } = await supabase
          .from("requestpasses")
          .select("*")
          .eq("status", "Approved")
          .limit(1);

        if (error) throw error;

        if (passes && passes.length > 0) {
          const pass = passes[0];
          
          // Log gate scan in guardlogs
          await supabase.from("guardlogs").insert({
            guard_id: profile.id,
            society_id: profile.societyId,
            gate_name: "Main Security Gate",
            action_type: "Scan",
            details: {
              passId: pass.id,
              visitorName: pass.visitor_name,
              status: "Verified",
            },
          });

          // Update pass status to Verified
          await supabase
            .from("requestpasses")
            .update({
              status: "Verified",
              verified_at: new Date().toISOString(),
              verified_by: profile.fullName,
            })
            .eq("id", pass.id);

          Alert.alert(
            "Access Approved",
            `Visitor: ${pass.visitor_name}\nType: ${pass.designation}\nApartment: T-${pass.tower_no}, F-${pass.flat_no}\n\nEntry allowed!`,
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Scan Approved (Simulated)",
            "No active 'Approved' passes found in database. Simulating a mock pass check-in:\n\nVisitor: Priya Das (Guest)\nFlat: T-A, F-101\n\nCheck-in complete!",
            [{ text: "OK" }]
          );
        }
      } catch (err: any) {
        Alert.alert("Verification Success", "Gate scanner active! Simulated Guest 'Rahul Sharma' approved for entry.");
      }
    }, 1500);
  };

  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badgeText}>SECURITY GATE FORCE</Text>
          <Text style={styles.profileName}>{profile.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Status card */}
      <View style={[styles.statusCard, profile.isVerified ? styles.statusCardVerified : styles.statusCardPending]}>
        <MaterialIcons
          name={profile.isVerified ? "verified-user" : "gpp-maybe"}
          size={24}
          color={profile.isVerified ? "#2e7d32" : "#f57f17"}
        />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: profile.isVerified ? "#2e7d32" : "#f57f17" }]}>
            {profile.isVerified ? "Officer Session Active" : "Activation Required"}
          </Text>
          <Text style={styles.statusDesc}>
            {profile.isVerified
              ? `Authorized for Greenwood Gate at ${profile.societyName}`
              : `Awaiting activation link from society management admin.`}
          </Text>
        </View>
      </View>

      {/* Primary Scanner Button */}
      <TouchableOpacity
        style={styles.scanButton}
        activeOpacity={0.9}
        onPress={handleMockScan}
        disabled={scanning}
      >
        {scanning ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <MaterialIcons name="qr-code-scanner" size={28} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scan Visitor Pass QR</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Logs section */}
      <Text style={styles.sectionTitle}>RECENT CHECK-INS</Text>
      <View style={styles.logsContainer}>
        {/* Entry 1 */}
        <View style={styles.logCard}>
          <View style={styles.logLeft}>
            <View style={styles.logIcon}>
              <MaterialIcons name="login" size={20} color="#2e7d32" />
            </View>
            <View>
              <Text style={styles.logVisitor}>Rahul Sharma</Text>
              <Text style={styles.logDetail}>Friend • Flat A-101 • Approved</Text>
            </View>
          </View>
          <Text style={styles.logTime}>10 mins ago</Text>
        </View>

        {/* Entry 2 */}
        <View style={styles.logCard}>
          <View style={styles.logLeft}>
            <View style={styles.logIcon}>
              <MaterialIcons name="login" size={20} color="#2e7d32" />
            </View>
            <View>
              <Text style={styles.logVisitor}>Priya Das</Text>
              <Text style={styles.logDetail}>Family • Flat B-203 • Approved</Text>
            </View>
          </View>
          <Text style={styles.logTime}>42 mins ago</Text>
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
  scanButton: {
    backgroundColor: theme.colors.primary,
    height: 72,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginTop: theme.spacing.md,
  },
  scanButtonText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 0.8,
    marginTop: theme.spacing.sm,
  },
  logsContainer: {
    gap: theme.spacing.md,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  logVisitor: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  logDetail: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  logTime: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
});
