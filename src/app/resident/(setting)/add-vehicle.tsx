import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type VehicleType = "Car" | "Bike" | "EV" | "Other";

interface Vehicle {
  id: string;
  user_id: string;
  vehicle_name: string;
  vehicle_number: string;
  vehicle_type: string;
  color?: string;
  created_at?: string;
}

const VEHICLE_TYPES: { label: VehicleType; icon: any }[] = [
  { label: "Car", icon: "directions-car" },
  { label: "Bike", icon: "two-wheeler" },
  { label: "EV", icon: "electric-car" },
  { label: "Other", icon: "more-horiz" },
];

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
function VehicleCard({
  vehicle,
  deleting,
  onDelete,
  canDelete,
}: {
  vehicle: Vehicle;
  deleting: boolean;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const typeIcon =
    vehicle.vehicle_type === "Four Wheeler"
      ? "directions-car"
      : vehicle.vehicle_type === "Two Wheeler"
      ? "two-wheeler"
      : "more-horiz";

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleIconBox}>
        <MaterialIcons name={typeIcon} size={28} color={theme.colors.secondary} />
      </View>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
        <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
        <View style={styles.vehicleMeta}>
          <Text style={styles.vehicleMetaText}>{vehicle.vehicle_type}</Text>
        </View>
      </View>
      <View style={styles.vehicleCardRight}>
        <View style={styles.plateBox}>
          <Text style={styles.plateText}>{vehicle.vehicle_number}</Text>
        </View>
        {canDelete && (
          <TouchableOpacity
            style={styles.vehicleDeleteBtn}
            onPress={onDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AddVehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const isFlatAdmin = params.isFlatAdmin === "true";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("Car");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchVehicles = useCallback(
    async (silent = false) => {
      if (!profile?.id) return;
      if (!silent) setLoading(true);
      try {
        // Query flat admin ID of this resident's unit
        const { data: memberData } = await supabase
          .from("societymembers")
          .select(`
            flat_id,
            flats (
              flat_admin_id
            )
          `)
          .eq("user_id", profile.id)
          .maybeSingle();

        const flatAdminId = (memberData?.flats as any)?.flat_admin_id || profile.id;

        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("user_id", flatAdminId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setVehicles((data as Vehicle[]) || []);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load vehicles.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.id]
  );

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles(true);
  };

  // ── Add vehicle ────────────────────────────────────────────────────────────
  const openModal = () => {
    setVehicleType("Car");
    setVehicleName("");
    setVehicleNumber("");
    setShowModal(true);
  };

  const handleRegister = async () => {
    if (!vehicleName.trim()) {
      Alert.alert("Required", "Please enter the brand & model.");
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert("Required", "Please enter the license plate number.");
      return;
    }
    if (!profile?.id) return;

    // Map UI selection to Database CHECK constraint: 'Two Wheeler' | 'Four Wheeler' | 'Other'
    let mappedType = "Other";
    if (vehicleType === "Car") {
      mappedType = "Four Wheeler";
    } else if (vehicleType === "Bike" || vehicleType === "EV") {
      mappedType = "Two Wheeler";
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("vehicles").insert({
        user_id: profile.id,
        vehicle_name: vehicleName.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_type: mappedType,
      });
      if (error) throw error;
      setShowModal(false);
      await fetchVehicles(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to register vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete vehicle ─────────────────────────────────────────────────────────
  const handleDelete = (vehicle: Vehicle) => {
    Alert.alert(
      "Remove Vehicle",
      `Remove ${vehicle.vehicle_name} (${vehicle.vehicle_number})?`,
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(vehicle.id);
            try {
              const { error } = await supabase
                .from("vehicles")
                .delete()
                .eq("id", vehicle.id);
              if (error) throw error;
              setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Could not remove vehicle.");
            } finally {
              setDeletingId(null);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.outer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="dark" />

        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>My Vehicles</Text>
          </View>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.fullName || "User"
              )}&background=006a61&color=fff&size=60`,
            }}
            style={styles.avatar}
          />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.secondary}
              colors={[theme.colors.secondary]}
            />
          }
        >
          {!isFlatAdmin && (
            <View style={[styles.securityNote, { backgroundColor: "rgba(186, 26, 26, 0.08)", borderColor: "rgba(186, 26, 26, 0.2)", marginTop: 0, marginBottom: 16 }]}>
              <MaterialIcons name="security" size={18} color={theme.colors.error} />
              <Text style={[styles.securityNoteText, { color: theme.colors.error }]}>
                Only the Flat Admin can add or remove registered vehicles for this unit. Your view is read-only.
              </Text>
            </View>
          )}
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroIconCluster}>
              <MaterialIcons name="directions-car" size={48} color={theme.colors.secondary} />
              <MaterialIcons name="verified-user" size={20} color={theme.colors.secondary} style={styles.heroShield} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Seamless Gate Entry</Text>
              <Text style={styles.heroSubtitle}>
                Registered vehicles get automatic plate recognition for quick, secure access.
              </Text>
            </View>
          </View>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registered Vehicles</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{vehicles.length} Total</Text>
            </View>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.secondary} />
              <Text style={styles.loadingText}>Loading vehicles…</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="no-transfer" size={64} color={theme.colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Vehicles Registered</Text>
              <Text style={styles.emptySubtitle}>
                Add your car or bike to enable automatic gate recognition.
              </Text>
            </View>
          ) : (
            <View style={styles.vehiclesList}>
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  deleting={deletingId === vehicle.id}
                  onDelete={() => handleDelete(vehicle)}
                  canDelete={isFlatAdmin}
                />
              ))}
            </View>
          )}

          {/* Security note */}
          <View style={styles.securityNote}>
            <MaterialIcons name="security" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.securityNoteText}>
              Security staff may verify your vehicle registration during first entry. Please carry your valid RC document.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom bar */}
        {isFlatAdmin && (
          <View
            style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <TouchableOpacity style={styles.addBtn} onPress={openModal}>
              <MaterialIcons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.addBtnText}>Register Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Register Vehicle Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                onPress={() => setShowModal(false)}
                activeOpacity={1}
              />
              <View
                style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
              >
                {/* Handle */}
                <View style={styles.sheetHandle} />

                {/* Modal header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Register Vehicle</Text>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    style={styles.closeBtn}
                  >
                    <MaterialIcons name="close" size={22} color={theme.colors.outline} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Vehicle Type */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
                    <View style={styles.typeGrid}>
                      {VEHICLE_TYPES.map((t) => {
                        const active = vehicleType === t.label;
                        return (
                          <TouchableOpacity
                            key={t.label}
                            style={[styles.typeChip, active && styles.typeChipActive]}
                            onPress={() => setVehicleType(t.label)}
                          >
                            <MaterialIcons
                              name={t.icon}
                              size={20}
                              color={active ? theme.colors.secondary : theme.colors.onSurfaceVariant}
                            />
                            <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Brand & Model */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>BRAND & MODEL *</Text>
                    <View style={styles.inputRow}>
                      <MaterialIcons
                        name="directions-car"
                        size={20}
                        color={theme.colors.outline}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Tesla Model 3"
                        placeholderTextColor={theme.colors.outline}
                        value={vehicleName}
                        onChangeText={setVehicleName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* License Plate */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>LICENSE PLATE *</Text>
                    <View style={styles.inputRow}>
                      <MaterialIcons
                        name="confirmation-number"
                        size={20}
                        color={theme.colors.outline}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.textInput, styles.plateInput]}
                        placeholder="e.g. KA 01 MG 4002"
                        placeholderTextColor={theme.colors.outline}
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        autoCapitalize="characters"
                        returnKeyType="next"
                      />
                    </View>
                  </View>



                  {/* Note */}
                  <View style={styles.noteBox}>
                    <MaterialIcons name="verified-user" size={18} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.noteText}>
                      Vehicle registration will be active within 24 hours after admin approval.
                    </Text>
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                        <Text style={styles.submitText}>Register Vehicle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outer: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.25)",
    zIndex: 10,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4, borderRadius: 20 },
  topBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },

  scroll: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.lg,
    paddingBottom: 120,
  },

  // Hero
  heroBanner: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.25)",
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIconCluster: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(134,242,228,0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heroShield: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  heroTextBlock: { flex: 1, gap: 4 },
  heroTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  heroSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  countText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },

  loadingBox: { alignItems: "center", paddingTop: 48, gap: 12 },
  loadingText: { ...theme.typography.bodyMd, color: theme.colors.onSurfaceVariant },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  vehiclesList: { gap: 12 },

  // Vehicle card
  vehicleCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(134,242,228,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleDetails: { flex: 1, gap: 2 },
  vehicleName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontSize: 15,
    fontWeight: "600",
  },
  vehicleNumber: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  vehicleMeta: { flexDirection: "row", gap: 8 },
  vehicleMetaText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
    fontWeight: "400",
  },

  vehicleCardRight: { alignItems: "center", gap: 8 },
  plateBox: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  plateText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  vehicleDeleteBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(186,26,26,0.08)",
  },

  // Security note
  securityNote: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(198,198,205,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.25)",
    alignItems: "flex-start",
    marginTop: 20,
  },
  securityNoteText: {
    flex: 1,
    ...theme.typography.bodyMd,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(198,198,205,0.25)",
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.2)",
    marginBottom: 16,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },

  fieldGroup: { marginBottom: 16, gap: 6 },
  fieldLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  typeGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
  },
  typeChipActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondaryContainer,
  },
  typeChipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  typeChipTextActive: { color: theme.colors.secondary, fontWeight: "700" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 10,
    height: 50,
  },
  inputIcon: { marginLeft: 14, marginRight: 8 },
  textInput: {
    flex: 1,
    height: "100%",
    paddingRight: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  plateInput: {
    fontWeight: "700",
    letterSpacing: 2,
  },
  inputFlat: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },

  noteBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(198,198,205,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.25)",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    ...theme.typography.bodyMd,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },

  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
