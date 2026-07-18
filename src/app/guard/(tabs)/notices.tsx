import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function GuardNotices() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const fetchNotices = async () => {
    if (!profile?.societyId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setNotices(data);
      }
    } catch (err: any) {
      console.error("Error fetching notices:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      fetchNotices();
    }
  }, [profile?.societyId]);

  const parseDescription = (desc: string) => {
    const match = desc.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return {
        category: match[1],
        content: match[2],
      };
    }
    return {
      category: "General",
      content: desc,
    };
  };

  const filteredNotices = notices.filter((n) => {
    if (selectedFilter === "All") return true;
    const { category } = parseDescription(n.description);
    return category === selectedFilter;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Maintenance":
        return "construction";
      case "Security":
        return "security";
      case "Event":
        return "event";
      default:
        return "campaign";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Maintenance":
        return theme.colors.primary;
      case "Security":
        return theme.colors.error;
      case "Event":
        return theme.colors.secondary;
      default:
        return theme.colors.outline;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Society Notices</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchNotices} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {["All", "Security", "Maintenance", "Event", "General"].map((cat) => {
            const selected = selectedFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setSelectedFilter(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          </View>
        ) : (
          <View style={styles.noticesList}>
            {filteredNotices.length > 0 ? (
              filteredNotices.map((n) => {
                const parsed = parseDescription(n.description);
                const icon = getCategoryIcon(parsed.category);
                const color = getCategoryColor(parsed.category);
                return (
                  <View key={n.id} style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                      <View style={styles.noticeHeaderLeft}>
                        <View style={[styles.iconBox, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                          <MaterialIcons name={icon} size={20} color={color} />
                        </View>
                        <View>
                          <Text style={styles.noticeTitle}>{n.title}</Text>
                          <Text style={styles.noticeDate}>
                            {new Date(n.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.categoryBadge, { backgroundColor: `${color}15` }]}>
                        <Text style={[styles.categoryBadgeText, { color }]}>{parsed.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.noticeBody}>{parsed.content}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="campaign" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyText}>No active notices.</Text>
              </View>
            )}
          </View>
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
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  filtersScroll: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  filterChipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: theme.colors.secondary,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  noticesList: {
    gap: 16,
  },
  noticeCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: 12,
  },
  noticeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noticeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  noticeTitle: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
    fontSize: 15,
  },
  noticeDate: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  noticeBody: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
  },
});
