import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";

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
}

export default function OpenComplaints() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const { profile } = useProfileStore();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    if (!profile?.societyId) return;
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          guestusers (
            full_name,
            email,
            phone,
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
            const member = t.guestusers?.societymembers?.[0];
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
              residentName: t.guestusers?.full_name || "Unknown Resident",
              residentUnit: unitText,
            };
          })
        );
      }
    } catch (err: any) {
      console.error("Error fetching complaints:", err.message);
    }
  };

  const updateComplaintStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: newStatus,
          resolved_at: newStatus === "Resolved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", `Complaint status updated to ${newStatus}`);
      fetchComplaints();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update complaint status");
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
    Alert.alert(
      "Complaint Action",
      `Title: ${complaint.title}\nResident: ${complaint.residentName} (${complaint.residentUnit})\n\nDetails: ${complaint.content}`,
      [
        { text: "Cancel", style: "cancel" },
        complaint.status !== "In Progress" && complaint.status !== "Resolved" && complaint.status !== "Closed" ? {
          text: "Mark In Progress",
          onPress: () => updateComplaintStatus(complaint.id, "In Progress")
        } : null,
        complaint.status !== "Resolved" && complaint.status !== "Closed" ? {
          text: "Mark Resolved",
          onPress: () => updateComplaintStatus(complaint.id, "Resolved")
        } : null,
        complaint.status !== "Closed" ? {
          text: "Mark Closed",
          onPress: () => updateComplaintStatus(complaint.id, "Closed")
        } : null,
      ].filter(Boolean) as any
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
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
                      <View style={styles.residentAvatar}>
                        <Text style={styles.residentAvatarText}>
                          {complaint.residentName.split(" ").map(p => p[0]).join("")}
                        </Text>
                      </View>
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
});
