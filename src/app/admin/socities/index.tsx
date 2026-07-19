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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function SocietyManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useProfileStore();

  const [societyName, setSocietyName] = useState(profile?.societyName || "HomeCircle Society");
  const [address, setAddress] = useState("Sector 15, Gurgaon");
  const [towersCount, setTowersCount] = useState("0");
  const [flatsCount, setFlatsCount] = useState("0");
  const [societyIdCode, setSocietyIdCode] = useState("hc001");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSocietyDetails() {
      if (!profile?.societyId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("societies")
          .select("*")
          .eq("id", profile.societyId)
          .single();

        if (error) throw error;
        if (data) {
          setSocietyName(data.name || "");
          setAddress(data.address || "");
          setSocietyIdCode(data.society_id || "");
          setCity(data.city || "");
          setState(data.state || "");
          setPinCode(data.pin_code || "");
          setDescription(data.description || "");
          setLogoUrl(data.logo_url || "");
          setLatitude(data.latitude ? data.latitude.toString() : "");
          setLongitude(data.longitude ? data.longitude.toString() : "");
          
          // Count towers
          const { count: towers } = await supabase
            .from("towers")
            .select("*", { count: "exact", head: true })
            .eq("society_id", profile.societyId);
          
          if (towers !== null) setTowersCount(towers.toString());

          // Count flats in society towers
          const { data: towersData } = await supabase
            .from("towers")
            .select("id")
            .eq("society_id", profile.societyId);

          if (towersData && towersData.length > 0) {
            const towerIds = towersData.map((t) => t.id);
            const { count: flats } = await supabase
              .from("flats")
              .select("*", { count: "exact", head: true })
              .in("tower_id", towerIds);

            if (flats !== null) setFlatsCount(flats.toString());
          } else {
            setFlatsCount("0");
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch society from Supabase:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSocietyDetails();
  }, [profile?.societyId]);

  const handleSave = async () => {
    if (!societyName.trim() || !address.trim()) {
      Alert.alert("Error", "Please enter society name and address.");
      return;
    }

    if (!profile?.societyId || profile.societyId.startsWith("mock-")) {
      Alert.alert(
        "Database Sync Required",
        "Your profile is running in mock/offline mode. To save settings and configure database tables online, please log out and set up a new society."
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("societies")
        .update({
          name: societyName.trim(),
          address: address.trim(),
          city: city.trim() || null,
          state: state.trim() || null,
          pin_code: pinCode.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
          latitude: latitude.trim() ? parseFloat(latitude) : null,
          longitude: longitude.trim() ? parseFloat(longitude) : null,
        })
        .eq("id", profile.societyId);

      if (error) throw error;

      // Update local profile store so dashboard/settings reflect changes immediately
      if (profile) {
        const updatedProfile = {
          ...profile,
          societyName: societyName.trim(),
        };
        await setProfile(updatedProfile);
      }

      Alert.alert("Success", "Society settings saved successfully!");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
            <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Society Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
            <Text style={styles.loaderText}>Loading society configurations...</Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Header branding */}
            <View style={styles.brandCard}>
              <View style={styles.iconBox}>
                <MaterialIcons name="business" size={48} color={theme.colors.secondary} />
              </View>
              <Text style={styles.brandName}>{societyName}</Text>
              <Text style={styles.brandAddress}>{address}</Text>
            </View>

            {/* Manage Towers Link Card */}
            <TouchableOpacity
              style={styles.manageTowersButton}
              onPress={() => router.push("/admin/socities/towers" as any)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="layers" size={28} color={theme.colors.secondary} />
              <View style={styles.manageTowersTextContainer}>
                <Text style={styles.manageTowersTitle}>Manage Towers & Flats</Text>
                <Text style={styles.manageTowersSubtitle}>Add and configure society towers, blocks, and flats</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.colors.outline} />
            </TouchableOpacity>

            {/* Config Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>General Configurations</Text>

              {/* Society Name */}
              <Text style={styles.label}>Society Name</Text>
              <TextInput
                style={styles.input}
                value={societyName}
                onChangeText={setSocietyName}
                placeholder="Enter society name"
                placeholderTextColor={theme.colors.outline}
              />

              {/* Address */}
              <Text style={styles.label}>Location / Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter society location address"
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={3}
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description about the society/rules"
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Location details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>

              {/* City and State */}
              <View style={styles.gridContainer}>
                <View style={[styles.gridItem, { marginRight: 8 }]}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor={theme.colors.outline}
                  />
                </View>
                <View style={[styles.gridItem, { marginLeft: 8 }]}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor={theme.colors.outline}
                  />
                </View>
              </View>

              {/* Pin Code */}
              <Text style={styles.label}>Pin Code</Text>
              <TextInput
                style={styles.input}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="Pin code"
                placeholderTextColor={theme.colors.outline}
                keyboardType="numeric"
              />

              {/* Latitude and Longitude */}
              <View style={styles.gridContainer}>
                <View style={[styles.gridItem, { marginRight: 8 }]}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="e.g. 28.4595"
                    placeholderTextColor={theme.colors.outline}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.gridItem, { marginLeft: 8 }]}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="e.g. 77.0266"
                    placeholderTextColor={theme.colors.outline}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Logo URL */}
              <Text style={styles.label}>Logo Image URL</Text>
              <TextInput
                style={styles.input}
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={theme.colors.outline}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Info (Read-Only)</Text>

              {/* Unique Code ID */}
              <Text style={styles.label}>Unique Code ID</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{societyIdCode.toUpperCase()}</Text>
                <MaterialIcons name="lock" size={16} color={theme.colors.outline} />
              </View>

              <View style={styles.gridContainer}>
                {/* Towers */}
                <View style={[styles.gridItem, { marginRight: 8 }]}>
                  <Text style={styles.label}>Total Towers</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledInputText}>{towersCount}</Text>
                  </View>
                </View>

                {/* Flats */}
                <View style={[styles.gridItem, { marginLeft: 8 }]}>
                  <Text style={styles.label}>Total Flats</Text>
                  <View style={styles.disabledInput}>
                    <Text style={styles.disabledInputText}>{flatsCount}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.saveButtonText}>Save Configurations</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerContent: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loaderContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  formContainer: {
    padding: theme.spacing.containerMarginMobile,
  },
  brandCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    padding: 24,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandName: {
    ...theme.typography.headlineLgMobile,
    fontWeight: "700",
    color: theme.colors.primary,
    textAlign: "center",
  },
  brandAddress: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 6,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: 12,
    height: 48,
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  disabledInput: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  disabledInputText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridItem: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  manageTowersButton: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  manageTowersTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  manageTowersTitle: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  manageTowersSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
});
