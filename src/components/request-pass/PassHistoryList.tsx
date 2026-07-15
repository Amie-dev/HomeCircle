import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { VisitorPass } from "../../hooks/useRequestPasses";
import { PassDetailModal } from "./PassDetailModal";

interface PassHistoryListProps {
  historyList: VisitorPass[];
}

export const PassHistoryList: React.FC<PassHistoryListProps> = ({ historyList }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);

  const getDesignationIcon = (designation: string) => {
    switch (designation) {
      case "Delivery":
        return "delivery-dining";
      case "Service":
        return "construction";
      case "Guest":
        return "person";
      case "Friend":
        return "people";
      case "Family":
        return "groups";
      default:
        return "person";
    }
  };

  const formatPassDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (date.toDateString() === today.toDateString()) {
        return `Today, ${timeString}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${timeString}`;
      } else {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`;
      }
    } catch (e) {
      return "Recently";
    }
  };

  // Filter history based on status chip selected
  const filteredHistory = historyList.filter((item) => {
    if (activeFilter === "All") return true;
    return item.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Visitor Management</Text>
      
      {/* Filter Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {["All", "Approved", "Pending", "Expired"].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {filteredHistory.length === 0 ? (
        <View style={styles.emptyHistory}>
          <MaterialIcons name="history" size={64} color={theme.colors.outlineVariant} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Recent Passes</Text>
          <Text style={styles.emptySubtitle}>
            Your visitor pass history will appear here once requests are made.
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {filteredHistory.map((item) => (
            <TouchableOpacity key={item.id} style={styles.passCard} onPress={() => setSelectedPass(item)}>
              <View style={styles.passCardLeft}>
                <View
                  style={[
                    styles.passIconWrapper,
                    item.status === "Approved" || item.status === "Verified"
                      ? styles.passIconWrapperApproved
                      : styles.passIconWrapperExpired,
                  ]}
                >
                  <MaterialIcons
                    name={getDesignationIcon(item.designation) as any}
                    size={22}
                    color={
                      item.status === "Approved" || item.status === "Verified"
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </View>
                <View style={styles.passCardInfo}>
                  <Text style={styles.passCardTitle}>{item.visitor_name}</Text>
                  <Text style={styles.passCardSubtitle}>
                    {item.designation} • Greenwood Heights T-{item.tower_no} F-{item.flat_no}
                  </Text>
                  {item.verified_at && (
                    <Text style={styles.passCardVerified}>
                      Verified at: {new Date(item.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                  <Text style={styles.passCardDate}>
                    Expires: {formatPassDate(item.expiry_time)}
                  </Text>
                </View>
              </View>
              <View style={styles.passCardRight}>
                <View
                  style={[
                    styles.statusLabel,
                    item.status === "Approved" || item.status === "Verified"
                      ? styles.statusApproved
                      : item.status === "Pending"
                        ? styles.statusPending
                        : item.status === "Rejected"
                          ? styles.statusRejected
                          : styles.statusExpired,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusLabelText,
                      item.status === "Approved" || item.status === "Verified"
                        ? styles.statusTextApproved
                        : item.status === "Pending"
                          ? styles.statusTextPending
                          : item.status === "Rejected"
                            ? styles.statusTextRejected
                            : styles.statusTextExpired,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.secondary} style={styles.passChevron} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pass Detail Modal */}
      <PassDetailModal
        visible={selectedPass !== null}
        pass={selectedPass}
        onClose={() => setSelectedPass(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  historyContainer: {
    paddingVertical: theme.spacing.lg,
  },
  historyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    marginBottom: theme.spacing.md,
  },
  filtersRow: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 9999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterChipText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  historyList: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    gap: theme.spacing.md,
  },
  passCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  passCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  passIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  passIconWrapperApproved: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  passIconWrapperExpired: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  passCardInfo: {
    flex: 1,
    gap: 2,
  },
  passCardTitle: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  passCardSubtitle: {
    ...theme.typography.bodyMd,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  passCardDate: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
  passCardVerified: {
    ...theme.typography.labelMd,
    color: "#2e7d32",
    marginTop: 2,
  },
  passCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusLabel: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: "#e8f5e9",
  },
  statusPending: {
    backgroundColor: "#fffde7",
  },
  statusExpired: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  statusRejected: {
    backgroundColor: "#ffebee",
  },
  statusLabelText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusTextApproved: {
    color: "#2e7d32",
  },
  statusTextPending: {
    color: "#f57f17",
  },
  statusTextExpired: {
    color: theme.colors.onSurfaceVariant,
  },
  statusTextRejected: {
    color: "#c62828",
  },
  passChevron: {
    marginLeft: 2,
  },
});
