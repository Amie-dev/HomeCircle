import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const [filterRange, setFilterRange] = useState("Last 7 Days");

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Morning";
    if (hr < 17) return "Afternoon";
    return "Evening";
  };

  const visitorFrequencyData = {
    "Last 7 Days": [
      { day: "Mon", value: 60 },
      { day: "Tue", value: 45 },
      { day: "Wed", value: 85 },
      { day: "Thu", value: 70 },
      { day: "Fri", value: 55 },
      { day: "Sat", value: 95 },
      { day: "Sun", value: 80 },
    ],
    "Last 30 Days": [
      { day: "Mon", value: 75 },
      { day: "Tue", value: 50 },
      { day: "Wed", value: 90 },
      { day: "Thu", value: 65 },
      { day: "Fri", value: 80 },
      { day: "Sat", value: 100 },
      { day: "Sun", value: 85 },
    ],
  };

  const currentChartData = visitorFrequencyData[filterRange as keyof typeof visitorFrequencyData] || visitorFrequencyData["Last 7 Days"];

  const handleQuickAction = (action: string) => {
    if (action === "residents") {
      router.push("/admin/(tabs)/residents");
    } else {
      Alert.alert("Quick Action", `${action} pressed`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.logoText}>HomeCircle</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Admin Console</Text>
          </View>
          <Image
            style={styles.avatar}
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxcvZ7N6xqE7KoAb0iO3pAP_RPYEY_lmgvjDCXXWh02kxb6ygoREivTD_VDc4Sk_789wkQ9GxRR_qKq4I2lGbKfQ9tmIE9AQu9EfZ3ftdZ3x25uHJJL0TGOiR0ps2GHIojXRPN9C-9A1xNZk9d7TVSMfqQZy5h_pF5pUXDU-7qhaG6arqjVI9dBLp-pG25JSIHohoLHZkyfK3HZnAnISdrmCb2lYkzvCwMripkxsVjanF_1kcBftbi9Q",
            }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeLabel}>
            {greeting()}, {profile?.fullName || "Administrator"}
          </Text>
          <Text style={styles.welcomeTitle}>Society Overview</Text>
        </View>

        {/* Bento Grid Stats */}
        <View style={styles.statsGrid}>
          {/* Card 1 */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/(global)/visitor-log" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(0, 106, 97, 0.1)" }]}>
                <MaterialIcons name="group" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.statTrendText, { color: theme.colors.secondary }]}>+12%</Text>
            </View>
            <View>
              <Text style={styles.statCardLabel}>Today's Visitors</Text>
              <Text style={styles.statCardValue}>142</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2 */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/admin/(home)/staff" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(124, 131, 155, 0.1)" }]}>
                <MaterialIcons name="engineering" size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <Text style={styles.statTrendText}>Stable</Text>
            </View>
            <View>
              <Text style={styles.statCardLabel}>Active Staff</Text>
              <Text style={styles.statCardValue}>24</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3 */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/admin/(home)/complaints" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(186, 26, 26, 0.1)" }]}>
                <MaterialIcons name="report-problem" size={20} color={theme.colors.error} />
              </View>
              <Text style={[styles.statTrendText, { color: theme.colors.error }]}>High</Text>
            </View>
            <View>
              <Text style={styles.statCardLabel}>Open Complaints</Text>
              <Text style={styles.statCardValue}>08</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4 */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/admin/(home)/dues" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: "rgba(0, 0, 0, 0.05)" }]}>
                <MaterialIcons name="payments" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.statTrendText}>Due Today</Text>
            </View>
            <View>
              <Text style={styles.statCardLabel}>Pending Dues</Text>
              <Text style={styles.statCardValue}>$4.2k</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Visitor Frequency Chart & Quick Actions (Grid/Stack layout) */}
        <View style={styles.analyticsSection}>
          {/* Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Visitor Frequency</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setFilterRange(prev => (prev === "Last 7 Days" ? "Last 30 Days" : "Last 7 Days"));
                }}
              >
                <Text style={styles.dropdownText}>{filterRange}</Text>
                <MaterialIcons name="arrow-drop-down" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.chartBarsContainer}>
              {currentChartData.map((item, index) => (
                <View key={index} style={styles.chartBarWrapper}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${item.value}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions Card */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/admin/socities" as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <MaterialIcons name="business" size={20} color={theme.colors.onPrimary} />
                  <View style={{ flex: 1, marginLeft: 0 }}>
                    <Text style={styles.actionText} numberOfLines={1}>{profile?.societyName || "HomeCircle Society"}</Text>
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                      Sector 15, Gurgaon
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction("residents")}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <MaterialIcons name="person-add" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.actionText}>Manage Residents</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/admin/(tabs)/notices" as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <MaterialIcons name="campaign" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.actionText}>Post Notice</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/(global)/visitor-log" as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <MaterialIcons name="assignment" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.actionText}>View Logs</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            <View style={styles.secureFooter}>
              <MaterialIcons name="shield" size={16} color={theme.colors.secondaryContainer} />
              <Text style={styles.secureFooterText}>System Secure - 100% Uptime</Text>
            </View>
          </View>
        </View>

        {/* Recent Visitor Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Visitor Activity</Text>
            <TouchableOpacity onPress={() => router.push("/admin/(tabs)/reports")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {/* Item 1 */}
            <View style={styles.activityItem}>
              <Image
                style={styles.activityAvatar}
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpflrYWie7qBXXhNClLhrqF5B1uYLWRSmQ8n_3jSott0TlHI2OQjasSNkw_f9e9IjZeFSPyePLJtF99O3BJliNFnLX7zwRt-Ed74N4ZrabLpZjLubLBajTu--XZ4kGulUUVYXJeCn3vxMFI-QnATeK48It3F9s0Q_f4tUr0Js8_sMUQBnnG3hBT7BXKxYS-WzRVCeCyCRyyMTcE7UoDc77Lfm1wr3BBx9fPSEcN0rLZ6T0jVU2cv19Vw",
                }}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>Delivery: John Smith</Text>
                <Text style={styles.activitySub}>Unit 402 • 10:45 AM</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text style={[styles.statusBadgeText, { color: theme.colors.onSecondaryContainer }]}>
                  Approved
                </Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.activityItem}>
              <Image
                style={styles.activityAvatar}
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjGXgOwuQ2vwJuO2fN5__xa2lUlR2HVbR0lzyNWg9cZZzapBADOVBIFDl8tszHVb7f1BIjxrwGD4MYMtH9wF5pFuKxLp6V9HoXqzuZpYJp-e0pSDsNGJddzQlxWgfvrh9QbH6HPMiJLMQ3FKIWKhjj-24T5FoCx88mue1otgpNwQHtNW4u4grVvQdHzRAAjBNZmJUAd-jOygCwJLpGJ9Ic685kv_yRGnEfyIi9Paf0ad7F_AOkfEfLpg",
                }}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>Guest: Martha Wayne</Text>
                <Text style={styles.activitySub}>Unit 105 • 09:30 AM</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
                <Text style={[styles.statusBadgeText, { color: theme.colors.onSurfaceVariant }]}>
                  Checked Out
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB for contextual action */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 76 }]}
        activeOpacity={0.8}
        onPress={() => Alert.alert("Create Pass", "Shortcut to create guest/visitor pass.")}
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
  iconContainer: {
    padding: 6,
    borderRadius: 999,
  },
  logoText: {
    ...theme.typography.headlineLgMobile,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeContainer: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSecondaryContainer,
    fontSize: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  welcomeSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  welcomeLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  welcomeTitle: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: (width - theme.spacing.containerMarginMobile * 2 - 12) / 2 - 2,
    height: 120,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    justifyContent: "space-between",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statIconBox: {
    padding: 6,
    borderRadius: 8,
  },
  statTrendText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  statCardLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  statCardValue: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  analyticsSection: {
    gap: 16,
    marginBottom: theme.spacing.lg,
  },
  chartCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.rounded.default,
  },
  dropdownText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  chartBarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 8,
  },
  chartBarWrapper: {
    alignItems: "center",
    flex: 1,
  },
  barBackground: {
    width: 14,
    height: 120,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 999,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 999,
  },
  barLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 9,
    marginTop: 8,
  },
  quickActionsCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    justifyContent: "space-between",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onPrimary,
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 14,
    borderRadius: theme.rounded.md,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  secureFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16,
    opacity: 0.8,
  },
  secureFooterText: {
    ...theme.typography.labelMd,
    color: theme.colors.onPrimary,
    fontSize: 11,
  },
  activitySection: {
    marginTop: theme.spacing.sm,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  activityTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  viewAllText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  activityList: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  activitySub: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.rounded.full,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "700",
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
