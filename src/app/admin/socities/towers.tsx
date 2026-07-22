import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

interface Tower {
  id: string;
  name: string;
  tower_id: string;
  flatCount: number;
}

export default function TowerManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTowerName, setNewTowerName] = useState("");
  const [newTowerId, setNewTowerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTowers = async () => {
    if (!profile?.societyId) return;
    setLoading(true);
    try {
      // 1. Fetch towers
      const { data: towersData, error: towersError } = await supabase
        .from("towers")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("name", { ascending: true });

      if (towersError) throw towersError;

      if (!towersData || towersData.length === 0) {
        setTowers([]);
        return;
      }

      // 2. Fetch flat counts by getting all flats for these towers
      const towerIds = towersData.map((t) => t.id);
      const { data: flatsData, error: flatsError } = await supabase
        .from("flats")
        .select("tower_id")
        .in("tower_id", towerIds);

      if (flatsError) throw flatsError;

      // 3. Count in memory
      const countsMap: { [key: string]: number } = {};
      flatsData?.forEach((f) => {
        countsMap[f.tower_id] = (countsMap[f.tower_id] || 0) + 1;
      });

      const formattedTowers = towersData.map((t) => ({
        id: t.id,
        name: t.name || `Tower ${t.tower_id}`,
        tower_id: t.tower_id,
        flatCount: countsMap[t.id] || 0,
      }));

      setTowers(formattedTowers);
    } catch (err: any) {
      console.error("Failed to load towers:", err.message);
      Alert.alert("Error", "Could not fetch towers configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTowers();
  }, [profile?.societyId]);

  const handleAddTower = async () => {
    if (!newTowerName.trim() || !newTowerId.trim()) {
      Alert.alert("Missing Fields", "Please enter tower name and code.");
      return;
    }

    if (!profile?.societyId || profile.societyId.startsWith("mock-")) {
      Alert.alert(
        "Database Sync Required",
        "Your profile is running in mock/offline mode. To save settings and configure database tables online, please log out and set up a new society."
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("towers").insert({
        society_id: profile.societyId,
        name: newTowerName.trim(),
        tower_id: newTowerId.trim().toUpperCase(),
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("A tower with this code already exists in this society.");
        }
        throw error;
      }

      Alert.alert("Success", "Tower added successfully!");
      setNewTowerName("");
      setNewTowerId("");
      setIsModalVisible(false);
      fetchTowers();
    } catch (err: any) {
      Alert.alert("Failed to add tower", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTowerItem = ({ item }: { item: Tower }) => (
    <TouchableOpacity
      style={styles.towerCard}
      onPress={() =>
        router.push({
          pathname: "/admin/socities/flats",
          params: { towerId: item.id, towerName: item.name },
        } as any)
      }
      activeOpacity={0.7}
    >
      <View style={styles.towerCardLeft}>
        <View style={styles.towerIconContainer}>
          <MaterialIcons name="apartment" size={26} color={theme.colors.secondary} />
        </View>
        <View style={styles.towerDetails}>
          <Text style={styles.towerName}>{item.name}</Text>
          <Text style={styles.towerSubtext}>Code: {item.tower_id}</Text>
        </View>
      </View>
      <View style={styles.towerCardRight}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.flatCount} Flats</Text>
        </View><MaterialIcons name="chevron-right" size={24} color={theme.colors.outline} />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Towers & Blocks</Text>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && towers.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loaderText}>Fetching towers...</Text>
        </View>
      ) : (
        <FlatList
          data={towers}
          keyExtractor={(item) => item.id}
          renderItem={renderTowerItem}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchTowers}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="apartment" size={64} color={theme.colors.outline} />
              <Text style={styles.emptyTitle}>No Towers Registered</Text>
              <Text style={styles.emptySubtitle}>
                Add your society's blocks or towers to begin configuring flats.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Add First Tower</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Tower Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Tower</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.label}>Tower / Block Name</Text>
              <TextInput
                style={styles.input}
                value={newTowerName}
                onChangeText={setNewTowerName}
                placeholder="e.g. Tower A, Block C, Wing B"
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.label}>Tower Short Code (Unique)</Text>
              <TextInput
                style={styles.input}
                value={newTowerId}
                onChangeText={setNewTowerId}
                placeholder="e.g. A, C, W-B"
                placeholderTextColor={theme.colors.outline}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddTower}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>Add Tower</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerContent: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  listContent: {
    padding: theme.spacing.containerMarginMobile,
    paddingBottom: 40,
  },
  towerCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  towerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  towerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  towerDetails: {
    flex: 1,
  },
  towerName: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  towerSubtext: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  towerCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.rounded.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalForm: {
    gap: 16,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: 12,
    height: 48,
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
