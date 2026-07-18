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

import { useEffect } from "react";
import { supabase } from "../../../../utils/supabase";
import { ActivityIndicator } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const [filterRange, setFilterRange] = useState("Last 7 Days");

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    activeStaff: 0,
    openComplaints: 0,
    pendingDues: "₹0",
  });
  const [chartData, setChartData] = useState<{ day: string; value: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Morning";
    if (hr < 17) return "Afternoon";
    return "Evening";
  };

  const fetchDashboardData = async () => {
    if (!profile?.societyId) return;
    try {
      // 1. Today's Visitors count
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count: visitorsCount } = await supabase
        .from("visitor_logs")
        .select("*, requestpasses!inner(*)", { count: "exact", head: true })
        .eq("action_type", "Check-in")
        .gte("created_at", startOfDay.toISOString())
        .eq("requestpasses.resident_details->>societyId", profile.societyId);

      // 2. Active Staff count (Guards)
      const { count: staffCount } = await supabase
        .from("societymembers")
        .select("*", { count: "exact", head: true })
        .eq("society_id", profile.societyId)
        .eq("role", "Guard");

      // 3. Open Complaints count
      const { count: complaintsCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("society_id", profile.societyId)
        .in("status", ["Pending", "In Progress"]);

      // 4. Pending Dues sum
      const { data: duesData } = await supabase
        .from("maintenance_invoices")
        .select("amount")
        .eq("society_id", profile.societyId)
        .in("status", ["Pending", "Overdue"]);

      const totalDues = duesData?.reduce((acc: number, item: any) => acc + Number(item.amount), 0) || 0;
      const formattedDues = totalDues >= 1000 
        ? `₹${(totalDues / 1000).toFixed(1)}k` 
        : `₹${totalDues}`;

      setStats({
        todayVisitors: visitorsCount || 0,
        activeStaff: staffCount || 0,
        openComplaints: complaintsCount || 0,
        pendingDues: formattedDues,
      });

      // 5. Recent Activity (last 3 visitor logs)
      const { data: logsData } = await supabase
        .from("visitor_logs")
        .select(`
          id,
          action_type,
          created_at,
          requestpasses!inner (
            visitor_name,
            designation,
            tower_no,
            flat_no
          )
        `)
        .eq("requestpasses.resident_details->>societyId", profile.societyId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (logsData) {
        setRecentActivity(
          logsData.map((log: any) => {
            const timeText = new Date(log.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              id: log.id,
              name: `${log.requestpasses?.designation || "Visitor"}: ${log.requestpasses?.visitor_name || "Unknown"}`,
              unit: `Unit ${log.requestpasses?.tower_no || ""}-${log.requestpasses?.flat_no || ""} • ${timeText}`,
              status: log.action_type === "Check-in" ? "Checked In" : "Checked Out",
            };
          })
        );
      }

      // 6. Chart Data
      const startOfRange = new Date();
      startOfRange.setDate(startOfRange.getDate() - 7);
      const { data: chartLogs } = await supabase
        .from("visitor_logs")
        .select(`
          created_at,
          requestpasses!inner (
            resident_details
          )
        `)
        .eq("action_type", "Check-in")
        .gte("created_at", startOfRange.toISOString())
        .eq("requestpasses.resident_details->>societyId", profile.societyId);

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const countsByDay: Record<string, number> = {};
      const order = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        countsByDay[dayName] = 0;
        order.push(dayName);
      }

      if (chartLogs) {
        chartLogs.forEach((log: any) => {
          const logDate = new Date(log.created_at);
          const dayName = days[logDate.getDay()];
          if (countsByDay[dayName] !== undefined) {
            countsByDay[dayName] += 1;
          }
        });
      }

      const maxVal = Math.max(...Object.values(countsByDay), 1);
      const formattedChart = order.map((dayName) => ({
        day: dayName,
        value: Math.round((countsByDay[dayName] / maxVal) * 100) || 5,
      }));
      setChartData(formattedChart);

    } catch (err: any) {
      console.error("Error loading dashboard data:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      fetchDashboardData().finally(() => setLoading(false));
    }
  }, [profile?.societyId]);

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

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          </View>
        ) : (
          <>
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
                  <Text style={[styles.statTrendText, { color: theme.colors.secondary }]}>Live</Text>
                </View>
                <View>
                  <Text style={styles.statCardLabel}>Today's Visitors</Text>
                  <Text style={styles.statCardValue}>{stats.todayVisitors}</Text>
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
                  <Text style={styles.statTrendText}>Guards</Text>
                </View>
                <View>
                  <Text style={styles.statCardLabel}>Active Staff</Text>
                  <Text style={styles.statCardValue}>{stats.activeStaff}</Text>
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
                  <Text style={styles.statCardValue}>{stats.openComplaints}</Text>
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
                  <Text style={styles.statTrendText}>Unpaid</Text>
                </View>
                <View>
                  <Text style={styles.statCardLabel}>Pending Dues</Text>
                  <Text style={styles.statCardValue}>{stats.pendingDues}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Visitor Frequency Chart & Quick Actions (Grid/Stack layout) */}
            <View style={styles.analyticsSection}>
              {/* Chart Card */}
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Visitor Frequency</Text>
                  <View style={styles.dropdownButton}>
                    <Text style={styles.dropdownText}>{filterRange}</Text>
                  </View>
                </View>

                <View style={styles.chartBarsContainer}>
                  {chartData.map((item, index) => (
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.statIconBox, { backgroundColor: "rgba(0, 106, 97, 0.05)" }]}>
                        <MaterialIcons name="person" size={24} color={theme.colors.secondary} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>{activity.name}</Text>
                        <Text style={styles.activitySub}>{activity.unit}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              activity.status === "Checked In"
                                ? theme.colors.secondaryContainer
                                : theme.colors.surfaceContainerHighest,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                activity.status === "Checked In"
                                  ? theme.colors.onSecondaryContainer
                                  : theme.colors.onSurfaceVariant,
                            },
                          ]}
                        >
                          {activity.status}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ padding: 32, alignItems: "center" }}>
                    <Text style={{ color: theme.colors.outline, ...theme.typography.bodyMd }}>
                      No recent visitor activity logged today.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB for contextual action */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 76 }]}
        activeOpacity={0.8}
        onPress={() => router.push("/admin/(tabs)/notices" as any)}
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
