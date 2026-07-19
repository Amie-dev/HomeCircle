import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useResidentVerifications, useUpdateResidentVerification } from "../../../hooks/useRequestResident";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

// Configure notification behavior for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface Resident {
  id: string;
  name: string;
  unit: string;
  status: "Verified" | "Pending" | "Staff";
  avatar: string | null;
  userId?: string;
}

const mockResidents: Resident[] = [
  {
    id: "res-1",
    name: "Arjun Mehta",
    unit: "Block C, 402",
    status: "Verified",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTZMRVP0DI4I3sIz9HKazFkJmatdAz3A-A70E2slb_tZaqPc6TN1CGyPEKRWSggsxAMqmDEvkkogoRmY1UjZTyrMaSCNj3MBBOZ7-Vj4n_WKayA8HQXGzDE9ruw3dTyoO7M3v-x9Gjcf4QfxHRsly90DQhbdPUYJ-Qooas9PbyjwRk_2dQ_6Ib_F3WhjvJ8uWb3y49X6jQLWzAzzIVdGZfd2VVYPxFuRJ1muyrDakSAuMJI9D4Me6M1w",
  },
  {
    id: "res-2",
    name: "Sarah Jenkins",
    unit: "Block A, 105",
    status: "Pending",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJyPPxuPXAHMzJzMQfMEpV0Yd-DPCW_-PgTK_B3Xip7ZFB7fny_nbRIpRFteiXs5A8tzTnFbvkK5t7_87kZ4M6Q5ELDvvHa3wORqQh2o_HznYdYWiwYXbi5AAfAu8z2DGR9fu5medz_6kdZ15ISIJq2vxcIR1kzs_VsKo59uLrVMwQPusqnYugh77hTZy795J9wQgK0AzXGzkNuOv50rt_uXYSo9upQa_b9ZE2X5_ETlsEU1SpEnpWUg",
  },
  {
    id: "res-3",
    name: "Robert Wilson",
    unit: "Block D, 201",
    status: "Verified",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuASN0AaqVTtYTJltsQV1klpTH1acnjunXheJ97_C1DErufrnJTh-owyYVOIC2WrH5FVPiZRIjeEEfESYQvhOgLeQJrL9-6Tqfhrn0YM93ztre-HuDVmpaMw9ETGh23ApY1k0oVPBUpNScYkH19lckq6_hMEWa3xQb7rO0qUaxY9feEdbpgLcuaq_lN4tOT0PISANzvOQ4Y8IV-_cvoOD4WruhlKJQ0eWkdVfLZQrYn7-T3myWbtNZM7Rg",
  },
  {
    id: "res-4",
    name: "Sanjay Mishra",
    unit: "Maintenance Staff",
    status: "Staff",
    avatar: null,
  },
  {
    id: "res-5",
    name: "Elena Rodriguez",
    unit: "Block B, 303",
    status: "Pending",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvrqyIkCRQPMEjCbHedzn7GpHmFh7zLuFsGoftGN6YugN00UtLGiETlPDtqIkmwKj-bt4_cZSn_akAAkDdCyJ6eWeetV3AwTAy650tJYBh3Or741hkTtQ1WSWQJVR1UQ0LHQz2WNGHTSTEZiPzPeEWAqbJ1ot-xKDzTtN24T5It88f7QP_X37cGcZLVOSB3N0vDTogJ76S-s8yHf4dol1IvjSubBKUAcd57Fojec-afWgxw66QMiK8-w",
  },
];

