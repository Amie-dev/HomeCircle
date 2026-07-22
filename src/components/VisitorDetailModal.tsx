import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

export interface VisitorLog {
  id: string;
  name: string;
  type: "Guest" | "Delivery" | "Cab" | "Daily Help";
  status: "Entered" | "Exited";
  icon?: string;
  avatar?: string | null;
  vehicleNumber?: string;
  entryTime?: string;
  time: string;
  date: string;
  residentName?: string;
  residentFlat?: string;
  unit?: string;
  approvedByResident?: string;
  guardName?: string;
  guardGate?: string;
}

interface VisitorDetailModalProps {
  visible: boolean;
  selectedLog: VisitorLog | null;
  onClose: () => void;
  onToggleStatus: (log: any) => void;
  showActionBtn?: boolean;
}

export default function VisitorDetailModal({
  visible,
  selectedLog,
  onClose,
  onToggleStatus,
  showActionBtn = true,
}: VisitorDetailModalProps) {
  const insets = useSafeAreaInsets();
  if (!selectedLog) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Visitor Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

            <ScrollView contentContainerStyle={styles.detailModalBody} showsVerticalScrollIndicator={false}>
              {/* Guest Profile Section with Society Background */}
              <ImageBackground
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDRxlvqhh6kUzegIEZ4Rqg5Rr-aEY7Sli6EslMQZHaceiGmGGIIqODqnfjr5PyytQKkUwf1QI_lbVpIxhX1r_MgJ8Mthu9CaQ4YanEQs-YNYmSZrqmp028mB0pBcWiqAJV5CQFVdeTKMFnBbdP_eYh9vWsIOuU7v1M_KogjB5kI5E5E7KlrMJzqjjJ160B8M9Zya9uLZ4vAz2tbpeyTQLTBECRvNhgwwSCYi3gWDrrvwaOC0U7F0ZqwA",
                }}
                style={styles.detailProfileSectionBg}
                imageStyle={{ borderRadius: 12 }}
              >
                <View style={styles.detailProfileSection}>
                  {selectedLog.avatar ? (
                    <Image source={{ uri: selectedLog.avatar }} style={styles.detailAvatar} />
                  ) : (
                    <View style={styles.logIconWrapper}>
                      <MaterialIcons
                        name={(selectedLog.icon || "person") as any}
                        size={40}
                        color={theme.colors.outline}
                      />
                    </View>
                  )}
                  <Text style={styles.detailGuestName}>{selectedLog.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.detailTypeBadge}>
                      <Text style={styles.detailTypeBadgeText}>{selectedLog.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        selectedLog.status === "Entered"
                          ? styles.statusBadgeEntered
                          : styles.statusBadgeExited,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          selectedLog.status === "Entered"
                            ? styles.statusBadgeTextEntered
                            : styles.statusBadgeTextExited,
                        ]}
                      >
                        {selectedLog.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>

              {/* Info Cards */}
              <View style={styles.detailSectionCards}>
                {/* Guest Info Card */}
                <View style={styles.detailCard}>
                  <View style={styles.detailCardHeader}>
                    <MaterialIcons name="badge" size={18} color={theme.colors.secondary} />
                    <Text style={styles.detailCardTitle}>Guest Information</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Vehicle No:</Text>
                    <Text style={styles.detailRowValue}>{selectedLog.vehicleNumber || "N/A"}</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Check-In Time:</Text>
                    <Text style={styles.detailRowValue}>
                      {selectedLog.entryTime || selectedLog.time} ({selectedLog.date})
                    </Text>
                  </View>
                  {selectedLog.status === "Exited" && (
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Check-Out Time:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.time} ({selectedLog.date})</Text>
                    </View>
                  )}
                </View>

                {/* Host (Resident) Details Card */}
                <View style={styles.detailCard}>
                  <View style={styles.detailCardHeader}>
                    <MaterialIcons name="home" size={18} color={theme.colors.secondary} />
                    <Text style={styles.detailCardTitle}>Host (Resident) Details</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Resident Name:</Text>
                    <Text style={styles.detailRowValue}>{selectedLog.residentName || "N/A"}</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Flat No:</Text>
                    <Text style={styles.detailRowValue}>{selectedLog.residentFlat || selectedLog.unit}</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Approved By:</Text>
                    <Text style={[styles.detailRowValue, { color: theme.colors.secondary, fontWeight: "600" }]}>
                      {selectedLog.approvedByResident || "Resident Pre-Approved"}
                    </Text>
                  </View>
                </View>

                {/* Guard Info Card */}
                <View style={styles.detailCard}>
                  <View style={styles.detailCardHeader}>
                    <MaterialIcons name="security" size={18} color={theme.colors.secondary} />
                    <Text style={styles.detailCardTitle}>Security Guard Log</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Verified By Guard:</Text>
                    <Text style={styles.detailRowValue}>{selectedLog.guardName || "N/A"}</Text>
                  </View>
                  <View style={styles.detailCardRow}>
                    <Text style={styles.detailRowLabel}>Checked Gate:</Text>
                    <Text style={styles.detailRowValue}>{selectedLog.guardGate || "Main Security Gate"}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => onToggleStatus(selectedLog)}
              >
                <Text style={styles.submitBtnText}>
                  {selectedLog.status === "Entered" ? "Check Out Visitor" : "Check In Visitor"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.rounded.lg,
    borderTopRightRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  detailModalBody: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  detailProfileSectionBg: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  detailProfileSection: {
    backgroundColor: "rgba(13, 27, 47, 0.8)", // Translucent dark screen overlay
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailGuestName: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  detailTypeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.rounded.full,
  },
  detailTypeBadgeText: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.rounded.default,
  },
  statusBadgeEntered: {
    backgroundColor: "rgba(79, 191, 161, 0.25)", // Translucent green
  },
  statusBadgeExited: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadgeTextEntered: {
    color: "#4fBFA1",
  },
  statusBadgeTextExited: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  detailSectionCards: {
    gap: theme.spacing.md,
  },
  detailCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  detailCardTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  detailCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailRowLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  detailRowValue: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    paddingLeft: theme.spacing.sm,
  },
  modalFooter: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.default,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cancelBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.default,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
});
