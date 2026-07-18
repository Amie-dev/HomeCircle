import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../utils/supabase";
import { useGuestProfileStore } from "../../store/useGuestProfileStore";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function GuardDetailsScreen() {
  const router = useRouter();
  const { signupData, setProfile } = useProfileStore();

  const [societyQuery, setSocietyQuery] = useState("");
  const [validating, setValidating] = useState(false);
  const [societyData, setSocietyData] = useState<any | null>(null);
  const [societyError, setSocietyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounced Society Lookup
  useEffect(() => {
    if (societyQuery.trim().length < 3) {
      setSocietyData(null);
      setSocietyError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidating(true);
      setSocietyError(null);
      try {
        const query = societyQuery.trim();
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(query);

        let selectQuery = supabase.from("societies").select("*");
        if (isUuid) {
          selectQuery = selectQuery.eq("id", query);
        } else {
          selectQuery = selectQuery.or(`society_id.eq.${query.toLowerCase()},name.ilike.%${query}%`);
        }

        const { data, error } = await selectQuery.maybeSingle();

        if (error) throw error;

        if (data) {
          setSocietyData(data);
          setSocietyError(null);
        } else {
          setSocietyData(null);
          setSocietyError("Invalid society name or unique ID code.");
        }
      } catch (err: any) {
        console.warn("Society lookup failed:", err.message);
        setSocietyError("Lookup failed. Run migrations to verify tables exist.");
      } finally {
        setValidating(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [societyQuery]);

  const handleRegisterGuard = async () => {
    if (!signupData) {
      Alert.alert("Registration Session Lost", "Please go back and start again.");
      return;
    }

    if (!societyData) {
      Alert.alert(
        "Validation Check",
        "Could not verify society details in Supabase database.\n\nDo you want to proceed with mock registry details for development/testing?",
        [
          {
            text: "Proceed Mock",
            onPress: () => completeRegistrationOffline(),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Profile into guestusers
      const { error: insertUserErr } = await supabase
        .from("guestusers")
        .insert({
          id: signupData.id,
          full_name: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          vehicle_number: null,
          notification_token: null,
        });

      if (insertUserErr) throw insertUserErr;

      // 2. Insert verification request
      const { error: insertVerifyErr } = await supabase
        .from("userverifications")
        .insert({
          user_id: signupData.id,
          role: "Guard",
          society_id: societyData.id,
          is_verified: false, // Needs admin approval
          verified_by: null,
          verify_user_id: null,
          verified_at: null,
          verification_details: {
            societyName: societyData.name,
            officerName: signupData.fullName,
          },
        });

      if (insertVerifyErr) throw insertVerifyErr;

      // 3. Hydrate Zustand
      await setProfile({
        id: signupData.id,
        fullName: signupData.fullName,
        email: signupData.email,
        phone: signupData.phone,
        role: "Guard",
        isVerified: false,
        societyId: societyData.id,
        societyName: societyData.name,
      });

      Alert.alert(
        "Guard Profile Registered",
        `Details submitted for ${societyData.name} Admin approval. Gate access remains pending until verified.`,
        [{ text: "Done", onPress: () => router.replace("/guard" as any) }]
      );
    } catch (err: any) {
      Alert.alert("Error registering", err.message || "Failed to complete details.");
    } finally {
      setLoading(false);
    }
  };

  const handleMaybeLater = async () => {
    setLoading(true);
    try {
      if (signupData) {
        // Hydrate as Guard profile (unverified/no society yet)
        await setProfile({
          id: signupData.id,
          fullName: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          role: "Guard",
          isVerified: false,
          societyId: "",
          societyName: "",
        });

        // Register in guestusers table
        await supabase
          .from("guestusers")
          .insert({
            id: signupData.id,
            full_name: signupData.fullName,
            email: signupData.email,
            phone: signupData.phone,
            vehicle_number: null,
            notification_token: null,
          });
      }
      router.replace("/guard" as any);
    } catch (e) {
      router.replace("/guard" as any);
    } finally {
      setLoading(false);
    }
  };

  const completeRegistrationOffline = async () => {
    setLoading(true);
    try {
      const mockSocName = societyQuery || "Skyline Residency";

      await setProfile({
        id: signupData?.id || "mock-guard-id-" + Date.now(),
        fullName: signupData?.fullName || "Officer Rajesh Kumar",
        email: signupData?.email || "guard@example.com",
        phone: signupData?.phone || "9876543210",
        role: "Guard",
        isVerified: false, // Awaiting verification
        societyId: "mock-soc-1",
        societyName: mockSocName,
      });

      Alert.alert(
        "Verification Submitted (Mock)",
        `Successfully submitted guard verification request for ${mockSocName}.`,
        [{ text: "Done", onPress: () => router.replace("/(guard)" as any) }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <StatusBar style="light" />

        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Guard Profile</Text>
        </View>

        {/* Card Visual layout */}
        <View style={styles.officerCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="security" size={40} color={theme.colors.secondary} />
            <View style={styles.officerDetails}>
              <Text style={styles.statusLabel}>PENDING ACTIVATION</Text>
              <Text style={styles.officerName}>{signupData?.fullName || "Officer Rajesh Kumar"}</Text>
            </View>
          </View>
          <View style={styles.cardWatermark}>
            <MaterialIcons name="verified-user" size={72} color={theme.colors.outlineVariant} />
          </View>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressRow}>
          <View style={styles.progressFill} />
          <View style={styles.progressFill} />
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Society search input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>SOCIETY NAME OR UNIQUE ID</Text>
            <View
              style={[
                styles.inputBox,
                societyError ? styles.inputBoxError : societyData ? styles.inputBoxSuccess : null,
              ]}
            >
              <MaterialIcons name="corporate-fare" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter ID e.g. HC-9921 or Name..."
                placeholderTextColor={theme.colors.outline}
                value={societyQuery}
                onChangeText={setSocietyQuery}
              />
              {validating && <ActivityIndicator size="small" color={theme.colors.secondary} />}
              {!validating && societyData && (
                <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
              )}
              {!validating && societyError && (
                <MaterialIcons name="error" size={20} color={theme.colors.error} />
              )}
            </View>
            {societyError && <Text style={styles.errorText}>{societyError}</Text>}
            {!societyError && societyData && (
              <Text style={styles.successText}>
                ✓ Verified: {societyData.name} ({societyData.society_id ? societyData.society_id.toUpperCase() : "No Code"})
              </Text>
            )}
            <Text style={styles.inputHelper}>Ask your Facility Manager for the HomeCircle Society ID.</Text>
          </View>

          {/* Instructions Panel */}
          <View style={styles.instructionsPanel}>
            <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
            <View style={styles.instructionsTextWrapper}>
              <Text style={styles.instructionsHeader}>Important Instructions</Text>
              <Text style={styles.instructionItem}>• You must be physically present at the gate.</Text>
              <Text style={styles.instructionItem}>• Geo-location will be verified upon activation.</Text>
              <Text style={styles.instructionItem}>• Have your physical ID card ready for supervisor scan.</Text>
            </View>
          </View>

          {/* Map placeholder card */}
          <View style={styles.mapCard}>
            <View style={styles.mapBadge}>
              <MaterialIcons name="location-on" size={14} color={theme.colors.secondary} />
              <Text style={styles.mapBadgeText}>GATE STATUS: READY</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleRegisterGuard}
            style={styles.submitBtn}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Complete Registration</Text>
                <MaterialIcons name="qr-code-scanner" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          {/* Maybe Later */}
          <TouchableOpacity
            onPress={handleMaybeLater}
            style={styles.maybeLaterBtn}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.maybeLaterBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
    marginLeft: theme.spacing.md,
  },
  officerCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
    position: "relative",
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    zIndex: 10,
  },
  officerDetails: {
    flex: 1,
  },
  statusLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  officerName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "700",
    marginTop: 2,
  },
  cardWatermark: {
    position: "absolute",
    right: -10,
    bottom: -15,
    opacity: 0.08,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: theme.spacing.xl,
  },
  progressFill: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
  },
  formContainer: {
    gap: theme.spacing.lg,
  },
  inputWrapper: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputBoxSuccess: {
    borderColor: "#2e7d32",
  },
  inputBoxError: {
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
  },
  inputHelper: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    paddingHorizontal: 4,
    fontStyle: "italic",
    marginTop: 2,
  },
  errorText: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
    paddingHorizontal: 4,
  },
  successText: {
    ...theme.typography.labelMd,
    color: "#2e7d32",
    paddingHorizontal: 4,
  },
  instructionsPanel: {
    flexDirection: "row",
    backgroundColor: "rgba(13, 28, 47, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(13, 28, 47, 0.1)",
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  instructionsTextWrapper: {
    flex: 1,
    gap: 4,
  },
  instructionsHeader: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  instructionItem: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  mapCard: {
    height: 128,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: theme.spacing.sm,
    opacity: 0.7,
  },
  mapBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 9999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    gap: 4,
  },
  mapBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.onSurfaceVariant,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: theme.spacing.sm,
  },
  submitBtnText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontSize: 15,
  },
  maybeLaterBtn: {
    backgroundColor: "transparent",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  maybeLaterBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 15,
  },
});
