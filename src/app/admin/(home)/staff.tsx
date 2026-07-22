import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";
import { StatusBar } from "expo-status-bar";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  category: "Security" | "Maintenance" | "Housekeeping" | "Others";
  status: "On Duty" | "Off Duty";
  avatar: string;
}

export default function ManageStaff() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Security" | "Maintenance" | "Housekeeping" | "Others">("Security");

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ total: 0, onDuty: 0, offDuty: 0 });

  const fetchStaff = async () => {
    if (!profile?.societyId) return;
    try {
      // 1. Fetch guards in this society
      const { data: members, error: memErr } = await supabase
        .from("societymembers")
        .select(`
          user_id,
          users (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("society_id", profile.societyId)
        .eq("role", "Guard");

      if (memErr) throw memErr;

      // 2. Fetch assignments
      const { data: assignments, error: assignErr } = await supabase
        .from("guard_assignments")
        .select("*");

      if (assignErr) throw assignErr;

      if (members) {
        let total = members.length;
        let onDuty = 0;
        let offDuty = 0;

        const mapped: StaffMember[] = members.map((m: any) => {
          const hasAssignment = assignments?.some((a: any) => a.guard_id === m.user_id);
          const status = hasAssignment ? "On Duty" : "Off Duty";

          if (hasAssignment) onDuty++;
          else offDuty++;

          return {
            id: m.user_id,
            name: m.users?.full_name || "Unknown Guard",
            role: "Security Guard",
            category: "Security",
            status,
            avatar: m.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.users?.full_name || "Guard")}&background=random`,
          };
        });

        setStaff(mapped);
        setCounts({ total, onDuty, offDuty });
      }
    } catch (err: any) {
      console.error("Error fetching staff:", err.message);
    }
  };

  const assignGuardShift = async (guardId: string, gate: string) => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("guard_assignments")
        .insert({
          guard_id: guardId,
          gate_name: gate,
          shift_start: "08:00:00",
          shift_end: "20:00:00",
          assigned_by: profile.id,
        });

      if (error) throw error;
      Alert.alert("Success", `Guard assigned to ${gate}`);
      await fetchStaff();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign guard");
    } finally {
      setLoading(false);
    }
  };

  const removeGuardShift = async (guardId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("guard_assignments")
        .delete()
        .eq("guard_id", guardId);

      if (error) throw error;
      Alert.alert("Success", "Guard removed from duty shift.");
      await fetchStaff();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to remove shift");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    Alert.alert(
      "Register Guard",
      "Would you like to register a new test guard profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Register",
          onPress: async () => {
            if (!profile?.societyId) return;
            setLoading(true);
            try {
              // Create a random user UUID
              const guardId = "550e8400-e29b-41d4-a716-" + Math.floor(100000000000 + Math.random() * 900000000000).toString();

              // 1. Insert into users
              const { error: userErr } = await supabase
                .from("users")
                .insert({
                  id: guardId,
                  role: "Guard",
                  full_name: "Guard Vikram Singh",
                  email: `vikram.guard.${Math.floor(Math.random() * 1000)}@homecircle.com`,
                  phone: "9876543210",
                });

              if (userErr) throw userErr;

              // 2. Insert into userverifications (auto-verified)
              const { error: verifyErr } = await supabase
                .from("userverifications")
                .insert({
                  user_id: guardId,
                  role: "Guard",
                  society_id: profile.societyId,
                  is_verified: true,
                  verified_by: "Admin Manual",
                });

              if (verifyErr) throw verifyErr;

              Alert.alert("Success", "Guard Vikram Singh successfully registered!");
              await fetchStaff();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to register guard.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      fetchStaff().finally(() => setLoading(false));
    }
  }, [profile?.societyId]);

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStaffPress = (staffMember: StaffMember) => {
    Alert.alert(
      "Guard Shift Management",
      `Manage shift for ${staffMember.name}:`,
      [
        { text: "Cancel", style: "cancel" },
        staffMember.status === "Off Duty" ? {
          text: "Assign Main Gate Shift",
          onPress: () => assignGuardShift(staffMember.id, "Main Gate")
        } : null,
        staffMember.status === "On Duty" ? {
          text: "Remove from Shift (Off Duty)",
          onPress: () => removeGuardShift(staffMember.id)
        } : null,
      ].filter(Boolean) as any
    );
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
          <Text style={styles.headerTitle}>Manage Staff</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert("Filter", "Open staff filters")}
        >
          <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Staff Overview Bento Grid */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Total</Text>
            <Text style={styles.overviewValue}>{counts.total}</Text>
          </View>
          <View style={[styles.overviewCard, styles.overviewCardActive]}>
            <Text style={[styles.overviewLabel, { color: theme.colors.onSecondaryContainer }]}>On Duty</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.secondary }]}>{counts.onDuty}</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Off Duty</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.error }]}>{counts.offDuty}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {(["Security", "Maintenance", "Housekeeping", "Others"] as const).map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.tabChip,
                    isActive ? styles.tabChipActive : styles.tabChipInactive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      isActive ? styles.tabChipTextActive : styles.tabChipTextInactive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Staff List */}
        <View style={styles.listSection}>
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.colors.secondary} />
            </View>
          ) : (
            <View style={styles.listWrapper}>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staffMember, index) => {
                  const isOnDuty = staffMember.status === "On Duty";
                  const isLast = index === filteredStaff.length - 1;
                  return (
                    <TouchableOpacity
                      key={staffMember.id}
                      style={[
                        styles.staffCard,
                        !isOnDuty && { opacity: 0.75 },
                        isLast && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => handleStaffPress(staffMember)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardLeft}>
                        <View style={styles.avatarWrapper}>
                          <Image
                            source={{ uri: staffMember.avatar }}
                            style={[styles.avatar]}
                          />
                          {isOnDuty && <View style={styles.statusDot} />}
                        </View>
                        <View style={styles.infoWrapper}>
                          <Text style={styles.staffName}>{staffMember.name}</Text>
                          <Text style={styles.staffRole}>{staffMember.role}</Text>
                        </View>
                      </View>
                      <View style={styles.cardRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: isOnDuty
                                ? theme.colors.secondaryContainer
                                : theme.colors.surfaceContainerHigh,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color: isOnDuty
                                  ? theme.colors.onSecondaryContainer
                                  : theme.colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            {staffMember.status}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.outline} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="engineering" size={48} color={theme.colors.outline} />
                  <Text style={styles.emptyText}>No staff on duty in this category.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.8}
        onPress={handleAddStaff}
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
  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewCardActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  overviewLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 4,
  },
  overviewValue: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  tabsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tabsScroll: {
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  tabChipActive: {
    backgroundColor: theme.colors.primary,
  },
  tabChipInactive: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  tabChipText: {
    ...theme.typography.labelMd,
    fontSize: 12,
  },
  tabChipTextActive: {
    color: theme.colors.onPrimary,
  },
  tabChipTextInactive: {
    color: theme.colors.onSurfaceVariant,
  },
  listSection: {
    marginTop: theme.spacing.sm,
  },
  listWrapper: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  staffCard: {
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
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  grayscaleImage: {
    tintColor: "gray",
    opacity: 0.6,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceContainerLowest,
  },
  infoWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  staffName: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  staffRole: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
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
