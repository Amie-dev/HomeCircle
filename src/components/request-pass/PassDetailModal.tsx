import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { VisitorPass } from "../../hooks/useRequestPasses";

interface PassDetailModalProps {
  visible: boolean;
  pass: VisitorPass | null;
  onClose: () => void;
}

export const PassDetailModal: React.FC<PassDetailModalProps> = ({
  visible,
  pass,
  onClose,
}) => {
  if (!pass) return null;

  const formatPassDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
      case "Verified":
        return { bg: "#e8f5e9", text: "#2e7d32" };
      case "Pending":
        return { bg: "#fffde7", text: "#f57f17" };
      case "Rejected":
        return { bg: "#ffebee", text: "#c62828" };
      default:
        return { bg: theme.colors.surfaceContainerHigh, text: theme.colors.onSurfaceVariant };
    }
  };

  const statusColors = getStatusStyle(pass.status);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${pass.id}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>VISITOR ENTRY PASS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Ticket Main Card */}
            <View style={styles.ticketCard}>
              {/* QR Code Container */}
              <View style={styles.qrContainer}>
                <Image
                  source={qrUrl}
                  style={styles.qrImage}
                  contentFit="contain"
                  transition={500}
                />
                <Text style={styles.qrLabel}>SCAN AT GATE</Text>
                <Text style={styles.passIdText}>ID: {pass.id.substring(0, 13).toUpperCase()}...</Text>
              </View>

              {/* Decorative Tear Line */}
              <View style={styles.tearLineContainer}>
                <View style={styles.tearCircleLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.tearCircleRight} />
              </View>

              {/* Visitor Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.visitorMainInfo}>
                  <Text style={styles.visitorName}>{pass.visitor_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {pass.status}
                    </Text>
                  </View>
                </View>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="info-outline" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Designation:</Text>
                    <Text style={styles.infoValue}>{pass.designation}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="apartment" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Destination:</Text>
                    <Text style={styles.infoValue}>T-{pass.tower_no}, F-{pass.flat_no}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="phone" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Contact:</Text>
                    <Text style={styles.infoValue}>{pass.visitor_phone}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="mail-outline" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{pass.visitor_email}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="access-time" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Validity:</Text>
                    <Text style={styles.infoValue}>{pass.expiry_hours} Hours</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="hourglass-empty" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Expires:</Text>
                    <Text style={styles.infoValue}>{formatPassDate(pass.expiry_time)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="qr-code-scanner" size={16} color={theme.colors.outline} />
                    <Text style={styles.infoLabel}>Post-Scan Expiry:</Text>
                    <Text style={styles.infoValue}>{pass.after_scan_qr_expiry}</Text>
                  </View>

                  {pass.verified_at && (
                    <View style={[styles.infoRow, styles.verifiedRow]}>
                      <MaterialIcons name="verified-user" size={16} color="#2e7d32" />
                      <Text style={[styles.infoLabel, { color: "#2e7d32" }]}>Verified At:</Text>
                      <Text style={[styles.infoValue, { color: "#2e7d32", fontWeight: "700" }]}>
                        {formatPassDate(pass.verified_at)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Resident Details */}
                <View style={styles.divider} />
                <Text style={styles.residentHeader}>RESIDENT DETAILS (ISSUER)</Text>
                
                <View style={styles.residentInfo}>
                  <View style={styles.residentDetailItem}>
                    <Text style={styles.residentLabel}>Name</Text>
                    <Text style={styles.residentValue}>{pass.resident_details?.fullName || "N/A"}</Text>
                  </View>
                  <View style={styles.residentDetailItem}>
                    <Text style={styles.residentLabel}>Phone</Text>
                    <Text style={styles.residentValue}>{pass.resident_details?.phone || "N/A"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: theme.spacing.md,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    maxHeight: "85%",
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
  ticketTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 1,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingVertical: theme.spacing.md,
  },
  ticketCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: "hidden",
  },
  qrContainer: {
    alignItems: "center",
    padding: theme.spacing.lg,
    backgroundColor: "#ffffff",
  },
  qrImage: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing.sm,
  },
  qrLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  passIdText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
  },
  tearLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  tearCircleLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    marginLeft: -8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  tearCircleRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    marginRight: -8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  dashedLine: {
    flex: 1,
    borderStyle: "dashed",
    borderWidth: 0.5,
    borderColor: theme.colors.outlineVariant,
    marginHorizontal: 8,
    height: 1,
  },
  detailsContainer: {
    padding: theme.spacing.md,
  },
  visitorMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  visitorName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "700",
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoGrid: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedRow: {
    backgroundColor: "#e8f5e9",
    padding: 6,
    borderRadius: 6,
  },
  infoLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    width: 110,
  },
  infoValue: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: theme.spacing.md,
  },
  residentHeader: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  residentInfo: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  residentDetailItem: {
    flex: 1,
  },
  residentLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    marginBottom: 2,
  },
  residentValue: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  doneButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontSize: 15,
  },
});
