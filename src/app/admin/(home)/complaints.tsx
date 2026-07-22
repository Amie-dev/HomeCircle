import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { sendPushNotification } from "../../../../utils/notificationService";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

interface Complaint {
  id: string;
  title: string;
  category: "Plumbing" | "Electrical" | "Security" | "Cleaning";
  content: string;
  timeAgo: string;
  severity: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Resolved" | "Closed";
  residentName: string;
  residentUnit: string;
  residentAvatar: string | null;
  userId: string;
}

export default function OpenComplaints() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const { profile } = useProfileStore();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState<"Pending" | "In Progress" | "Resolved" | "Closed">("Pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchComplaints = async () => {
    if (!profile?.societyId) return;
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          users (
            full_name,
            email,
            phone,
            avatar_url,
            societymembers (
              towers ( name ),
              flats ( flat_number )
            )
          )
        `)
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setComplaints(
          data.map((t: any) => {
            const member = t.users?.societymembers?.[0];
            const towerName = member?.towers?.name || "";
            const flatNo = member?.flats?.flat_number || "";
            const unitText = towerName && flatNo ? `Tower ${towerName} - ${flatNo}` : "External/Staff";

            // Format time ago or date
            const createdDate = new Date(t.created_at);
            const diffMs = Date.now() - createdDate.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            const timeAgo = diffDays > 0 ? `${diffDays}d ago` : diffHours > 0 ? `${diffHours}h ago` : "Just now";

            return {
              id: t.id,
              title: t.title,
              category: t.category,
              content: t.description,
              timeAgo,
              severity: t.is_urgent ? "High" : "Low",
              status: t.status,
              residentName: t.users?.full_name || "Unknown Resident",
              residentUnit: unitText,
              residentAvatar: t.users?.avatar_url || null,
              userId: t.user_id,
            };
          })
        );
      }
    } catch (err: any) {
      console.error("Error fetching complaints:", err.message);
    }
  };

  const updateComplaintStatus = async (id: string, newStatus: string, userId?: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: newStatus,
          resolved_at: (newStatus === "Resolved" || newStatus === "Closed") ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      // Send push notification to the resident if userId is provided
      if (userId) {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("notification_token")
            .eq("id", userId)
            .maybeSingle();

          const notifTitle = `Complaint Status Update 📢`;
          const notifBody = `Your complaint regarding "${selectedComplaint?.title || 'issue'}" is now: ${newStatus}`;
          const targetScreen = "/resident/(tabs)/community";

          if (userData?.notification_token) {
            await sendPushNotification({
              token: userData.notification_token,
              title: notifTitle,
              body: notifBody,
              data: {
                screen: targetScreen,
                url: targetScreen,
              },
            });
          }

          // Insert log into push_notifications
          await supabase.from("push_notifications").insert({
            user_id: userId,
            title: notifTitle,
            body: notifBody,
            screen: targetScreen,
            status: "Sent",
          });
        } catch (notifErr) {
          console.warn("Failed to send complaint push notification:", notifErr);
        }
      }

      Alert.alert("Success", `Complaint status updated to ${newStatus}`);
      fetchComplaints();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update complaint status");
      throw err;
    }
  };

  const handleRaiseComplaint = () => {
    Alert.alert(
      "Log Test Complaint",
      "Would you like to log a test plumbing complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async () => {
            if (!profile?.societyId) return;
            try {
              const { error } = await supabase
                .from("tickets")
                .insert({
                  society_id: profile.societyId,
                  user_id: profile.id,
                  title: "Test Plumbing Issue",
                  description: "Water leaking in common bathroom area.",
                  category: "Plumbing",
                  is_urgent: false,
                  status: "Pending",
                });

              if (error) throw error;
              Alert.alert("Success", "Test complaint logged successfully!");
              fetchComplaints();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to log complaint");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      fetchComplaints().finally(() => setLoading(false));
    }
  }, [profile?.societyId]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Plumbing":
        return "plumbing";
      case "Electrical":
        return "bolt";
      case "Security":
        return "security";
      case "Cleaning":
      default:
        return "cleaning-services";
    }
  };

  const getCategoryIconBg = (cat: string) => {
    switch (cat) {
      case "Plumbing":
        return "rgba(186, 26, 26, 0.1)";
      case "Electrical":
        return "rgba(0, 106, 97, 0.1)";
      case "Security":
        return "rgba(124, 131, 155, 0.15)";
      case "Cleaning":
      default:
        return theme.colors.secondaryContainer;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "High":
        return { bg: theme.colors.error, text: theme.colors.onError };
      case "Medium":
        return { bg: "rgba(124, 131, 155, 0.2)", text: theme.colors.onSurfaceVariant };
      case "Low":
      default:
        return { bg: theme.colors.secondaryContainer, text: theme.colors.onSecondaryContainer };
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "Pending":
        return "rgba(186, 26, 26, 0.1)";
      case "In Progress":
        return "rgba(0, 106, 97, 0.1)";
      case "Resolved":
        return "rgba(0, 106, 97, 0.1)";
      case "Closed":
      default:
        return theme.colors.surfaceContainerHigh;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return theme.colors.error;
      case "In Progress":
        return theme.colors.secondary;
      case "Resolved":
        return theme.colors.secondary;
      case "Closed":
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.residentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "Urgent" && complaint.severity === "High") ||
      complaint.category === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleCardPress = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalStatus(complaint.status);
    setIsModalVisible(true);
  };

  const isStatusTransitionAllowed = (current: string, target: string) => {
    const order = ["Pending", "In Progress", "Resolved", "Closed"];
    const currentIndex = order.indexOf(current);
    const targetIndex = order.indexOf(target);
    return targetIndex > currentIndex;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Open Complaints</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert("Sort", "Sort complaints by time/severity")}
        >
          <MaterialIcons name="sort" size={24} color={theme.colors.primary} />
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
            {(["All", "Urgent", "Plumbing", "Electrical", "Security", "Cleaning"] as const).map((filter) => {
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

        {/* Complaints Cards List */}
        <View style={styles.listSection}>
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => {
              const sevStyle = getSeverityStyle(complaint.severity);
              const statusBg = getStatusBg(complaint.status);
              const statusText = getStatusText(complaint.status);
              return (
                <TouchableOpacity
                  key={complaint.id}
                  style={styles.complaintCard}
                  onPress={() => handleCardPress(complaint)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.iconBox, { backgroundColor: getCategoryIconBg(complaint.category) }]}>
                        <MaterialIcons
                          name={getCategoryIcon(complaint.category) as any}
                          size={20}
                          color={
                            complaint.category === "Plumbing"
                              ? theme.colors.error
                              : complaint.category === "Electrical"
                                ? theme.colors.secondary
                                : theme.colors.primary
                          }
                        />
                      </View>
                      <View style={styles.titleWrapper}>
                        <Text style={styles.complaintTitle} numberOfLines={1}>{complaint.title}</Text>
                        <View style={styles.timeAgoWrapper}>
                          <MaterialIcons name="schedule" size={12} color={theme.colors.outline} />
                          <Text style={styles.timeAgoText}>{complaint.timeAgo}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sevStyle.bg }]}>
                      <Text style={[styles.severityBadgeText, { color: sevStyle.text }]}>
                        {complaint.severity}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.complaintDesc} numberOfLines={2}>{complaint.content}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.residentWrapper}>
                      {complaint.residentAvatar ? (
                        <Image source={{ uri: complaint.residentAvatar }} style={styles.residentAvatar} />
                      ) : (
                        <View style={styles.residentAvatar}>
                          <Text style={styles.residentAvatarText}>
                            {complaint.residentName.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "UR"}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.residentInfoText}>
                        {complaint.residentName}{" "}
                        <Text style={styles.residentUnitText}>({complaint.residentUnit})</Text>
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusText }]}>
                        {complaint.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="report-problem" size={48} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No open complaints found matching filters.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.8}
        onPress={handleRaiseComplaint}
      >
        <MaterialIcons name="add" size={28} color={theme.colors.onSecondary} />
      </TouchableOpacity>

      {/* Complaint Details & Status Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea} edges={["bottom", "left", "right"]}>
            <View style={styles.modalContent}>
              {selectedComplaint && (
                <>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>Complaint Details</Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                      <MaterialIcons name="close" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                    {/* Category, Title & Severity */}
                    <View style={styles.modalInfoCard}>
                      <View style={styles.modalCategoryRow}>
                        <View style={[styles.iconBox, { backgroundColor: getCategoryIconBg(selectedComplaint.category) }]}>
                          <MaterialIcons
                            name={getCategoryIcon(selectedComplaint.category) as any}
                            size={24}
                            color={
                              selectedComplaint.category === "Plumbing"
                                ? theme.colors.error
                                : selectedComplaint.category === "Electrical"
                                  ? theme.colors.secondary
                                  : theme.colors.primary
                            }
                          />
                        </View>
                        <View style={styles.modalCategoryTexts}>
                          <Text style={styles.modalCategoryLabel}>{selectedComplaint.category} Issue</Text>
                          <Text style={styles.modalTimeAgo}>{selectedComplaint.timeAgo}</Text>
                        </View>
                        <View style={[styles.severityBadge, { backgroundColor: getSeverityStyle(selectedComplaint.severity).bg }]}>
                          <Text style={[styles.severityBadgeText, { color: getSeverityStyle(selectedComplaint.severity).text }]}>
                            {selectedComplaint.severity}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.modalComplaintTitle}>{selectedComplaint.title}</Text>
                      <Text style={styles.modalComplaintDesc}>{selectedComplaint.content}</Text>
                    </View>

                    {/* Resident Profile */}
                    <View style={styles.modalResidentSection}>
                      <Text style={styles.modalSectionTitle}>Submitted By</Text>
                      <View style={styles.modalResidentCard}>
                        {selectedComplaint.residentAvatar ? (
                          <Image source={{ uri: selectedComplaint.residentAvatar }} style={styles.modalAvatar} />
                        ) : (
                          <View style={styles.modalAvatarFallback}>
                            <Text style={styles.modalAvatarFallbackText}>
                              {selectedComplaint.residentName.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "UR"}
                            </Text>
                          </View>
                        )}
                        <View style={styles.modalResidentDetails}>
                          <Text style={styles.modalResidentName}>{selectedComplaint.residentName}</Text>
                          <Text style={styles.modalResidentUnit}>{selectedComplaint.residentUnit}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Status Options */}
                    <View style={styles.statusUpdateSection}>
                      <Text style={styles.modalSectionTitle}>Update Status</Text>
                      <View style={styles.statusOptionsContainer}>
                        {(["Pending", "In Progress", "Resolved", "Closed"] as const).map((s) => {
                          const isActive = modalStatus === s;
                          const isAllowed = s === selectedComplaint.status || isStatusTransitionAllowed(selectedComplaint.status, s);
                          let activeColor = theme.colors.outline;
                          let activeBg = theme.colors.surfaceContainer;

                          if (s === "Pending") {
                            activeColor = theme.colors.error;
                            activeBg = "rgba(186, 26, 26, 0.08)";
                          } else if (s === "In Progress") {
                            activeColor = "#DB8C00";
                            activeBg = "rgba(219, 140, 0, 0.08)";
                          } else if (s === "Resolved") {
                            activeColor = theme.colors.secondary;
                            activeBg = "rgba(0, 106, 97, 0.08)";
                          } else if (s === "Closed") {
                            activeColor = theme.colors.onSurfaceVariant;
                            activeBg = theme.colors.surfaceContainerHighest;
                          }

                          return (
                            <TouchableOpacity
                              key={s}
                              style={[
                                styles.statusOptionBtn,
                                isActive && {
                                  borderColor: activeColor,
                                  backgroundColor: activeBg,
                                  borderWidth: 1.5,
                                },
                                !isAllowed && { opacity: 0.4 },
                              ]}
                              disabled={!isAllowed}
                              onPress={() => setModalStatus(s)}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.statusDot, { backgroundColor: isActive ? activeColor : theme.colors.outlineVariant }]} />
                              <Text style={[styles.statusOptionBtnText, isActive && { color: activeColor, fontWeight: "700" }, !isAllowed && { color: theme.colors.outline }]}>
                                {s}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.modalCancelBtn]}
                      onPress={() => setIsModalVisible(false)}
                      disabled={updatingStatus}
                    >
                      <Text style={styles.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalActionBtn, styles.modalSaveBtn]}
                      onPress={async () => {
                        setUpdatingStatus(true);
                        try {
                          await updateComplaintStatus(selectedComplaint.id, modalStatus, selectedComplaint.userId);
                          setIsModalVisible(false);
                        } catch (err) {
                          // Handled inside updateComplaintStatus
                        } finally {
                          setUpdatingStatus(false);
                        }
                      }}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.modalSaveBtnText}>Save Status</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </SafeAreaView>
        </View>
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
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
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
    borderRadius: theme.rounded.default,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  filterChipInactive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  filterChipText: {
    ...theme.typography.labelMd,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: "700",
  },
  filterChipTextInactive: {
    color: theme.colors.onSurfaceVariant,
  },
  listSection: {
    gap: 12,
  },
  complaintCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flex: 1,
  },
  complaintTitle: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  timeAgoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timeAgoText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  complaintDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.15)",
    paddingTop: 12,
  },
  residentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  residentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  residentAvatarText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.onSecondaryContainer,
    fontWeight: "700",
  },
  residentInfoText: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
  },
  residentUnitText: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: "400",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "700",
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
  modalSafeArea: {
    width: "100%",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    marginBottom: 16,
  },
  modalHeaderTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalInfoCard: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginBottom: 20,
  },
  modalCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalCategoryTexts: {
    flex: 1,
    marginLeft: 12,
  },
  modalCategoryLabel: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalTimeAgo: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalComplaintTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalComplaintDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  modalResidentSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalResidentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modalAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarFallbackText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "700",
  },
  modalResidentDetails: {
    marginLeft: 12,
  },
  modalResidentName: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalResidentUnit: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusUpdateSection: {
    marginBottom: 20,
  },
  statusOptionsContainer: {
    gap: 10,
  },
  statusOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOptionBtnText: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: 10,
    gap: 12,
    marginBottom: -100,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.rounded.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  modalCancelBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  modalSaveBtn: {
    backgroundColor: theme.colors.primary,
  },
  modalSaveBtnText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