export default function ManageResidents() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Verified" | "Pending" | "Staff">("All");

  // Query and mutation hooks for database verifications
  const { data: dbVerifications, error: dbError } = useResidentVerifications(profile?.societyId);
  const { mutateAsync: updateVerification } = useUpdateResidentVerification();

  // Manage resident list state locally
  const [residents, setResidents] = useState<Resident[]>([]);

  // Modal State
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState<"Verified" | "Pending" | "Staff">("Pending");

  // Request notifications permissions on component mount
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }
    requestPermissions();
  }, []);

  // Subscribe to realtime updates for userverifications table
  useEffect(() => {
    if (!profile?.societyId) return;

    const channel = supabase
      .channel("realtime-verifications-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "userverifications",
          filter: `society_id=eq.${profile.societyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["residentVerifications", profile.societyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.societyId]);

  // Update local residents state when DB verifications change
  useEffect(() => {
    if (dbVerifications) {
      const mapped: Resident[] = dbVerifications.map((v) => ({
        id: v.id,
        userId: v.user_id,
        name: v.users?.full_name || "Unknown Resident",
        unit: v.role === "Guard"
          ? "Security Guard"
          : `${v.verification_details?.towerName || ""}, ${v.verification_details?.flatNumber || ""}`,
        status: v.role === "Guard"
          ? "Staff"
          : (v.is_verified ? "Verified" : "Pending"),
        avatar: null,
      }));
      setResidents(mapped);
    }
  }, [dbVerifications]);

  const getStatusStyle = (status: "Verified" | "Pending" | "Staff") => {
    switch (status) {
      case "Verified":
        return {
          bg: "rgba(0, 106, 97, 0.1)",
          text: theme.colors.secondary,
        };
      case "Pending":
        return {
          bg: "rgba(186, 26, 26, 0.1)",
          text: theme.colors.error,
        };
      case "Staff":
      default:
        return {
          bg: "rgba(124, 131, 155, 0.15)",
          text: theme.colors.onSurfaceVariant,
        };
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch =
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.unit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "All" || resident.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleResidentPress = (resident: Resident) => {
    setSelectedResident(resident);
    setModalStatus(resident.status);
    setIsModalVisible(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedResident) return;

    const previousStatus = selectedResident.status;
    const newStatus = modalStatus;

    setIsModalVisible(false);

    // Check if this resident is from Supabase (by looking for a matching verification request in dbVerifications)
    const isDbResident = dbVerifications?.some((v) => v.id === selectedResident.id);

    if (isDbResident) {
      try {
        await updateVerification({
          id: selectedResident.id,
          userId: selectedResident.userId || selectedResident.id,
          isVerified: newStatus === "Verified",
          previousStatus: previousStatus === "Verified",
        });

        Alert.alert(
          "Status Updated",
          `${selectedResident.name}'s status has been successfully saved to the database.`
        );
      } catch (err: any) {
        console.warn("Failed to update status in database:", err);
        Alert.alert("Update Failed", err.message || "Failed to update resident status in database.");
      }
    } else {
      // Offline fallback: Update in local state
      setResidents((prev) =>
        prev.map((res) =>
          res.id === selectedResident.id ? { ...res, status: newStatus } : res
        )
      );

      // If status changed to "Verified", trigger push notification offline
      if (newStatus === "Verified" && previousStatus !== "Verified") {
        try {
          const isGuard = selectedResident.unit === "Security Guard";
          const targetUrl = isGuard ? "/guard" : "/resident";
          const targetTitle = isGuard ? "Verification Approved 👮" : "Verification Approved 🏠";
          const targetBody = isGuard ? "Approved! You are now active on duty." : "Approved! You are now a flat member.";

          await Notifications.scheduleNotificationAsync({
            content: {
              title: targetTitle,
              body: targetBody,
              data: {
                residentId: selectedResident.id,
                url: targetUrl,
              },
            },
            trigger: null,
          });
          Alert.alert(
            "Status Updated (Offline)",
            `${selectedResident.name} is now Verified. Push notification sent.`
          );
        } catch (error) {
          console.warn("Failed to send push notification:", error);
          Alert.alert(
            "Status Updated (Offline)",
            `${selectedResident.name} is now Verified.`
          );
        }
      } else {
        Alert.alert(
          "Status Updated (Offline)",
          `${selectedResident.name}'s status has been changed to ${newStatus}.`
        );
      }
    }

    setSelectedResident(null);
  };

  const handleAddResident = () => {
    Alert.alert("Add Resident", "Create a new resident form.");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Manage Residents</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert("Filter", "Open detailed filters.")}
        >
          <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or flat number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(["All", "Verified", "Pending", "Staff"] as const).map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isActive ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Resident List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Recent Residents</Text>

          <View style={styles.listWrapper}>
            {filteredResidents.length > 0 ? (
              filteredResidents.map((resident, index) => {
                const statusStyles = getStatusStyle(resident.status);
                const isLast = index === filteredResidents.length - 1;
                return (
                  <TouchableOpacity
                    key={resident.id}
                    style={[
                      styles.residentCard,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleResidentPress(resident)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardLeft}>
                      {resident.avatar ? (
                        <Image source={{ uri: resident.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>
                            {getInitials(resident.name)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.infoWrapper}>
                        <Text style={styles.residentName}>{resident.name}</Text>
                        <Text style={styles.residentUnit}>{resident.unit}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusStyles.text }]}>
                            {resident.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={theme.colors.outline} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people-outline" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyText}>No residents found matching filters.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 76 }]}
        activeOpacity={0.8}
        onPress={handleAddResident}
      >
        <MaterialIcons name="add" size={28} color={theme.colors.onSecondary} />
      </TouchableOpacity>

      {/* Resident Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedResident && (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Resident Details</Text>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Profile Section */}
                <View style={styles.modalProfileSection}>
                  {selectedResident.avatar ? (
                    <Image
                      source={{ uri: selectedResident.avatar }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <View style={styles.modalAvatarFallback}>
                      <Text style={styles.modalAvatarFallbackText}>
                        {getInitials(selectedResident.name)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalName}>{selectedResident.name}</Text>
                  <Text style={styles.modalUnit}>{selectedResident.unit}</Text>
                </View>

                {/* Status Selection */}
                <View style={styles.statusSection}>
                  <Text style={styles.statusSectionTitle}>Update Verification Status</Text>
                  <View style={styles.statusOptionRow}>
                    {(["Pending", "Verified", "Staff"] as const).map((status) => {
                      const isActive = modalStatus === status;
                      let activeColor = theme.colors.outline;
                      let activeBg = theme.colors.surfaceContainer;

                      if (status === "Verified") {
                        activeColor = theme.colors.secondary;
                        activeBg = "rgba(0, 106, 97, 0.1)";
                      } else if (status === "Pending") {
                        activeColor = theme.colors.error;
                        activeBg = "rgba(186, 26, 26, 0.1)";
                      } else if (status === "Staff") {
                        activeColor = theme.colors.onSurfaceVariant;
                        activeBg = "rgba(124, 131, 155, 0.15)";
                      }

                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOptionButton,
                            isActive && {
                              borderColor: activeColor,
                              backgroundColor: activeBg,
                            },
                          ]}
                          onPress={() => setModalStatus(status)}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: isActive
                                  ? activeColor
                                  : theme.colors.outlineVariant,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusOptionText,
                              isActive && { color: activeColor, fontWeight: "700" },
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleSaveStatus}
                  >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  headerButton: {
    padding: 6,
    borderRadius: 999,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  filterContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipInactive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderColor: theme.colors.outlineVariant,
  },
  filterChipText: {
    ...theme.typography.labelMd,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: theme.colors.onPrimary,
  },
  filterChipTextInactive: {
    color: theme.colors.onSurfaceVariant,
  },
  listSection: {
    marginTop: theme.spacing.sm,
  },
  listTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  listWrapper: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  residentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.secondaryContainer,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  infoWrapper: {
    marginLeft: 12,
    flex: 1,
    alignItems: "flex-start",
  },
  residentName: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  residentUnit: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalHeaderTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  modalProfileSection: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.secondaryContainer,
    marginBottom: theme.spacing.sm,
  },
  modalAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 3,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  modalAvatarFallbackText: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalName: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalUnit: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  statusSection: {
    marginBottom: theme.spacing.xl,
  },
  statusSectionTitle: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  statusOptionRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statusOptionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: theme.rounded.md,
    borderWidth: 1.5,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLow,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cancelBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  saveBtn: {
    backgroundColor: theme.colors.secondary,
  },
  saveBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSecondary,
    fontWeight: "700",
  },
});
