import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type Relationship =
  | "Spouse"
  | "Child"
  | "Parent"
  | "Sibling"
  | "Other";

interface HouseholdMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  relationship: Relationship;
  created_at?: string;
  users?: {
    avatar_url: string | null;
  } | null;
}

const RELATIONSHIPS: Relationship[] = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other",
];

const relationshipIcon = (rel: Relationship): any => {
  switch (rel) {
    case "Spouse": return "favorite";
    case "Child": return "child-care";
    case "Parent": return "elderly";
    case "Sibling": return "people-alt";
    default: return "person";
  }
};

const avatarColor = (rel: Relationship): string => {
  const map: Record<Relationship, string> = {
    Spouse: "E040FB",
    Child: "00BCD4",
    Parent: "FF9800",
    Sibling: "4CAF50",
    Other: "607D8B",
  };
  return map[rel] || "006a61";
};

// ─── Member Card ─────────────────────────────────────────────────────────────
function MemberCard({
  member,
  isSelf,
  deleting,
  onDelete,
  canDelete,
}: {
  member: HouseholdMember;
  isSelf: boolean;
  deleting: boolean;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const rel = member.relationship as Relationship;
  const color = avatarColor(rel);

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberLeft}>
        {member.users?.avatar_url ? (
          <Image
            source={{ uri: member.users.avatar_url }}
            style={styles.memberAvatar}
          />
        ) : (
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                member.full_name
              )}&background=${color}&color=fff&size=80`,
            }}
            style={styles.memberAvatar}
          />
        )}
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.full_name}
            </Text>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>SELF</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberRelation}>{member.relationship}</Text>
          <Text style={styles.memberPhone}>{member.phone}</Text>
        </View>
      </View>
      <View style={styles.memberRight}>
        <View style={styles.verifiedRow}>
          <MaterialIcons name="verified" size={16} color={theme.colors.secondary} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
        {!isSelf && canDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <MaterialIcons name="delete-outline" size={22} color={theme.colors.error} />
            )}
          </TouchableOpacity>
        )}
        {isSelf && canDelete && (
          <TouchableOpacity style={styles.editBtn}>
            <MaterialIcons name="edit" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HouseholdMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [isFlatAdmin, setIsFlatAdmin] = useState(params.isFlatAdmin === "true");

  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Spouse");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = useCallback(
    async (silent = false) => {
      if (!profile?.id) return;
      if (!silent) setLoading(true);
      try {
        // Query flat admin ID of this resident's unit
        const { data: memberData } = await supabase
          .from("societymembers")
          .select(`
            flat_id,
            flats (
              flat_admin_id
            )
          `)
          .eq("user_id", profile.id)
          .maybeSingle();

        const flatAdminId = (memberData?.flats as any)?.flat_admin_id || profile.id;
        const isAdmin = flatAdminId === profile.id;
        setIsFlatAdmin(isAdmin);

        // Fetch all member user IDs residing in the same flat
        let flatUserIds = [profile.id];
        if (memberData?.flat_id) {
          const { data: flatMembers } = await supabase
            .from("societymembers")
            .select("user_id")
            .eq("flat_id", memberData.flat_id);

          if (flatMembers && flatMembers.length > 0) {
            flatUserIds = flatMembers.map((m) => m.user_id);
          }
        }

        const { data, error } = await supabase
          .from("household_members")
          .select(`
            *,
            users:user_id (
              avatar_url
            )
          `)
          .in("user_id", flatUserIds)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setMembers((data as HouseholdMember[]) || []);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load household members.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.id]
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers(true);
  };

  const openModal = () => {
    setFullName("");
    setPhone("");
    setRelationship("Spouse");
    setShowModal(true);
  };

  const handleAddMember = async () => {
    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter the member's full name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter a phone number.");
      return;
    }
    if (!profile?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("household_members").insert({
        user_id: profile.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        relationship,
      });
      if (error) throw error;
      setShowModal(false);
      await fetchMembers(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (member: HouseholdMember) => {
    Alert.alert(
      "Remove Member",
      `Remove ${member.full_name} from your household?`,
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(member.id);
            try {
              const { error } = await supabase
                .from("household_members")
                .delete()
                .eq("id", member.id);
              if (error) throw error;
              setMembers((prev) => prev.filter((m) => m.id !== member.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Could not remove member.");
            } finally {
              setDeletingId(null);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.outer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="dark" />

        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Household Members</Text>
          </View>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile?.fullName || "User"
              )}&background=006a61&color=fff&size=60`,
            }}
            style={styles.avatar}
          />
        </View>

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.secondary}
              colors={[theme.colors.secondary]}
            />
          }
        >
          {/* Info Banner */}
          {!isFlatAdmin ? (
            <View style={[styles.infoBanner, { backgroundColor: "rgba(186, 26, 26, 0.08)", borderColor: "rgba(186, 26, 26, 0.2)" }]}>
              <MaterialIcons name="security" size={20} color={theme.colors.error} />
              <Text style={[styles.infoText, { color: theme.colors.error }]}>
                Only the Flat Admin can add, edit, or remove household members. Your view is read-only.
              </Text>
            </View>
          ) : (
            <View style={styles.infoBanner}>
              <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
              <Text style={styles.infoText}>
                Added members can approve visitors, view society notices, and receive
                emergency alerts for your unit.
              </Text>
            </View>
          )}

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Members</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{members.length} Total</Text>
            </View>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.secondary} />
              <Text style={styles.loadingText}>Loading members…</Text>
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="group-add" size={64} color={theme.colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Members Added</Text>
              <Text style={styles.emptySubtitle}>
                Add your family members so they can access your unit's benefits.
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {members.map((member, idx) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelf={idx === 0 && profile?.fullName === member.full_name}
                  deleting={deletingId === member.id}
                  onDelete={() => handleDelete(member)}
                  canDelete={isFlatAdmin}
                />
              ))}
            </View>
          )}

          {/* Skeleton hint */}
          {!loading && (
            <View style={styles.skeletonHint}>
              <View style={styles.skeletonBox}>
                <MaterialIcons name="group-add" size={36} color={theme.colors.outlineVariant} />
              </View>
              <View style={styles.skeletonBox2}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: "65%" }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom bar */}
        {isFlatAdmin && (
          <View
            style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <TouchableOpacity style={styles.addBtn} onPress={openModal}>
              <MaterialIcons name="person-add" size={20} color="#ffffff" />
              <Text style={styles.addBtnText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Member Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                onPress={() => setShowModal(false)}
                activeOpacity={1}
              />
              <View
                style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
              >
                {/* Handle */}
                <View style={styles.sheetHandle} />

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Household Member</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={22} color={theme.colors.outline} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Full Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FULL NAME *</Text>
                    <View style={styles.inputRow}>
                      <MaterialIcons
                        name="person"
                        size={20}
                        color={theme.colors.outline}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Priya Sharma"
                        placeholderTextColor={theme.colors.outline}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Phone */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
                    <View style={styles.inputRow}>
                      <MaterialIcons
                        name="phone"
                        size={20}
                        color={theme.colors.outline}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="+91 98765 43210"
                        placeholderTextColor={theme.colors.outline}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  {/* Relationship */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>RELATIONSHIP</Text>
                    <View style={styles.chipGrid}>
                      {RELATIONSHIPS.map((rel) => {
                        const active = relationship === rel;
                        return (
                          <TouchableOpacity
                            key={rel}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setRelationship(rel)}
                          >
                            <MaterialIcons
                              name={relationshipIcon(rel)}
                              size={16}
                              color={active ? theme.colors.secondary : theme.colors.onSurfaceVariant}
                            />
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {rel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Security note */}
                  <View style={styles.noteBox}>
                    <MaterialIcons name="verified-user" size={18} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.noteText}>
                      Members will be verified by society admin within 24 hours.
                    </Text>
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleAddMember}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                        <Text style={styles.submitText}>Add to Household</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outer: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.25)",
    zIndex: 10,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4, borderRadius: 20 },
  topBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },

  scroll: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.lg,
    paddingBottom: 120,
  },

  infoBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(134,242,228,0.18)",
    borderWidth: 1,
    borderColor: "rgba(134,242,228,0.4)",
    borderRadius: 14,
    marginBottom: theme.spacing.lg,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.secondary,
    lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  countText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },

  loadingBox: { alignItems: "center", paddingTop: 48, gap: 12 },
  loadingText: { ...theme.typography.bodyMd, color: theme.colors.onSurfaceVariant },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  membersList: { gap: 12 },

  memberCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.3)",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.outlineVariant,
  },
  memberInfo: { flex: 1, gap: 2 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontSize: 15,
    fontWeight: "600",
  },
  selfBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
  },
  selfBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.secondary,
    letterSpacing: 0.5,
  },
  memberRelation: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  memberPhone: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
    fontWeight: "400",
  },

  memberRight: { alignItems: "center", gap: 8 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(186,26,26,0.08)",
  },
  editBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },

  skeletonHint: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    opacity: 0.25,
  },
  skeletonBox: {
    flex: 1,
    height: 96,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonBox2: {
    flex: 1,
    height: 96,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  skeletonLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.outlineVariant,
    width: "100%",
  },

  bottomBar: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(198,198,205,0.25)",
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    maxHeight: "90%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.2)",
    marginBottom: 16,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },

  fieldGroup: { marginBottom: 16, gap: 6 },
  fieldLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 10,
    height: 50,
  },
  inputIcon: { marginLeft: 14, marginRight: 8 },
  textInput: {
    flex: 1,
    height: "100%",
    paddingRight: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondaryContainer,
  },
  chipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  chipTextActive: { color: theme.colors.secondary, fontWeight: "700" },

  noteBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(198,198,205,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.25)",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    ...theme.typography.bodyMd,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },

  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
