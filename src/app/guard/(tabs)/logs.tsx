import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function GuardLogs() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    if (!profile?.societyId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("visitor_logs")
        .select(`
          id,
          created_at,
          action_type,
          requestpasses!inner (
            id,
            visitor_name,
            designation,
            phone_number,
            tower_no,
            flat_no,
            vehicle_no
          )
        `)
        .eq("requestpasses.resident_details->>societyId", profile.societyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setLogs(data);
      }
    } catch (err: any) {
      console.error("Error fetching logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      fetchLogs();
    }
  }, [profile?.societyId]);

  const filteredLogs = logs.filter((log) => {
    const p = log.requestpasses;
    const query = searchQuery.toLowerCase();
    return (
      p?.visitor_name?.toLowerCase().includes(query) ||
      p?.designation?.toLowerCase().includes(query) ||
      p?.tower_no?.toLowerCase().includes(query) ||
      p?.flat_no?.toLowerCase().includes(query) ||
      p?.phone_number?.toLowerCase().includes(query) ||
      (p?.vehicle_no && p.vehicle_no.toLowerCase().includes(query))
    );
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visitor Logs</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs} activeOpacity={0.7}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.outline} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search visitor, unit, phone, designation..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.outline}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          </View>
        ) : (
          <View style={styles.logsList}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const p = log.requestpasses;
                const isCheckin = log.action_type === "Check-in";
                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logLeft}>
                      <View style={[styles.logIconBox, { backgroundColor: isCheckin ? "rgba(0, 106, 97, 0.08)" : "rgba(186, 26, 26, 0.08)" }]}>
                        <MaterialIcons
                          name={isCheckin ? "login" : "logout"}
                          size={22}
                          color={isCheckin ? theme.colors.secondary : theme.colors.error}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logName}>{p?.visitor_name || "Guest"}</Text>
                        <Text style={styles.logDetails}>
                          {p?.designation} • Unit {p?.tower_no}-{p?.flat_no}
                        </Text>
                        {p?.vehicle_no && (
                          <Text style={styles.logVehicle}>Vehicle: {p.vehicle_no}</Text>
                        )}
                        <Text style={styles.logContact}>Phone: {p?.phone_number}</Text>
                      </View>
                    </View>
                    <View style={styles.logRight}>
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                      <Text style={styles.logTime}>
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(log.created_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyText}>No matching logs found.</Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.containerMarginMobile,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  logsList: {
    gap: 12,
    marginTop: theme.spacing.md,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
  },
  logLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  logIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  logName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  logDetails: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  logVehicle: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  logContact: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    marginTop: 2,
  },
  logRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  verifiedBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  logTime: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
    textAlign: "right",
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
