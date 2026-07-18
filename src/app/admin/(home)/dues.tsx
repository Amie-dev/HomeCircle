import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MemberPayment {
  id: string;
  name: string;
  relation: string;
  status: "Paid" | "Pending" | "Unpaid";
  initials: string;
}

interface BillItem {
  id: string;
  title: string;
  dateInfo: string;
  amount: string;
  status: "Unpaid" | "Success";
}

export default function MaintenanceDues() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<"Pending" | "History">("Pending");

  const householdPayments: MemberPayment[] = [
    {
      id: "mem-1",
      name: "Ananya Sharma",
      relation: "Primary Member",
      status: "Paid",
      initials: "AS",
    },
    {
      id: "mem-2",
      name: "Arjun Mehta",
      relation: "Family Member",
      status: "Pending",
      initials: "AM",
    },
    {
      id: "mem-3",
      name: "Ishani Mehta",
      relation: "Family Member",
      status: "Unpaid",
      initials: "IM",
    },
  ];

  const pendingBills: BillItem[] = [
    {
      id: "b-1",
      title: "October Maintenance",
      dateInfo: "Bill Generated: Oct 01",
      amount: "₹4,500.00",
      status: "Unpaid",
    },
  ];

  const paymentHistory: BillItem[] = [
    {
      id: "b-2",
      title: "September Maintenance",
      dateInfo: "Paid on Sep 28, 2023",
      amount: "₹4,500.00",
      status: "Success",
    },
    {
      id: "b-3",
      title: "August Maintenance",
      dateInfo: "Paid on Aug 25, 2023",
      amount: "₹4,200.00",
      status: "Success",
    },
    {
      id: "b-4",
      title: "July Maintenance",
      dateInfo: "Paid on Jul 30, 2023",
      amount: "₹4,200.00",
      status: "Success",
    },
  ];

  const getMemberStatusStyle = (status: "Paid" | "Pending" | "Unpaid") => {
    switch (status) {
      case "Paid":
        return { bg: "rgba(0, 106, 97, 0.1)", text: theme.colors.secondary };
      case "Pending":
        return { bg: "rgba(0, 111, 102, 0.05)", text: theme.colors.onSecondaryContainer };
      case "Unpaid":
      default:
        return { bg: "rgba(186, 26, 26, 0.1)", text: theme.colors.error };
    }
  };

  const handlePay = () => {
    Alert.alert("Collect Payment", "Opening integrated gateway for dues collection...");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Maintenance Dues</Text>
        </View>
        <MaterialIcons name="security" size={24} color={theme.colors.primary} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Pending Dues Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Amount Pending</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountValue}>4,500.00</Text>
          </View>
          <View style={styles.dueDateRow}>
            <MaterialIcons name="calendar-today" size={14} color={theme.colors.secondaryContainer} />
            <Text style={styles.dueDateText}>Due on Oct 31, 2023</Text>
          </View>
          <TouchableOpacity style={styles.payButton} activeOpacity={0.8} onPress={handlePay}>
            <Text style={styles.payButtonText}>Collect / Record Payment</Text>
            <MaterialIcons name="arrow-forward" size={16} color={theme.colors.onSecondaryContainer} />
          </TouchableOpacity>
        </View>

        {/* Bill Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>Bill Breakdown</Text>
            <Text style={styles.breakdownPeriod}>October 2023</Text>
          </View>
          <View style={styles.breakdownList}>
            {/* Item 1 */}
            <View style={styles.breakdownItem}>
              <View>
                <Text style={styles.breakdownItemLabel}>Monthly Maintenance</Text>
                <Text style={styles.breakdownItemSub}>Standard utility & upkeep fees</Text>
              </View>
              <Text style={styles.breakdownItemValue}>₹3,200.00</Text>
            </View>
            {/* Item 2 */}
            <View style={styles.breakdownItem}>
              <View>
                <Text style={styles.breakdownItemLabel}>Sinking Fund</Text>
                <Text style={styles.breakdownItemSub}>Emergency and future capital works</Text>
              </View>
              <Text style={styles.breakdownItemValue}>₹800.00</Text>
            </View>
            {/* Item 3 */}
            <View style={[styles.breakdownItem, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.breakdownItemLabel}>Water Charges</Text>
                <Text style={styles.breakdownItemSub}>Based on unit consumption meter</Text>
              </View>
              <Text style={styles.breakdownItemValue}>₹500.00</Text>
            </View>
          </View>

          {/* Late payment alert */}
          <View style={styles.lateAlertRow}>
            <MaterialIcons name="info" size={16} color={theme.colors.error} />
            <Text style={styles.lateAlertText}>
              <Text style={{ fontWeight: "700" }}>Note:</Text> Late payments after the due date will incur a 2% interest charge per month as per society bylaws.
            </Text>
          </View>
        </View>

        {/* Household Payment Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusSectionTitle}>Household Payment Status</Text>
          <View style={styles.statusList}>
            {householdPayments.map((member, index) => {
              const statusStyle = getMemberStatusStyle(member.status);
              const isLast = index === householdPayments.length - 1;
              return (
                <View
                  key={member.id}
                  style={[styles.memberRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.memberLeft}>
                    <View style={[styles.memberAvatar, { backgroundColor: member.status === "Paid" ? "rgba(0, 106, 97, 0.1)" : member.status === "Pending" ? "rgba(0, 111, 102, 0.05)" : "rgba(186, 26, 26, 0.08)" }]}>
                      <Text style={[styles.memberAvatarText, { color: statusStyle.text }]}>
                        {member.initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRelation}>{member.relation}</Text>
                    </View>
                  </View>
                  <View style={[styles.memberBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.memberBadgeText, { color: statusStyle.text }]}>
                      {member.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Segmented Tab Toggles */}
        <View style={styles.tabSection}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabButton, activeSegment === "Pending" && styles.tabButtonActive]}
              onPress={() => setActiveSegment("Pending")}
            >
              <Text style={[styles.tabText, activeSegment === "Pending" && styles.tabTextActive]}>
                Pending Bills
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeSegment === "History" && styles.tabButtonActive]}
              onPress={() => setActiveSegment("History")}
            >
              <Text style={[styles.tabText, activeSegment === "History" && styles.tabTextActive]}>
                Payment History
              </Text>
            </TouchableOpacity>
          </View>

          {/* List content depending on tab segment */}
          <View style={styles.billsList}>
            {(activeSegment === "Pending" ? pendingBills : paymentHistory).map((bill) => {
              const isUnpaid = bill.status === "Unpaid";
              return (
                <View key={bill.id} style={styles.billCard}>
                  <View style={styles.billLeft}>
                    <View
                      style={[
                        styles.billIconBox,
                        {
                          backgroundColor: isUnpaid
                            ? "rgba(186, 26, 26, 0.08)"
                            : "rgba(0, 106, 97, 0.08)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={isUnpaid ? "receipt-long" : "check-circle"}
                        size={20}
                        color={isUnpaid ? theme.colors.error : theme.colors.secondary}
                      />
                    </View>
                    <View>
                      <Text style={styles.billTitle}>{bill.title}</Text>
                      <Text style={styles.billDate}>{bill.dateInfo}</Text>
                    </View>
                  </View>
                  <View style={styles.billRight}>
                    <Text style={styles.billAmount}>{bill.amount}</Text>
                    <View
                      style={[
                        styles.billBadge,
                        {
                          backgroundColor: isUnpaid
                            ? "rgba(186, 26, 26, 0.1)"
                            : "rgba(0, 106, 97, 0.1)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.billBadgeText,
                          { color: isUnpaid ? theme.colors.error : theme.colors.secondary },
                        ]}
                      >
                        {isUnpaid ? "Unpaid" : "Success"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Security / Encryption Footer */}
        <View style={styles.footer}>
          <View style={styles.complianceRow}>
            <View style={styles.complianceItem}>
              <MaterialIcons name="verified-user" size={14} color={theme.colors.outline} />
              <Text style={styles.complianceText}>PCI DSS COMPLIANT</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.complianceItem}>
              <MaterialIcons name="lock" size={14} color={theme.colors.outline} />
              <Text style={styles.complianceText}>SSL ENCRYPTED</Text>
            </View>
          </View>
          <Text style={styles.footerNote}>
            HomeCircle uses industry-leading encryption to protect your financial transactions. We do not store full card numbers.
          </Text>
        </View>
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
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  heroCard: {
    backgroundColor: "#131b2e",
    borderRadius: theme.rounded.lg,
    padding: 24,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.9,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
    marginBottom: 16,
  },
  currencySymbol: {
    ...theme.typography.headlineLg,
    color: theme.colors.onPrimary,
    fontWeight: "600",
  },
  amountValue: {
    ...theme.typography.headlineXl,
    color: theme.colors.onPrimary,
    fontWeight: "800",
    marginLeft: 4,
  },
  dueDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dueDateText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  payButton: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: theme.rounded.default,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  payButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSecondaryContainer,
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
    marginTop: theme.spacing.lg,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  breakdownTitle: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.primary,
  },
  breakdownPeriod: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownList: {
    paddingHorizontal: theme.spacing.md,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.1)",
  },
  breakdownItemLabel: {
    ...theme.typography.bodyLg,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  breakdownItemSub: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  breakdownItemValue: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.primary,
  },
  lateAlertRow: {
    flexDirection: "row",
    backgroundColor: "rgba(186, 26, 26, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)",
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.rounded.default,
    gap: 8,
  },
  lateAlertText: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
    flex: 1,
    lineHeight: 16,
    fontSize: 11,
  },
  statusSection: {
    marginTop: theme.spacing.lg,
  },
  statusSectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
    paddingLeft: 4,
  },
  statusList: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    ...theme.typography.button,
    fontSize: 12,
    fontWeight: "700",
  },
  memberName: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  memberRelation: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.rounded.full,
  },
  memberBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tabSection: {
    marginTop: theme.spacing.lg,
  },
  tabHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.secondary,
  },
  tabText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: theme.colors.secondary,
  },
  billsList: {
    gap: 12,
    marginTop: theme.spacing.md,
  },
  billCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  billLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  billIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  billTitle: {
    ...theme.typography.bodyLg,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  billDate: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  billRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  billAmount: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  billBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  billBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.2)",
    alignItems: "center",
  },
  complianceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.7,
  },
  complianceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  complianceText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.outline,
    fontWeight: "700",
  },
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.outlineVariant,
  },
  footerNote: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 24,
  },
});
