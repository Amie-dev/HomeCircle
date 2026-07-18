import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MaintenanceDuesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [totalDues, setTotalDues] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      // 1. Get flat_id for the resident
      const { data: memberData } = await supabase
        .from("societymembers")
        .select("flat_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (memberData?.flat_id) {
        // Query pending invoices
        const { data: pInvoices } = await supabase
          .from("maintenance_invoices")
          .select("*")
          .eq("flat_id", memberData.flat_id)
          .eq("status", "Pending")
          .order("due_date", { ascending: true });

        if (pInvoices) {
          setPendingInvoices(pInvoices);
          const sum = pInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
          setTotalDues(sum);
        }

        // Query paid invoices / payments history
        const { data: paidPayments } = await supabase
          .from("maintenance_payments")
          .select(`
            id,
            amount_paid,
            payment_method,
            payment_reference,
            paid_at,
            maintenance_invoices!inner (
              billing_period
            )
          `)
          .eq("paid_by", profile.id)
          .order("paid_at", { ascending: false });

        if (paidPayments) {
          setPaymentsHistory(paidPayments);
        }
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchInvoices();
    }
  }, [profile?.id]);

  const handlePayNow = async () => {
    if (!profile?.id) return;
    if (totalDues === 0) {
      Alert.alert("No Dues", "You do not have any pending maintenance dues.");
      return;
    }

    Alert.alert(
      "Payment Gateway",
      `Proceed to secure payment of ₹${totalDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}?`,
      [
        {
          text: "Pay",
          onPress: async () => {
            try {
              setLoading(true);
              const reference = "TXN-" + Math.floor(100000 + Math.random() * 900000);
              
              for (const invoice of pendingInvoices) {
                // Update invoice
                const { error: invoiceErr } = await supabase
                  .from("maintenance_invoices")
                  .update({ status: "Paid" })
                  .eq("id", invoice.id);

                if (invoiceErr) throw invoiceErr;

                // Insert payment log
                const { error: paymentErr } = await supabase
                  .from("maintenance_payments")
                  .insert({
                    invoice_id: invoice.id,
                    amount_paid: invoice.amount,
                    paid_by: profile.id,
                    payment_method: "UPI",
                    payment_reference: reference,
                  });

                if (paymentErr) throw paymentErr;
              }

              Alert.alert(
                "Payment Success",
                `Payment of ₹${totalDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })} received!\nReference: ${reference}`
              );
              fetchInvoices();
            } catch (err: any) {
              Alert.alert("Payment Error", err.message || "Failed to process payment.");
            } finally {
              setLoading(false);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  if (!profile) return null;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />

      {/* Top App Bar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top }]}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Maintenance Dues</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={fetchInvoices}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Current Balance Due</Text>
            <Text style={styles.balanceText}>
              ₹{totalDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </Text>

            <View style={styles.dueDateRow}>
              <MaterialIcons name="calendar-today" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.dueDateText}>
                {pendingInvoices.length > 0 ? `Next Due: ${pendingInvoices[0].due_date}` : "No pending dues"}
              </Text>
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

        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 40 }} />
        ) : activeTab === "pending" ? (
          <View style={styles.breakdownSection}>
            {/* Header */}
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Bill Breakdown</Text>
              <Text style={styles.monthText}>
                {pendingInvoices.length > 0 ? pendingInvoices[0].billing_period : "Clean Sheet"}
              </Text>
            </View>

            {/* Breakdown List Card */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownItems}>
                {pendingInvoices.length > 0 ? (
                  pendingInvoices.map((inv, idx) => (
                    <View key={inv.id}>
                      <View style={styles.breakdownRow}>
                        <View style={styles.rowLeft}>
                          <View style={styles.itemIconWrapper}>
                            <MaterialIcons name="home-work" size={20} color={theme.colors.primary} />
                          </View>
                          <Text style={styles.itemName}>Invoice for {inv.billing_period}</Text>
                        </View>
                        <Text style={styles.itemVal}>₹{Number(inv.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                      </View>
                      {idx < pendingInvoices.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyBreakdownText}>No unpaid invoices found.</Text>
                )}
              </View>

              {/* Total Row */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount Due</Text>
                <Text style={styles.totalVal}>
                  ₹{totalDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Late Penalty Notice Card */}
            <View style={styles.penaltyCard}>
              <MaterialIcons name="info" size={20} color={theme.colors.error} />
              <Text style={styles.penaltyText}>
                <Text style={{ fontWeight: "700" }}>Note:</Text> Late payments may attract penalties. Please clear all invoices before the due date to avoid service disruptions.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.historySection}>
            {paymentsHistory.length > 0 ? (
              paymentsHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {item.maintenance_invoices?.billing_period || "Monthly Bill"}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>PAID</Text>
                    </View>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Maintenance Bill ({item.payment_method})</Text>
                    <Text style={styles.historyVal}>₹{Number(item.amount_paid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                  </View>
                  <Text style={styles.receiptDate}>
                    Paid on {new Date(item.paid_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} • Txn: {item.payment_reference}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyHistoryBox}>
                <MaterialIcons name="receipt" size={36} color={theme.colors.outline} />
                <Text style={styles.emptyHistoryText}>No payments logged in the history ledger.</Text>
              </View>
            )}
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
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    backgroundColor: theme.colors.surface,
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
    paddingTop: theme.spacing.md,
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
    elevation: 2,
  },
  tabText: {
    ...theme.typography.button,
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
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  breakdownTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  monthText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontWeight: "500",
  },
  breakdownCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    overflow: "hidden",
  },
  breakdownItems: {
    padding: 16,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.3)",
  },
  totalLabel: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  totalVal: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "800",
  },
  penaltyCard: {
    flexDirection: "row",
    backgroundColor: "rgba(186, 26, 26, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.12)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  penaltyText: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.error,
    fontSize: 12,
    lineHeight: 18,
  },
  historySection: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  statusBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: "800",
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
    color: theme.colors.outline,
    fontSize: 10,
  },
  trustSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: theme.spacing.lg,
    paddingVertical: 8,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.outline,
    fontWeight: "700",
  },
  emptyBreakdownText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    textAlign: "center",
    padding: 20,
  },
  emptyHistoryBox: {
    alignItems: "center",
    padding: 40,
    gap: 8,
  },
  emptyHistoryText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    textAlign: "center",
  },
});
