import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

export default function AdminReports() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const [trendsFilter, setTrendsFilter] = useState("30 Days");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    monthlyVisitors: 0,
    sparkline: [10, 10, 10, 10, 10, 10, 10],
    avgResolutionHours: "0.0",
    resolutionProgress: "0%",
  });

  const fetchReportData = async () => {
    if (!profile?.societyId) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: visitorData, error: visErr } = await supabase
        .from("visitor_logs")
        .select("created_at, requestpasses!inner(*)")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .eq("requestpasses.resident_details->>societyId", profile.societyId);

      if (visErr) throw visErr;

      const monthlyCount = visitorData?.length || 0;
      const sparklineCounts = [0, 0, 0, 0, 0, 0, 0];
      if (visitorData && visitorData.length > 0) {
        visitorData.forEach((log: any) => {
          const logDate = new Date(log.created_at);
          const diffDays = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          const chunkIndex = Math.min(6, Math.floor(diffDays / 4.3));
          sparklineCounts[6 - chunkIndex] += 1;
        });
      }
      const maxSparkVal = Math.max(...sparklineCounts, 1);
      const normalizedSparkline = sparklineCounts.map((v) => Math.round((v / maxSparkVal) * 100) || 10);

      const { data: ticketsData, error: tickErr } = await supabase
        .from("tickets")
        .select("created_at, resolved_at, status")
        .eq("society_id", profile.societyId);

      if (tickErr) throw tickErr;

      let avgHours = 0;
      let progressStr = "0%";
      if (ticketsData && ticketsData.length > 0) {
        const resolved = ticketsData.filter((t: any) => t.status === "Resolved" || t.status === "Closed");
        const withTimes = ticketsData.filter((t: any) => t.resolved_at);

        if (withTimes.length > 0) {
          let totalMs = 0;
          withTimes.forEach((t: any) => {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.resolved_at).getTime();
            totalMs += (end - start);
          });
          avgHours = totalMs / (1000 * 60 * 60 * withTimes.length);
        }

        const pct = Math.round((resolved.length / ticketsData.length) * 100);
        progressStr = `${pct}%`;
      }

      setMetrics({
        monthlyVisitors: monthlyCount,
        sparkline: normalizedSparkline,
        avgResolutionHours: avgHours.toFixed(1),
        resolutionProgress: progressStr,
      });
    } catch (err: any) {
      console.error("Error loading reports data:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      fetchReportData().finally(() => setLoading(false));
    }
  }, [profile?.societyId]);

  const handleExport = () => {
    Alert.alert(
      "Export Report",
      `Generating analytical PDF report for ${profile?.societyName || "Society"}:\n- Monthly Visitors: ${metrics.monthlyVisitors}\n- Avg. Complaint Resolution: ${metrics.avgResolutionHours} hrs\n- Complaint Resolution Rate: ${metrics.resolutionProgress}\n\nExporting as PDF...`
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => fetchReportData()}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          </View>
        ) : (
          <>
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Monthly Visitors</Text>
                  <View style={styles.metricTrendBadge}>
                    <Text style={styles.metricTrendText}>Last 30d</Text>
                  </View>
                </View>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>{metrics.monthlyVisitors}</Text>
                  <Text style={styles.metricUnit}>entries</Text>
                </View>
                <View style={styles.sparklineContainer}>
                  {metrics.sparkline.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.sparklineBar,
                        { height: `${h}%`, opacity: i === metrics.sparkline.length - 1 ? 1 : 0.4 },
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Avg. Resolution</Text>
                  <MaterialIcons name="timer" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>{metrics.avgResolutionHours}</Text>
                  <Text style={styles.metricUnit}>hours</Text>
                </View>
                <Text style={styles.metricSubText}>Resolution Rate: {metrics.resolutionProgress}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: metrics.resolutionProgress as any }]} />
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Amenity Utilization</Text>
                  <MaterialIcons name="fitness-center" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>78%</Text>
                  <Text style={styles.metricUnit}>capacity</Text>
                </View>
                <View style={styles.overlappingFaces}>
                  <Image style={[styles.faceImage, { zIndex: 3 }]} source={{ uri: "https://ui-avatars.com/api/?name=A&background=random" }} />
                  <Image style={[styles.faceImage, { left: 16, zIndex: 2 }]} source={{ uri: "https://ui-avatars.com/api/?name=B&background=random" }} />
                  <Image style={[styles.faceImage, { left: 32, zIndex: 1 }]} source={{ uri: "https://ui-avatars.com/api/?name=C&background=random" }} />
                </View>
              </View>
            </View>

            <View style={styles.trendsCard}>
              <View style={styles.trendsHeader}>
                <Text style={styles.trendsTitle}>Visitor Inflow Trends</Text>
                <View style={styles.toggleContainer}>
                  {(["30 Days", "90 Days"] as const).map((filter) => {
                    const isActive = trendsFilter === filter;
                    return (
                      <TouchableOpacity
                        key={filter}
                        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                        onPress={() => setTrendsFilter(filter)}
                      >
                        <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>{filter}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.chartBarsContainer}>
                {metrics.sparkline.map((h, i) => (
                  <View key={i} style={styles.trendBarWrapper}>
                    <View style={[styles.trendBar, { height: `${h}%`, backgroundColor: i === metrics.sparkline.length - 1 ? theme.colors.secondary : "rgba(0, 106, 97, 0.3)" }]} />
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.exportButton} activeOpacity={0.8} onPress={handleExport}>
              <MaterialIcons name="download" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.exportText}>Export Monthly Report</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 140,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  metricsContainer: {
    gap: 12,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    height: 140,
    justifyContent: "space-between",
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  metricTrendBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  metricTrendText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSecondaryContainer,
    fontSize: 9,
    fontWeight: "700",
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricValue: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  metricUnit: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  metricSubText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  sparklineContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 32,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
    borderRadius: 999,
  },
  overlappingFaces: {
    flexDirection: "row",
    height: 32,
    alignItems: "center",
    position: "relative",
  },
  faceImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.surfaceContainerLowest,
    position: "absolute",
  },
  faceCounter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.onSurfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.surfaceContainerLowest,
    position: "absolute",
  },
  faceCounterText: {
    ...theme.typography.labelMd,
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: "700",
  },
  trendsCard: {
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
    marginBottom: theme.spacing.lg,
  },
  trendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  trendsTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.default,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  toggleTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  chartBarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
    paddingHorizontal: 8,
  },
  trendBarWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 1.5,
  },
  trendBar: {
    width: "100%",
    borderRadius: 3,
  },
  chartXLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  xLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  complaintCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: theme.spacing.lg,
  },
  complaintTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  categoriesList: {
    gap: 16,
  },
  categoryItem: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  categoryValue: {
    ...theme.typography.bodyMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  categoryBarBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 999,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  complaintFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.2)",
  },
  footerStat: {
    alignItems: "center",
  },
  footerStatValue: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
  },
  footerStatLabel: {
    ...theme.typography.labelMd,
    fontSize: 9,
    textTransform: "uppercase",
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(198, 198, 205, 0.3)",
  },
  staffCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: theme.spacing.lg,
  },
  staffTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    paddingBottom: 8,
    marginBottom: 8,
  },
  thText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
    paddingVertical: 12,
  },
  tdLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tdText: {
    ...theme.typography.bodyMd,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  tdSubText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  ratingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  scoreText: {
    ...theme.typography.bodyMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  stars: {
    flexDirection: "row",
    marginHorizontal: 4,
  },
  trendIcon: {
    marginLeft: 4,
  },
  exportButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    paddingVertical: 14,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  exportText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
