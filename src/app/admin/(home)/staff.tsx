import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  category: "Security" | "Maintenance" | "Housekeeping" | "Others";
  status: "On Duty" | "Off Duty";
  avatar: string;
}

const mockStaff: StaffMember[] = [
  {
    id: "st-1",
    name: "Rajesh Kumar",
    role: "Senior Security Officer",
    category: "Security",
    status: "On Duty",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFsW4avb9RUDIzXCW8djuFtbd6XuS6e6T988INncf3CnIOsGXyRmqVpyRBhJsU8UwwMZE8SVUR5dMWFKvIRxuEdsjn9bOoo887r-cpHmVeqoxyAGhNgfQl8nvJhtQzuIUWPyMq76I9e-UpUAm4b2reKbeRTxfHxG4_agNGkm5oPGd5a3r60KvNup2aVxQPqGBcvh8L36wGH9gBx9PlJbJPDcDIi-OFOriUcxieLv6PXaOPx03gCE32mA",
  },
  {
    id: "st-2",
    name: "Amit Sharma",
    role: "Head Electrician",
    category: "Maintenance",
    status: "On Duty",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQpMhTzyjdPXilJixYL5WQFY7wB2n5ZQIYFysU_ufIO6VBcUOc18dywcuxe8PvHQ78aGn9HINkYRVe4aA6Ro-r7Sca5c5X7qqsR1-HXJrtjt7TIENAN__FjYFh4XkzEjx7s0Guv_M8KRlezNCwHNKdBfjrUviv31UPZelqDsfzCjZGps1JmP0bNAXWsXPBKVp8bIOsXUwjwNqUc4Jg1kFBf4rbIPZVFeDbEojgNCOas05j0oMhmS2vrg",
  },
  {
    id: "st-3",
    name: "Sunita Devi",
    role: "Security Supervisor",
    category: "Security",
    status: "Off Duty",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAko2tr801nYUKhaPePOMFlaQVKYkTpXojqrmaqrvrfsQLjzQJfWoBqyU-HdwWI-NdssXjwu4WqZqPx2Evp3AL5cTBSPVTFTqVeshcXOrbu9yGYBt48RrmOO4dqVXBWDq-Kza_-WGcOG6uzx8NDfMvwVwLDsUhsY4K9hiM9qVpqXRoavi3LcUICS7g7DuR1S8WpEt-u248c21uPMTZHxrjK77q1-ZRKmBDYb-Bfj9vBkarn4aXG5b3sig",
  },
  {
    id: "st-4",
    name: "Vikram Singh",
    role: "Gate Manager",
    category: "Security",
    status: "On Duty",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOtvugD4ecNGGxEV67Sip_ev8ny1XTtEQ80z1hzWDWa08QXUvMa5bFyQUMSXDh1XFZaBtGqQM18AbZ3slXk7S3dFyhUM7zd1JuIlyuLLNqvKKfczRDMDQ-1gFF6TBTxkLV-3I8nwySQuioTPRMLkFQE9K1Q15yH91aqHdrA2-kq-WeyUKq5_riq2FCwLFCjyfhIRF0VjxWiDQkSwYTSsmI0gojHcjxGin_Jgh8CySxicml6phFYcBE8g",
  },
];

export default function ManageStaff() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Security" | "Maintenance" | "Housekeeping" | "Others">("Security");

  const filteredStaff = mockStaff.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = staff.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStaffPress = (staff: StaffMember) => {
    Alert.alert("Staff Details", `Name: ${staff.name}\nRole: ${staff.role}\nStatus: ${staff.status}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
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
            <Text style={styles.overviewValue}>42</Text>
          </View>
          <View style={[styles.overviewCard, styles.overviewCardActive]}>
            <Text style={[styles.overviewLabel, { color: theme.colors.onSecondaryContainer }]}>On Duty</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.secondary }]}>38</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Absent</Text>
            <Text style={[styles.overviewValue, { color: theme.colors.error }]}>04</Text>
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
          <View style={styles.listWrapper}>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff, index) => {
                const isOnDuty = staff.status === "On Duty";
                const isLast = index === filteredStaff.length - 1;
                return (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffCard,
                      !isOnDuty && { opacity: 0.75 },
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleStaffPress(staff)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardLeft}>
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{ uri: staff.avatar }}
                          style={[styles.avatar, !isOnDuty && styles.grayscaleImage]}
                        />
                        {isOnDuty && <View style={styles.statusDot} />}
                      </View>
                      <View style={styles.infoWrapper}>
                        <Text style={styles.staffName}>{staff.name}</Text>
                        <Text style={styles.staffRole}>{staff.role}</Text>
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
                          {staff.status}
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
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.8}
        onPress={() => Alert.alert("Add Staff", "Register a new service staff profile.")}
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
