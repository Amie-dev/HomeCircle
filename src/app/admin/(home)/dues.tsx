import React, { useState, useEffect } from "react";
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

import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { ActivityIndicator } from "react-native";

export default function MaintenanceDues() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  
  const [activeSegment, setActiveSegment] = useState<"Pending" | "Paid">("Pending");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    if (!profile?.societyId) return;
    try {
      const { data, error } = await supabase
        .from("maintenance_invoices")
        .select(`
          *,
          flats (
            flat_number,
            towers ( name )
          )
        `)
        .eq("society_id", profile.societyId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      if (data) {
        setInvoices(data);
        // Set first matching invoice as selected if none is selected yet
        const pending = data.filter((i: any) => i.status === "Pending" || i.status === "Overdue");
        const paid = data.filter((i: any) => i.status === "Paid");
        const targetList = activeSegment === "Pending" ? pending : paid;
        if (targetList.length > 0) {
          setSelectedInvoice(targetList[0]);
        } else {
          setSelectedInvoice(null);
        }
      }
    } catch (err: any) {
      console.error("Error fetching invoices:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      fetchInvoices().finally(() => setLoading(false));
    }
  }, [profile?.societyId, activeSegment]);

  const totalPendingAmount = invoices
    .filter((i: any) => i.status === "Pending" || i.status === "Overdue")
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  const pendingBills = invoices.filter((i: any) => i.status === "Pending" || i.status === "Overdue");
  const paidBills = invoices.filter((i: any) => i.status === "Paid");

  const displayedBills = activeSegment === "Pending" ? pendingBills : paidBills;

  const handleRecordPayment = () => {
    if (!selectedInvoice) {
      Alert.alert("Select Invoice", "Please select a flat invoice from the list below.");
      return;
    }
    if (selectedInvoice.status === "Paid") {
      Alert.alert("Already Paid", "This invoice has already been fully paid.");
      return;
    }

    Alert.alert(
      "Record Payment",
      `Record payment of ₹${Number(selectedInvoice.amount).toLocaleString("en-IN")} for Flat ${selectedInvoice.flats?.flat_number} (Tower ${selectedInvoice.flats?.towers?.name})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Record Cash",
          onPress: () => processPayment("Cash"),
        },
        {
          text: "Record UPI",
          onPress: () => processPayment("UPI"),
        },
      ]
    );
  };

  const processPayment = async (method: string) => {
    if (!selectedInvoice || !profile) return;
    setLoading(true);
    try {
      // 1. Insert payment transaction log
      const { error: payErr } = await supabase
        .from("maintenance_payments")
        .insert({
          invoice_id: selectedInvoice.id,
          amount_paid: selectedInvoice.amount,
          paid_by: profile.id,
          payment_method: method,
          payment_reference: `Admin Manual (${method})`,
        });

      if (payErr) throw payErr;

      // 2. Update invoice status
      const { error: invErr } = await supabase
        .from("maintenance_invoices")
        .update({ status: "Paid" })
        .eq("id", selectedInvoice.id);

      if (invErr) throw invErr;

      Alert.alert("Success", "Payment recorded successfully!");
      await fetchInvoices();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
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
        {/* Hero Outstanding Dues Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Outstanding Dues</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountValue}>
              {totalPendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.dueDateRow}>
            <MaterialIcons name="business" size={14} color={theme.colors.secondaryContainer} />
            <Text style={styles.dueDateText}>
              {selectedInvoice
                ? `Selected: Flat ${selectedInvoice.flats?.flat_number} (${selectedInvoice.billing_period})`
                : "Select a flat below to record payment"}
            </Text>
          </View>
          {selectedInvoice && selectedInvoice.status !== "Paid" && (
            <TouchableOpacity style={styles.payButton} activeOpacity={0.8} onPress={handleRecordPayment}>
              <Text style={styles.payButtonText}>Collect / Record Payment</Text>
              <MaterialIcons name="arrow-forward" size={16} color={theme.colors.onSecondaryContainer} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Invoice Bill Breakdown Card */}
        {selectedInvoice ? (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>
                Bill Breakdown (Flat {selectedInvoice.flats?.flat_number})
              </Text>
              <Text style={styles.breakdownPeriod}>{selectedInvoice.billing_period}</Text>
            </View>
            <View style={styles.breakdownList}>
              {/* Item 1: Base Maintenance (70%) */}
              <View style={styles.breakdownItem}>
                <View>
                  <Text style={styles.breakdownItemLabel}>Monthly Maintenance</Text>
                  <Text style={styles.breakdownItemSub}>Standard utility & upkeep fees (70%)</Text>
                </View>
                <Text style={styles.breakdownItemValue}>
                  ₹{(Number(selectedInvoice.amount) * 0.7).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </Text>
              </View>
              {/* Item 2: Sinking Fund (15%) */}
              <View style={styles.breakdownItem}>
                <View>
                  <Text style={styles.breakdownItemLabel}>Sinking Fund</Text>
                  <Text style={styles.breakdownItemSub}>Emergency capital reserve (15%)</Text>
                </View>
                <Text style={styles.breakdownItemValue}>
                  ₹{(Number(selectedInvoice.amount) * 0.15).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </Text>
              </View>
              {/* Item 3: Water/Consumables (15%) */}
              <View style={[styles.breakdownItem, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.breakdownItemLabel}>Water & Common Charges</Text>
                  <Text style={styles.breakdownItemSub}>Meter charges (15%)</Text>
                </View>
                <Text style={styles.breakdownItemValue}>
                  ₹{(Number(selectedInvoice.amount) * 0.15).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Late payment alert */}
            <View style={styles.lateAlertRow}>
              <MaterialIcons name="info" size={16} color={theme.colors.error} />
              <Text style={styles.lateAlertText}>
                <Text style={{ fontWeight: "700" }}>Due Date:</Text>{" "}
                {new Date(selectedInvoice.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.breakdownCard, { padding: 24, alignItems: "center" }]}>
            <MaterialIcons name="receipt" size={36} color={theme.colors.outline} />
            <Text style={{ color: theme.colors.outline, marginTop: 8, ...theme.typography.bodyMd }}>
              No invoice selected. Pick an invoice from the list below.
            </Text>
          </View>
        )}

        {/* Segmented Tab Toggles */}
        <View style={styles.tabSection}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabButton, activeSegment === "Pending" && styles.tabButtonActive]}
              onPress={() => setActiveSegment("Pending")}
            >
              <Text style={[styles.tabText, activeSegment === "Pending" && styles.tabTextActive]}>
                Pending Invoices ({pendingBills.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeSegment === "Paid" && styles.tabButtonActive]}
              onPress={() => setActiveSegment("Paid")}
            >
              <Text style={[styles.tabText, activeSegment === "Paid" && styles.tabTextActive]}>
                Paid History ({paidBills.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* List content depending on tab segment */}
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.colors.secondary} />
            </View>
          ) : (
            <View style={styles.billsList}>
              {displayedBills.length > 0 ? (
                displayedBills.map((bill) => {
                  const isUnpaid = bill.status !== "Paid";
                  const isSelected = selectedInvoice?.id === bill.id;
                  return (
                    <TouchableOpacity
                      key={bill.id}
                      style={[
                        styles.billCard,
                        isSelected && { borderColor: theme.colors.secondary, borderWidth: 1.5 },
                      ]}
                      onPress={() => setSelectedInvoice(bill)}
                      activeOpacity={0.8}
                    >
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
                          <Text style={styles.billTitle}>
                            Flat {bill.flats?.flat_number} (Tower {bill.flats?.towers?.name})
                          </Text>
                          <Text style={styles.billDate}>
                            {bill.billing_period} • Due{" "}
                            {new Date(bill.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.billRight}>
                        <Text style={styles.billAmount}>
                          ₹{Number(bill.amount).toLocaleString("en-IN")}
                        </Text>
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
                            {bill.status}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ color: theme.colors.outline, ...theme.typography.bodyMd }}>
                    No bills in this category.
                  </Text>
                </View>
              )}
            </View>
          )}
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
            HomeCircle database keeps track of all collected maintenance dues and links payments to logged-in administrator accounts for audit reporting.
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
