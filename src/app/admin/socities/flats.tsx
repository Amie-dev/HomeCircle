import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

interface Flat {
  id: string;
  flat_number: string;
  floor: number | null;
  max_members: number;
  max_vehicles: number;
  status: "Vacant" | "Occupied" | "Under Maintenance";
}

export default function FlatManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ towerId: string; towerName: string }>();
  const { towerId, towerName } = params;

  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);

  // Form states
  const [flatNumber, setFlatNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [maxMembers, setMaxMembers] = useState("6");
  const [maxVehicles, setMaxVehicles] = useState("2");
  const [status, setStatus] = useState<"Vacant" | "Occupied" | "Under Maintenance">("Vacant");
  const [submitting, setSubmitting] = useState(false);

  const fetchFlats = async () => {
    if (!towerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("flats")
        .select("*")
        .eq("tower_id", towerId)
        .order("flat_number", { ascending: true });

      if (error) throw error;
      setFlats(data || []);
    } catch (err: any) {
      console.error("Failed to load flats:", err.message);
      Alert.alert("Error", "Could not fetch flats for this tower.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, [towerId]);

  const openAddModal = () => {
    setEditingFlat(null);
    setFlatNumber("");
    setFloor("");
    setMaxMembers("6");
    setMaxVehicles("2");
    setStatus("Vacant");
    setIsModalVisible(true);
  };

  const openEditModal = (flat: Flat) => {
    setEditingFlat(flat);
    setFlatNumber(flat.flat_number);
    setFloor(flat.floor !== null ? flat.floor.toString() : "");
    setMaxMembers(flat.max_members.toString());
    setMaxVehicles(flat.max_vehicles.toString());
    setStatus(flat.status);
    setIsModalVisible(true);
  };

  const handleSaveFlat = async () => {
    if (!flatNumber.trim()) {
      Alert.alert("Error", "Please enter flat number.");
      return;
    }

    if (!towerId) return;

    setSubmitting(true);
    try {
      const payload = {
        tower_id: towerId,
        flat_number: flatNumber.trim(),
        floor: floor.trim() ? parseInt(floor) : null,
        max_members: parseInt(maxMembers) || 6,
        max_vehicles: parseInt(maxVehicles) || 2,
        status: status,
      };

      if (editingFlat) {
        // Update
        const { error } = await supabase
          .from("flats")
          .update(payload)
          .eq("id", editingFlat.id);

        if (error) {
          if (error.code === "23505") {
            throw new Error("This flat number already exists in this tower.");
          }
          throw error;
        }
        Alert.alert("Success", "Flat details updated successfully.");
      } else {
        // Insert
        const { error } = await supabase.from("flats").insert(payload);

        if (error) {
          if (error.code === "23505") {
            throw new Error("This flat number already exists in this tower.");
          }
          throw error;
        }
        Alert.alert("Success", "Flat added successfully.");
      }

      setIsModalVisible(false);
      fetchFlats();
    } catch (err: any) {
      Alert.alert("Save failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlat = (flat: Flat) => {
    Alert.alert(
      "Delete Flat",
      `Are you sure you want to delete flat "${flat.flat_number}"? This will permanently remove its database record.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("flats")
                .delete()
                .eq("id", flat.id);

              if (error) throw error;
              Alert.alert("Deleted", "Flat deleted successfully.");
              fetchFlats();
            } catch (err: any) {
              Alert.alert("Delete failed", err.message);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (statusVal: string) => {
    switch (statusVal) {
      case "Occupied":
        return {
          bg: "#E6F4EA",
          text: "#137333",
        };
      case "Under Maintenance":
        return {
          bg: "#FEF7E0",
          text: "#B06000",
        };
      default: // Vacant
        return {
          bg: "#E8F0FE",
          text: "#1A73E8",
        };
    }
  };

  const renderFlatItem = ({ item }: { item: Flat }) => {
    const statusTheme = getStatusStyle(item.status);
    return (
      <View style={styles.flatCard}>
        <View style={styles.flatCardLeft}>
          <View style={styles.flatIconContainer}>
            <MaterialIcons name="door-back" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.flatDetails}>
            <Text style={styles.flatNumber}>Flat {item.flat_number}</Text>
            <Text style={styles.flatSubtext}>
              Floor: {item.floor !== null ? item.floor : "N/A"} • Max Members: {item.max_members}
            </Text>
            <Text style={styles.flatSubtext}>Max Vehicles: {item.max_vehicles}</Text>
          </View>
        </View>

        <View style={styles.flatCardRight}>
          <View style={[styles.statusChip, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusChipText, { color: statusTheme.text }]}>
              {item.status}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.actionIcon}
            >
              <MaterialIcons name="edit" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteFlat(item)}
              style={styles.actionIcon}
            >
              <MaterialIcons name="delete" size={20} color="#EA4335" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
    
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{towerName || "Flats Manager"}</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <MaterialIcons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && flats.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loaderText}>Fetching flats...</Text>
        </View>
      ) : (
        <FlatList
          data={flats}
          keyExtractor={(item) => item.id}
          renderItem={renderFlatItem}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchFlats}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="meeting-room" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyTitle}>No Flats Configured</Text>
              <Text style={styles.emptySubtitle}>
                Add flats to this tower to setup residents and guest deliveries.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Add First Flat</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add / Edit Flat Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFlat ? "Edit Flat Details" : "Add New Flat"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.label}>Flat Number</Text>
              <TextInput
                style={styles.input}
                value={flatNumber}
                onChangeText={setFlatNumber}
                placeholder="e.g. 101, 405A, G-2"
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.label}>Floor Number</Text>
              <TextInput
                style={styles.input}
                value={floor}
                onChangeText={setFloor}
                placeholder="e.g. 1, 4, 0 (for ground)"
                placeholderTextColor={theme.colors.outline}
                keyboardType="numeric"
              />

              <View style={styles.gridContainer}>
                <View style={[styles.gridItem, { marginRight: 8 }]}>
                  <Text style={styles.label}>Max Members</Text>
                  <TextInput
                    style={styles.input}
                    value={maxMembers}
                    onChangeText={setMaxMembers}
                    placeholder="e.g. 6"
                    placeholderTextColor={theme.colors.outline}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.gridItem, { marginLeft: 8 }]}>
                  <Text style={styles.label}>Max Vehicles</Text>
                  <TextInput
                    style={styles.input}
                    value={maxVehicles}
                    onChangeText={setMaxVehicles}
                    placeholder="e.g. 2"
                    placeholderTextColor={theme.colors.outline}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Occupancy / Maintenance Status</Text>
              <View style={styles.statusSelectors}>
                {(["Vacant", "Occupied", "Under Maintenance"] as const).map((s) => {
                  const isActive = status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusSelectCard,
                        isActive && {
                          borderColor: theme.colors.secondary,
                          backgroundColor: theme.colors.surfaceContainerLow,
                        },
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <Text
                        style={[
                          styles.statusSelectText,
                          isActive && {
                            color: theme.colors.secondary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSaveFlat}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingFlat ? "Save Changes" : "Add Flat"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: {
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
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  listContent: {
    padding: theme.spacing.containerMarginMobile,
    paddingBottom: 40,
  },
  flatCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.lg,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  flatCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flatIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flatDetails: {
    flex: 1,
  },
  flatNumber: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  flatSubtext: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  flatCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.rounded.full,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionIcon: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalForm: {
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
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
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridItem: {
    flex: 1,
  },
  statusSelectors: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  statusSelectCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  statusSelectText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
