import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { supabase } from "../../../utils/supabase";
import { useProfileStore } from "../../store/useProfileStore";
import { useGuestProfileStore } from "../../store/useGuestProfileStore";
import { useRequestResidentVerify } from "../../hooks/useRequestResident";

export default function ResidentDetailsScreen() {
  const router = useRouter();
  const { signupData, setProfile } = useProfileStore();
  const { mutateAsync: requestResidentVerify } = useRequestResidentVerify();

  const [societyQuery, setSocietyQuery] = useState("");
  const [towerQuery, setTowerQuery] = useState("");
  const [flatQuery, setFlatQuery] = useState("");

  // Validation States
  const [validatingSociety, setValidatingSociety] = useState(false);
  const [societyData, setSocietyData] = useState<any | null>(null);
  const [societyError, setSocietyError] = useState<string | null>(null);

  const [validatingTower, setValidatingTower] = useState(false);
  const [towerData, setTowerData] = useState<any | null>(null);
  const [towerError, setTowerError] = useState<string | null>(null);

  const [validatingFlat, setValidatingFlat] = useState(false);
  const [flatData, setFlatData] = useState<any | null>(null);
  const [flatError, setFlatError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // 1. Debounced Society Check
  useEffect(() => {
    if (societyQuery.trim().length < 3) {
      setSocietyData(null);
      setSocietyError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingSociety(true);
      setSocietyError(null);
      try {
        const query = societyQuery.trim();
        // Check UUID vs Name
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
        // Fallback warning
        setSocietyError("Lookup failed. Run migrations to verify tables exist.");
      } finally {
        setValidatingSociety(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [societyQuery]);

  // 2. Debounced Tower Check
  useEffect(() => {
    if (!societyData || towerQuery.trim().length === 0) {
      setTowerData(null);
      setTowerError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingTower(true);
      setTowerError(null);
      try {
        const { data, error } = await supabase
          .from("towers")
          .select("*")
          .eq("society_id", societyData.id)
          .ilike("name", towerQuery.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTowerData(data);
          setTowerError(null);
        } else {
          setTowerData(null);
          setTowerError("Tower/Block does not exist in this society.");
        }
      } catch (err: any) {
        console.warn("Tower lookup failed:", err.message);
        setTowerError("Database validation failed.");
      } finally {
        setValidatingTower(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [towerQuery, societyData]);

  // 3. Debounced Flat Check
  useEffect(() => {
    if (!towerData || flatQuery.trim().length === 0) {
      setFlatData(null);
      setFlatError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingFlat(true);
      setFlatError(null);
      try {
        const { data, error } = await supabase
          .from("flats")
          .select("*")
          .eq("tower_id", towerData.id)
          .eq("flat_number", flatQuery.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFlatData(data);
          setFlatError(null);
        } else {
          setFlatData(null);
          setFlatError("Flat number does not exist in this tower.");
        }
      } catch (err: any) {
        console.warn("Flat lookup failed:", err.message);
        setFlatError("Database validation failed.");
      } finally {
        setValidatingFlat(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [flatQuery, towerData]);

  const handleRegisterResident = async () => {
    if (!signupData) {
      Alert.alert("Registration Session Lost", "Please go back and start again.");
      return;
    }

    // Force validation checks unless in mock environment
    const isMock = !societyData || !towerData || !flatData;

    if (isMock) {
      Alert.alert(
        "Validation Check",
        "Could not verify all fields in Supabase database.\n\nDo you want to proceed with mock registry details for development/testing?",
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
      // Submit registration details and verification request via hook
      await requestResidentVerify({
        userId: signupData.id,
        fullName: signupData.fullName,
        email: signupData.email,
        phone: signupData.phone,
        societyId: societyData.id,
        towerId: towerData.id,
        flatId: flatData.id,
        societyName: societyData.name,
        towerName: towerData.name,
        flatNumber: flatData.flat_number,
      });

      // 3. Hydrate Zustand
      await setProfile({
        id: signupData.id,
        fullName: signupData.fullName,
        email: signupData.email,
        phone: signupData.phone,
        role: "Resident",
        isVerified: false,
        societyId: societyData.id,
        societyName: societyData.name,
        towerName: towerData.name,
        flatName: flatData.flat_number,
      });

      Alert.alert(
        "Verification Submitted",
        `Details sent to ${societyData.name} Admin for verification. Once approved, you will get access.`,
        [{ text: "Done", onPress: () => router.replace("/(resident)" as any) }]
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
        // Hydrate as Resident profile (unverified/no society yet)
        await setProfile({
          id: signupData.id,
          fullName: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          role: "Resident",
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
      router.replace("/resident" as any);
    } catch (e) {
      router.replace("/resident" as any);
    } finally {
      setLoading(false);
    }
  };

  const completeRegistrationOffline = async () => {
    setLoading(true);
    try {
      const mockSocName = societyQuery || "Emerald Heights";
      const mockTower = towerQuery || "Block C";
      const mockFlat = flatQuery || "402";

      await setProfile({
        id: signupData?.id || "mock-user-id-" + Date.now(),
        fullName: signupData?.fullName || "Resident User",
        email: signupData?.email || "resident@example.com",
        phone: signupData?.phone || "9876543210",
        role: "Resident",
        isVerified: false, // Awaiting verification
        societyId: "mock-soc-1",
        societyName: mockSocName,
        towerName: mockTower,
        flatName: mockFlat,
      });

      Alert.alert(
        "Verification Submitted (Mock)",
        `Successfully submitted verification request for ${mockSocName}, ${mockTower}, Flat ${mockFlat}.`,
        [{ text: "Done", onPress: () => router.replace("/(resident)" as any) }]
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
        <Text style={styles.headerLogo}>HomeCircle</Text>
      </View>

      {/* Progress indicators */}
      <View style={styles.progressRow}>
        <View style={styles.progressFill} />
        <View style={styles.progressFill} />
      </View>

      {/* Headline */}
      <View style={styles.headline}>
        <Text style={styles.title}>Complete Resident Profile</Text>
        <Text style={styles.subtitle}>
          Secure your home access by providing your specific residency details.
        </Text>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <MaterialIcons name="verified-user" size={18} color="#ffffff" />
        <Text style={styles.bannerText}>Verified Residency Program</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Society Name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>SOCIETY NAME OR ID</Text>
          <View
            style={[
              styles.inputBox,
              societyError ? styles.inputBoxError : societyData ? styles.inputBoxSuccess : null,
            ]}
          >
            <MaterialIcons name="apartment" size={20} color={theme.colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Emerald Heights or Society ID"
              placeholderTextColor={theme.colors.outline}
              value={societyQuery}
              onChangeText={setSocietyQuery}
              autoCapitalize="words"
            />
            {validatingSociety && <ActivityIndicator size="small" color={theme.colors.secondary} />}
            {!validatingSociety && societyData && (
              <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
            )}
            {!validatingSociety && societyError && (
              <MaterialIcons name="error" size={20} color={theme.colors.error} />
            )}
          </View>
          {societyError && <Text style={styles.errorText}>{societyError}</Text>}
          {!societyError && societyData && (
            <Text style={styles.successText}>
              ✓ Verified: {societyData.name} ({societyData.society_id ? societyData.society_id.toUpperCase() : "No Code"})
            </Text>
          )}
        </View>

        {/* Tower & Flat row */}
        <View style={styles.gridRow}>
          {/* Tower */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.inputLabel}>TOWER / BLOCK</Text>
            <View
              style={[
                styles.inputBox,
                towerError ? styles.inputBoxError : towerData ? styles.inputBoxSuccess : null,
                !societyData && styles.inputBoxDisabled,
              ]}
            >
              <MaterialIcons name="domain" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Block C"
                placeholderTextColor={theme.colors.outline}
                value={towerQuery}
                onChangeText={setTowerQuery}
                editable={!!societyData}
              />
              {validatingTower && <ActivityIndicator size="small" color={theme.colors.secondary} />}
              {!validatingTower && towerData && (
                <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
              )}
            </View>
            {towerError && <Text style={styles.errorText}>{towerError}</Text>}
          </View>

          {/* Flat */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.inputLabel}>FLAT NUMBER</Text>
            <View
              style={[
                styles.inputBox,
                flatError ? styles.inputBoxError : flatData ? styles.inputBoxSuccess : null,
                !towerData && styles.inputBoxDisabled,
              ]}
            >
              <MaterialIcons name="door-front" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 402"
                placeholderTextColor={theme.colors.outline}
                value={flatQuery}
                onChangeText={setFlatQuery}
                editable={!!towerData}
              />
              {validatingFlat && <ActivityIndicator size="small" color={theme.colors.secondary} />}
              {!validatingFlat && flatData && (
                <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
              )}
            </View>
            {flatError && <Text style={styles.errorText}>{flatError}</Text>}
          </View>
        </View>

        {/* Tip Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={theme.colors.secondary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your details will be sent to the society administrator for approval. This ensures the security of all residents.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleRegisterResident}
          style={styles.submitBtn}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Complete Registration</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
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

        {/* Support Link */}
        <View style={styles.support}>
          <Text style={styles.supportLabel}>Can't find your society?</Text>
          <TouchableOpacity onPress={() => Alert.alert("Support", "Connecting to support desk...")}>
            <Text style={styles.supportLink}>Contact Admin Support</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerLogo: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
    marginLeft: theme.spacing.md,
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
  headline: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: theme.spacing.xl,
  },
  bannerText: {
    ...theme.typography.labelMd,
    color: "#ffffff",
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
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputBoxDisabled: {
    backgroundColor: theme.colors.surfaceContainerLow,
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
  gridRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
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
  support: {
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: 4,
  },
  supportLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  supportLink: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    textDecorationLine: "underline",
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
