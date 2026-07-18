import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminReports() {
  const insets = useSafeAreaInsets();
  const [trendsFilter, setTrendsFilter] = useState("30 Days");

  const visitorsSparkline = [30, 20, 50, 40, 80, 60, 100];

  const visitorTrendData = {
    "30 Days": [40, 55, 45, 70, 60, 85, 90, 50, 42, 58, 75, 65, 95],
    "90 Days": [60, 40, 75, 50, 90, 80, 100, 70, 65, 80, 55, 75, 85],
  };

  const currentTrend = visitorTrendData[trendsFilter as keyof typeof visitorTrendData];

  const handleExport = () => {
    Alert.alert("Export Report", "Exporting monthly society analytics as PDF...");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Alert.alert("Filter", "Open reports filter options.")}
        >
          <MaterialIcons name="filter-list" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Metrics */}
        <View style={styles.metricsContainer}>
          {/* Card 1: Monthly Visitors */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Monthly Visitors</Text>
              <View style={styles.metricTrendBadge}>
                <Text style={styles.metricTrendText}>+12.5%</Text>
              </View>
            </View>
            <View style={styles.metricValueContainer}>
              <Text style={styles.metricValue}>2,482</Text>
              <Text style={styles.metricUnit}>entries</Text>
            </View>
            {/* Sparkline */}
            <View style={styles.sparklineContainer}>
              {visitorsSparkline.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparklineBar,
                    { height: `${h}%`, opacity: i === visitorsSparkline.length - 1 ? 1 : 0.4 },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Card 2: Avg. Resolution Time */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Avg. Resolution</Text>
              <MaterialIcons name="timer" size={16} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.metricValueContainer}>
              <Text style={styles.metricValue}>4.2</Text>
              <Text style={styles.metricUnit}>hours</Text>
            </View>
            <Text style={styles.metricSubText}>18% faster than last month</Text>
            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "82%" }]} />
            </View>
          </View>

          {/* Card 3: Amenity Utilization */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Amenity Utilization</Text>
              <MaterialIcons name="fitness-center" size={16} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.metricValueContainer}>
              <Text style={styles.metricValue}>78%</Text>
              <Text style={styles.metricUnit}>capacity</Text>
            </View>
            {/* Overlapping Faces */}
            <View style={styles.overlappingFaces}>
              <Image
                style={[styles.faceImage, { zIndex: 3 }]}
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDekHwOSTz65HqMhS4YVqD6p_UrGfMTuxtV4oQb7CEadTyuFiumofl8Jt6Pf_N16v8qLtY1v9xcZuH6--E59y3nRyN1tPu0XEWzc7IXuamU5b6voGKWOsLJ64jJLcNDmaVgoDmIgkzOxSAOXWVj6C5yLW2pQ5pSNKDGqpYCaoJQdumOcJkieZNItOZb6-TTvBx-zrm2autj2qGUvS8nt0HaGHLst8SuuHrfPVfKlOoQSEdTUrobHHg64g",
                }}
              />
              <Image
                style={[styles.faceImage, { left: 16, zIndex: 2 }]}
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTqtHw72gRg822uOifpNCwmTel1UbNJcawcMIr3jZU8Lx_UanbTKJfRLnm7oiYT258ZWTuRBVLWi1KA-H63vxy47jQB8ScYJCR-HoifNpN3SPNKNzq7Xfl4lbgnJsFbLWJhXlFDs2JvPw-5RnLWfTuP2SwPEPz_SRpeQBqfHBeNRxyv5VrurFkImhNPbFzvGvLNUEyqkWfy2QNd7NyLFLDc3CfQEDOZzIPxKIvgW9teLCg2zTi-hHi9Q",
                }}
              />
              <Image
                style={[styles.faceImage, { left: 32, zIndex: 1 }]}
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgIoS23TtUQwFtfSzB8S54q17BZvUKIkZ96SePWKqtPPRPGyakyVo6CvpIn8ayJV5lz8K3sr1vIdFx7awOc8HRxQltx26SDvTeKzetXnnBSRNty49-SsaoTMOQ9nFfrTiB2gZCa7DZvoX8cN-Sv8FkmDgzL_L0QTVXweMCTWV_ChJFpW8iiXmz70jAGZpcmcq7h5tSl9f3vpCX3rWXoM_JPEEyzOFjzx5gVxkXqoAqeV-O2HnifS_tKg",
                }}
              />
              <View style={[styles.faceCounter, { left: 48 }]}>
                <Text style={styles.faceCounterText}>+42</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Visitor Trends Card */}
        <View style={styles.trendsCard}>
          <View style={styles.trendsHeader}>
            <Text style={styles.trendsTitle}>Visitor Trends</Text>
            <View style={styles.toggleContainer}>
              {(["30 Days", "90 Days"] as const).map((filter) => {
                const isActive = trendsFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                    onPress={() => setTrendsFilter(filter)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.chartBarsContainer}>
            {currentTrend.map((h, i) => (
              <View key={i} style={styles.trendBarWrapper}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: `${h}%`,
                      backgroundColor: i === currentTrend.length - 1 ? theme.colors.secondary : "rgba(0, 106, 97, 0.3)",
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.chartXLabels}>
            <Text style={styles.xLabel}>Aug 01</Text>
            <Text style={styles.xLabel}>Aug 15</Text>
            <Text style={styles.xLabel}>Aug 30</Text>
          </View>
        </View>

        {/* Complaint Analysis */}
        <View style={styles.complaintCard}>
          <Text style={styles.complaintTitle}>Complaint Analysis</Text>

          <View style={styles.categoriesList}>
            {/* Category 1 */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>Plumbing</Text>
                <Text style={styles.categoryValue}>42%</Text>
              </View>
              <View style={styles.categoryBarBg}>
                <View style={[styles.categoryBarFill, { width: "42%", backgroundColor: theme.colors.secondary }]} />
              </View>
            </View>

            {/* Category 2 */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>Electrical</Text>
                <Text style={styles.categoryValue}>28%</Text>
              </View>
              <View style={styles.categoryBarBg}>
                <View style={[styles.categoryBarFill, { width: "28%", backgroundColor: theme.colors.secondaryContainer }]} />
              </View>
            </View>

            {/* Category 3 */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>Noise</Text>
                <Text style={styles.categoryValue}>15%</Text>
              </View>
              <View style={styles.categoryBarBg}>
                <View style={[styles.categoryBarFill, { width: "15%", backgroundColor: theme.colors.primary }]} />
              </View>
            </View>

            {/* Category 4 */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>Others</Text>
                <Text style={styles.categoryValue}>15%</Text>
              </View>
              <View style={styles.categoryBarBg}>
                <View style={[styles.categoryBarFill, { width: "15%", backgroundColor: theme.colors.outlineVariant }]} />
              </View>
            </View>
          </View>

          <View style={styles.complaintFooter}>
            <View style={styles.footerStat}>
              <Text style={[styles.footerStatValue, { color: theme.colors.secondary }]}>82</Text>
              <Text style={styles.footerStatLabel}>Resolved</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.footerStat}>
              <Text style={[styles.footerStatValue, { color: theme.colors.error }]}>12</Text>
              <Text style={styles.footerStatLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Staff Efficiency Table */}
        <View style={styles.staffCard}>
          <Text style={styles.staffTitle}>Staff Efficiency</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 1.2 }]}>Department</Text>
            <Text style={[styles.thText, { flex: 1.2 }]}>Top Performer</Text>
            <Text style={[styles.thText, { flex: 1.5, textAlign: "right" }]}>Score & Rating</Text>
          </View>

          {/* Row 1 */}
          <View style={styles.tableRow}>
            <View style={[styles.tdLeft, { flex: 1.2 }]}>
              <MaterialIcons name="security" size={16} color={theme.colors.secondary} />
              <Text style={styles.tdText}>Security</Text>
            </View>
            <Text style={[styles.tdSubText, { flex: 1.2 }]}>R. Simmons</Text>
            <View style={[styles.ratingWrapper, { flex: 1.5 }]}>
              <Text style={styles.scoreText}>98%</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <MaterialIcons key={s} name="star" size={12} color={theme.colors.secondary} />
                ))}
              </View>
              <MaterialIcons name="trending-up" size={16} color={theme.colors.secondary} style={styles.trendIcon} />
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.tableRow}>
            <View style={[styles.tdLeft, { flex: 1.2 }]}>
              <MaterialIcons name="engineering" size={16} color={theme.colors.secondary} />
              <Text style={styles.tdText}>Maintenance</Text>
            </View>
            <Text style={[styles.tdSubText, { flex: 1.2 }]}>J. Aris</Text>
            <View style={[styles.ratingWrapper, { flex: 1.5 }]}>
              <Text style={styles.scoreText}>92%</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4].map((s) => (
                  <MaterialIcons key={s} name="star" size={12} color={theme.colors.secondary} />
                ))}
                <MaterialIcons name="star-outline" size={12} color={theme.colors.outlineVariant} />
              </View>
              <MaterialIcons name="trending-flat" size={16} color={theme.colors.onSurfaceVariant} style={styles.trendIcon} />
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.tdLeft, { flex: 1.2 }]}>
              <MaterialIcons name="cleaning-services" size={16} color={theme.colors.secondary} />
              <Text style={styles.tdText}>Sanitation</Text>
            </View>
            <Text style={[styles.tdSubText, { flex: 1.2 }]}>M. Chen</Text>
            <View style={[styles.ratingWrapper, { flex: 1.5 }]}>
              <Text style={styles.scoreText}>89%</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4].map((s) => (
                  <MaterialIcons key={s} name="star" size={12} color={theme.colors.secondary} />
                ))}
                <MaterialIcons name="star-outline" size={12} color={theme.colors.outlineVariant} />
              </View>
              <MaterialIcons name="trending-up" size={16} color={theme.colors.secondary} style={styles.trendIcon} />
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.exportButton} activeOpacity={0.8} onPress={handleExport}>
          <MaterialIcons name="download" size={20} color={theme.colors.onPrimary} />
          <Text style={styles.exportText}>Export Monthly Report</Text>
        </TouchableOpacity>
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
