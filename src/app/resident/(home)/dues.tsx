import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";

export default function MaintenanceDuesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const handlePayNow = () => {
    Alert.alert("Payment Gateway", "Proceed to secure payment of ₹4,500.00?", [
      { text: "Pay", onPress: () => Alert.alert("Success", "Payment of ₹4,500.00 received! Thank you.") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />

      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Maintenance Dues</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={() => Alert.alert("Notifications", "No new billing alerts.")}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Current Balance Due</Text>
            <Text style={styles.balanceText}>₹4,500.00</Text>

            <View style={styles.dueDateRow}>
              <MaterialIcons name="calendar-today" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.dueDateText}>Due by Oct 31, 2023</Text>
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={handlePayNow}>
              <MaterialIcons name="lock" size={16} color={theme.colors.secondary} />
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
          <MaterialIcons name="account-balance-wallet" size={120} color="rgba(255,255,255,0.06)" style={styles.bgIcon} />
        </View>

        {/* Segmented Control Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
              Pending Bills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
              Payment History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "pending" ? (
          <View style={styles.breakdownSection}>
            {/* Header */}
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Bill Breakdown</Text>
              <Text style={styles.monthText}>October 2023</Text>
            </View>

            {/* Breakdown List Card */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownItems}>
                {/* Item 1 */}
                <View style={styles.breakdownRow}>
                  <View style={styles.rowLeft}>
                    <View style={styles.itemIconWrapper}>
                      <MaterialIcons name="home-work" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.itemName}>Monthly Maintenance</Text>
                  </View>
                  <Text style={styles.itemVal}>₹3,200.00</Text>
                </View>

                <View style={styles.divider} />

                {/* Item 2 */}
                <View style={styles.breakdownRow}>
                  <View style={styles.rowLeft}>
                    <View style={styles.itemIconWrapper}>
                      <MaterialIcons name="savings" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.itemName}>Sinking Fund</Text>
                  </View>
                  <Text style={styles.itemVal}>₹800.00</Text>
                </View>

                <View style={styles.divider} />

                {/* Item 3 */}
                <View style={styles.breakdownRow}>
                  <View style={styles.rowLeft}>
                    <View style={styles.itemIconWrapper}>
                      <MaterialIcons name="water-drop" size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.itemName}>Water Charges</Text>
                  </View>
                  <Text style={styles.itemVal}>₹500.00</Text>
                </View>
              </View>

              {/* Total Row */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount Due</Text>
                <Text style={styles.totalVal}>₹4,500.00</Text>
              </View>
            </View>

            {/* Late Penalty Notice Card */}
            <View style={styles.penaltyCard}>
              <MaterialIcons name="info" size={20} color={theme.colors.error} />
              <Text style={styles.penaltyText}>
                <Text style={{ fontWeight: "700" }}>Note:</Text> A late payment penalty of 2% per month will be applicable on dues paid after the due date (Oct 31, 2023).
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.historySection}>
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>September 2023</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>PAID</Text>
                </View>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Maintenance Bill</Text>
                <Text style={styles.historyVal}>₹4,500.00</Text>
              </View>
              <Text style={styles.receiptDate}>Paid on Sep 28, 2023 • Txn ID: HC-982736</Text>
            </View>

            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>August 2023</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>PAID</Text>
                </View>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Maintenance Bill</Text>
                <Text style={styles.historyVal}>₹4,500.00</Text>
              </View>
              <Text style={styles.receiptDate}>Paid on Aug 27, 2023 • Txn ID: HC-972183</Text>
            </View>
          </View>
        )}

        {/* Security / Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <MaterialIcons name="verified-user" size={16} color={theme.colors.outline} />
            <Text style={styles.trustBadgeText}>PCI COMPLIANT</Text>
          </View>
          <View style={styles.trustBadge}>
            <MaterialIcons name="account-balance" size={16} color={theme.colors.outline} />
            <Text style={styles.trustBadgeText}>BANK VERIFIED</Text>
          </View>
          <View style={styles.trustBadge}>
            <MaterialIcons name="enhanced-encryption" size={16} color={theme.colors.outline} />
            <Text style={styles.trustBadgeText}>ENCRYPTED</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topAppBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: 32,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.2)",
    zIndex: 50,
  },
  topAppBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  appBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  notifyBtn: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 24,
    minHeight: 180,
    position: "relative",
    overflow: "hidden",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryContent: {
    zIndex: 2,
    gap: 12,
  },
  summaryLabel: {
    ...theme.typography.labelMd,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceText: {
    ...theme.typography.headlineXl,
    color: "#ffffff",
    fontWeight: "800",
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dueDateText: {
    ...theme.typography.bodyMd,
    color: "rgba(255, 255, 255, 0.8)",
  },
  payBtn: {
    backgroundColor: theme.colors.secondaryContainer,
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  payBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSecondaryContainer,
  },
  bgIcon: {
    position: "absolute",
    right: -24,
    top: -24,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  breakdownSection: {
    gap: 16,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  monthText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  breakdownItems: {
    padding: theme.spacing.md,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerHighest,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    fontWeight: "500",
  },
  itemVal: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(198, 198, 205, 0.2)",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.3)",
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  totalVal: {
    ...theme.typography.headlineMd,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  penaltyCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(186, 26, 26, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)",
    borderRadius: 8,
    padding: theme.spacing.md,
  },
  penaltyText: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onErrorContainer,
    lineHeight: 18,
  },
  historySection: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    padding: theme.spacing.md,
    gap: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2e7d32",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  historyVal: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  receiptDate: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
    marginTop: 2,
  },
  trustSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.2)",
    paddingVertical: 24,
    marginTop: 8,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.6,
  },
  trustBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.outline,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
