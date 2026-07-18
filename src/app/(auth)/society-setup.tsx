import React, { useState } from "react";
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

export default function SocietySetupScreen() {
  const router = useRouter();
  const { signupData, setProfile } = useProfileStore();

  const [societyName, setSocietyName] = useState("");
  const [address, setAddress] = useState("");
  const [towersCount, setTowersCount] = useState("");
  const [flatsCount, setFlatsCount] = useState("");
  const [customId, setCustomId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinishSetup = async () => {
    if (!societyName || !customId || !address || !towersCount || !flatsCount) {
      Alert.alert("Missing Fields", "Please fill in all society configuration fields.");
      return;
    }

    if (customId.trim().length < 4 || customId.trim().length > 6) {
      Alert.alert("Invalid ID", "Society unique ID must be between 4 and 6 characters (e.g. ap001).");
      return;
    }

    if (!signupData) {
      Alert.alert("Registration Session Lost", "Please go back and start again.");
      return;
    }

    const nTowers = parseInt(towersCount);
    const nFlats = parseInt(flatsCount);

    if (isNaN(nTowers) || nTowers <= 0 || isNaN(nFlats) || nFlats <= 0) {
      Alert.alert("Invalid Input", "Please enter positive numbers for towers and flats.");
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Profile into guestusers
      const { data: userData, error: insertUserErr } = await supabase
        .from("guestusers")
        .insert({
          id: signupData.id,
          full_name: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          vehicle_number: null,
          notification_token: null,
        })
        .select()
        .single();

      if (insertUserErr) throw insertUserErr;

      // 2. Insert new society
      const { data: societyData, error: societyError } = await supabase
        .from("societies")
        .insert({
          society_id: customId.trim().toLowerCase(),
          name: societyName.trim(),
          address: address.trim(),
        })
        .select()
        .single();

      if (societyError) throw societyError;

      const societyId = societyData.id;

      // 3. Auto-populate Towers & Flats
      // We will create Tower A, Tower B, etc. up to nTowers
      const towerInsertData = [];
      for (let i = 0; i < nTowers; i++) {
        const char = String.fromCharCode(65 + (i % 26)); // A, B, C...
        const prefix = i >= 26 ? Math.floor(i / 26) + 1 : "";
        towerInsertData.push({
          society_id: societyId,
          name: `Tower ${char}${prefix}`,
        });
      }

      const { data: towersList, error: towerInsertError } = await supabase
        .from("towers")
        .insert(towerInsertData)
        .select();

      if (towerInsertError) throw towerInsertError;

      // We will distribute the nFlats across the created towers
      const flatsPerTower = Math.max(1, Math.floor(nFlats / nTowers));
      const flatInsertData = [];

      for (const t of towersList || []) {
        for (let j = 1; j <= flatsPerTower; j++) {
          // Generate flat numbers like 101, 102, 201, 202, etc.
          const floor = Math.floor((j - 1) / 4) + 1;
          const num = ((j - 1) % 4) + 1;
          const flatNum = `${floor}0${num}`;
          flatInsertData.push({
            tower_id: t.id,
            flat_number: flatNum,
          });
        }
      }

      if (flatInsertData.length > 0) {
        const { error: flatInsertError } = await supabase
          .from("flats")
          .insert(flatInsertData);

        if (flatInsertError) throw flatInsertError;
      }

      // 4. Insert admin row in userverifications (auto-verified)
      const { error: insertVerifyErr } = await supabase
        .from("userverifications")
        .insert({
          user_id: signupData.id,
          role: "Admin",
          society_id: societyId,
          is_verified: true, // Admin is immediately verified
          verified_by: "System",
          verify_user_id: signupData.id,
          verified_at: new Date().toISOString(),
          verification_details: {
            societyName: societyName.trim(),
            towersCount: nTowers,
            flatsCount: nFlats,
          },
        });

      if (insertVerifyErr) throw insertVerifyErr;

      // 5. Hydrate Zustand
      await setProfile({
        id: signupData.id,
        fullName: signupData.fullName,
        email: signupData.email,
        phone: signupData.phone,
        role: "Admin",
        isVerified: true,
        societyId: societyId,
        societyName: societyName.trim(),
      });

      Alert.alert(
        "Society Registered!",
        `Society "${societyName}" and its digital concierge are set up successfully.`,
        [{ text: "OK", onPress: () => router.replace("/admin" as any) }]
      );
    } catch (err: any) {
      const message = err.message || "Failed to complete society registration";
      if (message.includes("relation") || message.includes("schema cache")) {
        Alert.alert(
          "DB Warning",
          "Supabase tables are missing. Registering society offline in mockup state for testing.",
          [
            {
              text: "Continue Offline",
              onPress: () => completeRegistrationOffline(nTowers, nFlats),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Registration Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMaybeLater = async () => {
    setLoading(true);
    try {
      if (signupData) {
        // Hydrate as Admin profile (unverified/no society yet)
        await setProfile({
          id: signupData.id,
          fullName: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          role: "Admin",
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
      router.replace("/admin" as any);
    } catch (e) {
      router.replace("/admin" as any);
    } finally {
      setLoading(false);
    }
  };

  const completeRegistrationOffline = async (nTowers: number, nFlats: number) => {
    setLoading(true);
    try {
      await setProfile({
        id: signupData?.id || "mock-admin-id-" + Date.now(),
        fullName: signupData?.fullName || "Property Manager",
        email: signupData?.email || "admin@example.com",
        phone: signupData?.phone || "9876543210",
        role: "Admin",
        isVerified: true,
        societyId: "mock-soc-1",
        societyName: societyName.trim(),
      });

      Alert.alert(
        "Setup Finished (Mock)",
        `Offline mock setup complete for society: "${societyName}" with ${nTowers} Towers and ${nFlats} Flats.`,
        [{ text: "OK", onPress: () => router.replace("/(admin)" as any) }]
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
        <Text style={styles.headerLogo}>HomeCircle</Text>
      </View>

      {/* Stepper progress */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperItem}>
          <View style={styles.stepCircleActive}>
            <MaterialIcons name="check" size={14} color="#ffffff" />
          </View>
          <Text style={styles.stepTextActive}>Account</Text>
        </View>
        <View style={styles.stepperLineActive} />
        <View style={styles.stepperItem}>
          <View style={styles.stepCircleActive}>
            <Text style={styles.stepNumberActive}>2</Text>
          </View>
          <Text style={styles.stepTextActive}>Society</Text>
        </View>
        <View style={styles.stepperLine} />
        <View style={styles.stepperItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepText}>Setup</Text>
        </View>
      </View>

      {/* Headline */}
      <View style={styles.headline}>
        <Text style={styles.title}>Register Society</Text>
        <Text style={styles.subtitle}>
          Provide the foundational details to set up your digital concierge ecosystem.
        </Text>
      </View>

      {/* Form container */}
      <View style={styles.formContainer}>
        {/* Society Name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>SOCIETY NAME</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="apartment" size={20} color={theme.colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Skyline Residency"
              placeholderTextColor={theme.colors.outline}
              value={societyName}
              onChangeText={setSocietyName}
            />
          </View>
        </View>

        {/* Society Unique ID */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>SOCIETY UNIQUE ID (4-6 DIGITS)</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="vpn-key" size={20} color={theme.colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. ap001, gp01"
              placeholderTextColor={theme.colors.outline}
              autoCapitalize="none"
              maxLength={6}
              value={customId}
              onChangeText={setCustomId}
            />
          </View>
        </View>

        {/* Location / Address */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>LOCATION / ADDRESS</Text>
          <View style={[styles.inputBox, styles.textAreaBox]}>
            <MaterialIcons name="location-on" size={20} color={theme.colors.outline} style={[styles.inputIcon, styles.textAreaIcon]} />
            <TextInput
              style={styles.textArea}
              placeholder="Full street address, city, and zip code"
              placeholderTextColor={theme.colors.outline}
              multiline={true}
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        {/* Bento grid for towers and flats count */}
        <View style={styles.gridRow}>
          {/* Towers Count */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.inputLabel}>TOWERS / BLOCKS</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="domain" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="00"
                placeholderTextColor={theme.colors.outline}
                keyboardType="numeric"
                value={towersCount}
                onChangeText={setTowersCount}
              />
            </View>
          </View>

          {/* Flats Count */}
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.inputLabel}>TOTAL FLATS</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="meeting-room" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="000"
                placeholderTextColor={theme.colors.outline}
                keyboardType="numeric"
                value={flatsCount}
                onChangeText={setFlatsCount}
              />
            </View>
          </View>
        </View>

        {/* Map visual card */}
        <View style={styles.mapCard}>
          <View style={styles.mapBadge}>
            <MaterialIcons name="verified" size={14} color={theme.colors.secondary} />
            <Text style={styles.mapBadgeText}>AUTO-VERIFYING ADDRESS...</Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleFinishSetup}
          style={styles.submitBtn}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Finish Setup</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  headerLogo: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: theme.spacing.xl,
  },
  stepperItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberActive: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    fontWeight: "700",
  },
  stepNumber: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  stepTextActive: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 10,
    fontWeight: "700",
  },
  stepText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  stepperLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.surfaceContainerHighest,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  headline: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.headlineLgMobile,
    fontSize: 22,
    color: theme.colors.onSurface,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  inputWrapper: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 4,
    fontSize: 10,
    letterSpacing: 0.8,
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
  textAreaBox: {
    height: 96,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
  },
  textArea: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
    textAlignVertical: "top",
  },
  gridRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  mapCard: {
    height: 128,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "flex-end",
    padding: theme.spacing.md,
    opacity: 0.6,
  },
  mapBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
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
    marginBottom: theme.spacing.md,
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
