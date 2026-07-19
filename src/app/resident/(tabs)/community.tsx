import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Linking,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommunityHubScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Polls State
  const [polls, setPolls] = useState<any[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [pollVotesCount, setPollVotesCount] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingPolls, setLoadingPolls] = useState(false);

  // Tickets / Helpdesk State
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketCategory, setTicketCategory] = useState<"Plumbing" | "Electrical" | "Security" | "Cleaning" | "Others">("Plumbing");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketUrgent, setTicketUrgent] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const fetchNotices = async () => {
    if (!profile?.societyId) return;
    try {
      setLoadingNotices(true);
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setNotices(data);
    } catch (err) {
      console.error("Error fetching notices:", err);
    } finally {
      setLoadingNotices(false);
    }
  };

  const fetchPolls = async () => {
    if (!profile?.societyId || !profile?.id) return;
    try {
      setLoadingPolls(true);
      const { data: pollsData, error: pollsErr } = await supabase
        .from("polls")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (pollsErr) throw pollsErr;

      if (pollsData && pollsData.length > 0) {
        const activePoll = pollsData[0];
        setPolls(pollsData);

        // Fetch all votes for this active poll
        const { data: votesData, error: votesErr } = await supabase
          .from("poll_votes")
          .select("selected_option, user_id")
          .eq("poll_id", activePoll.id);

        if (votesErr) throw votesErr;

        if (votesData) {
          setTotalVotes(votesData.length);

          const counts: Record<string, number> = {};
          activePoll.options.forEach((opt: string) => {
            counts[opt] = votesData.filter((v: any) => v.selected_option === opt).length;
          });
          setPollVotesCount(counts);

          // Check if current user voted
          const userVoteRecord = votesData.find((v: any) => v.user_id === profile.id);
          if (userVoteRecord) {
            const optIndex = activePoll.options.indexOf(userVoteRecord.selected_option);
            setSelectedPoll(optIndex);
          } else {
            setSelectedPoll(null);
          }
        }
      } else {
        setPolls([]);
        setTotalVotes(0);
        setPollVotesCount({});
        setSelectedPoll(null);
      }
    } catch (err) {
      console.error("Error fetching polls:", err);
    } finally {
      setLoadingPolls(false);
    }
  };

  const fetchTickets = async () => {
    if (!profile?.id) return;
    try {
      setLoadingTickets(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (profile?.id && profile?.societyId) {
      fetchNotices();
      fetchPolls();
      fetchTickets();
    }
  }, [profile?.id, profile?.societyId]);

  const handleVote = async (optionName: string, index: number) => {
    if (selectedPoll !== null || !profile?.id || polls.length === 0) return;
    const activePoll = polls[0];
    try {
      const { error } = await supabase
        .from("poll_votes")
        .insert({
          poll_id: activePoll.id,
          user_id: profile.id,
          selected_option: optionName,
        });

      if (error) throw error;

      setSelectedPoll(index);
      Alert.alert("Success", "Your vote has been cast!");
      fetchPolls();
    } catch (err: any) {
      Alert.alert("Vote Error", err.message || "Failed to submit vote.");
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) {
      Alert.alert("Error", "Please provide a title for the ticket.");
      return;
    }
    if (!profile?.id || !profile?.societyId) return;

    setSubmittingTicket(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .insert({
          user_id: profile.id,
          society_id: profile.societyId,
          title: ticketTitle.trim(),
          category: ticketCategory,
          description: ticketDescription.trim(),
          is_urgent: ticketUrgent,
          status: "Pending",
        });

      if (error) throw error;

      setShowNewTicketModal(false);
      setTicketTitle("");
      setTicketDescription("");
      setTicketUrgent(false);
      Alert.alert("Success", "Your helpdesk ticket has been raised successfully!");
      fetchTickets();
    } catch (err: any) {
      Alert.alert("Error raising ticket", err.message || "Failed to raise ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

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

  const getPercent = (optionName: string) => {
    if (totalVotes === 0) return "0%";
    const votes = pollVotesCount[optionName] || 0;
    return Math.round((votes / totalVotes) * 100) + "%";
  };

  const handleContactCall = (name: string, phone: string) => {
    Alert.alert("Call Contact", `Do you want to call ${name} (${phone})?`, [
      { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`).catch(() => Alert.alert("Dialer unavailable")) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!profile) return null;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={[styles.topAppBar, { paddingTop: insets.top }]}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Community Hub</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { fetchNotices(); fetchPolls(); fetchTickets(); }}>
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Notices Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Notices</Text>
              <Text style={styles.sectionSubtitle}>Stay updated with society news</Text>
            </View>
          </View>

          {loadingNotices ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 20 }} />
          ) : notices.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noticeList}>
              {notices.map((n) => {
                const parsed = parseDescription(n.description);
                const isUrgent = n.category === "Urgent";
                return (
                  <View key={n.id} style={styles.noticeCard}>
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                    <View style={styles.noticeCardHeader}>
                      <View style={[styles.noticeIconBox, { backgroundColor: isUrgent ? "rgba(186, 26, 26, 0.1)" : "rgba(0, 106, 97, 0.1)" }]}>
                        <MaterialIcons name={isUrgent ? "error" : "campaign"} size={20} color={isUrgent ? theme.colors.error : theme.colors.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noticeDate}>
                          {new Date(n.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }).toUpperCase()}
                        </Text>
                        <Text style={styles.noticeTitle} numberOfLines={1}>{n.title}</Text>
                      </View>
                    </View>
                    <Text style={styles.noticeDesc} numberOfLines={2}>{parsed.content}</Text>
                    <TouchableOpacity style={styles.noticeActionBtn} onPress={() => Alert.alert(n.title, parsed.content)}>
                      <Text style={styles.noticeActionText}>Read Details</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyAnnouncements}>
              <MaterialIcons name="campaign" size={32} color={theme.colors.outline} />
              <Text style={styles.emptyAnnouncementsText}>No announcements posted recently.</Text>
            </View>
          )}
        </View>

        {/* Community Polls Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Community Polls</Text>
          {loadingPolls ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 20 }} />
          ) : polls.length > 0 ? (
            <View style={styles.pollContainer}>
              <View style={styles.pollHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.activePollBadge}>
                    <Text style={styles.activePollText}>Active Poll</Text>
                  </View>
                  <Text style={styles.pollQuestion}>{polls[0].question}</Text>
                </View>
                <View style={styles.votesCounterWrapper}>
                  <Text style={styles.votesCount}>{totalVotes}</Text>
                  <Text style={styles.votesLabel}>Votes</Text>
                </View>
              </View>

              <View style={styles.pollOptions}>
                {polls[0].options.map((opt: string, index: number) => {
                  const percentage = getPercent(opt);
                  const isSelected = selectedPoll === index;
                  const hasVoted = selectedPoll !== null;

                  return (
                    <TouchableOpacity
                      key={opt}
                      disabled={hasVoted}
                      style={[styles.pollOptionBtn, isSelected && styles.pollOptionBtnSelected]}
                      onPress={() => handleVote(opt, index)}
                      activeOpacity={0.8}
                    >
                      {/* Fill Bar behind content */}
                      {hasVoted && (
                        <View style={[styles.pollFillBar, { width: percentage as any }]} />
                      )}
                      <View style={styles.pollOptionContent}>
                        <Text style={[styles.pollOptionText, isSelected && styles.pollOptionTextSelected]}>{opt}</Text>
                        {hasVoted && (
                          <Text style={styles.pollPercentText}>{percentage}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.pollFooterText}>
                {new Date(polls[0].expires_at).getTime() < Date.now() ? "Poll Closed" : "Active"} • Verified Residents Only
              </Text>
            </View>
          ) : (
            <View style={styles.emptyAnnouncements}>
              <MaterialIcons name="poll" size={32} color={theme.colors.outline} />
              <Text style={styles.emptyAnnouncementsText}>No active community polls.</Text>
            </View>
          )}
        </View>

        {/* Tickets / Helpdesk Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Helpdesk Tickets</Text>
            <TouchableOpacity onPress={() => setShowNewTicketModal(true)}>
              <Text style={styles.newTicketText}>New Ticket</Text>
            </TouchableOpacity>
          </View>

          {loadingTickets ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 20 }} />
          ) : tickets.length > 0 ? (
            <View style={styles.ticketList}>
              {tickets.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.ticketCard}
                  onPress={() => Alert.alert(item.title, `${item.category} Ticket\nStatus: ${item.status}\n\nDescription: ${item.description || "No further details"}`)}
                >
                  <View style={styles.ticketIconBox}>
                    <MaterialIcons
                      name={item.category === "Plumbing" ? "plumbing" : "build"}
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.ticketInfo}>
                    <View style={styles.ticketTitleRow}>
                      <Text style={styles.ticketTitleText} numberOfLines={1}>{item.title}</Text>
                      <View style={[styles.ticketBadge, item.status === "Resolved" ? styles.statusResolved : item.status === "In Progress" ? styles.statusProgress : styles.statusPending]}>
                        <Text style={[styles.ticketBadgeText, item.status === "Resolved" ? styles.textResolved : item.status === "In Progress" ? styles.textProgress : styles.textPending]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ticketBottomRow}>
                      <Text style={styles.ticketAssigned}>
                        {item.assigned_to ? `Assigned to: ${item.assigned_to}` : "Awaiting assignment"}
                      </Text>
                      <Text style={styles.ticketTime}>
                        {new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAnnouncements}>
              <MaterialIcons name="build" size={32} color={theme.colors.outline} />
              <Text style={styles.emptyAnnouncementsText}>You haven't raised any support tickets.</Text>
            </View>
          )}
        </View>

        {/* Quick Contact Section */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Quick Contact</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsList}>
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Manager", "+91 98765 43210")}>
              <View style={[styles.contactAvatarBorder, { borderColor: theme.colors.secondary }]}>
                <Image
                  source={{ uri: "https://ui-avatars.com/api/?name=Manager&background=0D9488&color=fff" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Manager</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Main Gate Security", "+91 99999 88888")}>
              <View style={styles.contactAvatarBorder}>
                <Image
                  source={{ uri: "https://ui-avatars.com/api/?name=Security&background=0F172A&color=fff" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Main Gate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Duty Electrician", "+91 91234 56789")}>
              <View style={styles.contactAvatarBorder}>
                <Image
                  source={{ uri: "https://ui-avatars.com/api/?name=Electrician&background=86F2E4&color=000" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Electrician</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal visible={showNewTicketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowNewTicketModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Ticket Title *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Brief summary (e.g., Balcony light fused)"
                value={ticketTitle}
                onChangeText={setTicketTitle}
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {["Plumbing", "Electrical", "Security", "Cleaning", "Others"].map((cat: any) => {
                  const selected = ticketCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBtn, selected && styles.categoryBtnActive]}
                      onPress={() => setTicketCategory(cat)}
                    >
                      <Text style={[styles.categoryBtnText, selected && styles.categoryBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Detailed Description</Text>
              <TextInput
                style={styles.textInputArea}
                placeholder="Explain the issue in detail"
                multiline
                numberOfLines={4}
                value={ticketDescription}
                onChangeText={setTicketDescription}
                placeholderTextColor={theme.colors.outline}
              />

              <View style={styles.urgentRow}>
                <View>
                  <Text style={styles.urgentTitle}>Mark as Urgent</Text>
                  <Text style={styles.urgentDesc}>Check if this requires immediate attention.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkbox, ticketUrgent && styles.checkboxChecked]}
                  onPress={() => setTicketUrgent(!ticketUrgent)}
                >
                  {ticketUrgent && <MaterialIcons name="check" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>

              {submittingTicket ? (
                <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginTop: 24 }} />
              ) : (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreateTicket}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Submit Ticket</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  sectionSubtitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  noticeList: {
    gap: 14,
    paddingVertical: 4,
  },
  noticeCard: {
    width: 260,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  urgentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.error,
    fontWeight: "800",
  },
  noticeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  noticeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  noticeDate: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.outline,
    fontWeight: "700",
  },
  noticeTitle: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  noticeDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  noticeActionBtn: {
    alignSelf: "flex-start",
  },
  noticeActionText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  emptyAnnouncements: {
    padding: 24,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyAnnouncementsText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
  },
  pollContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 16,
    gap: 16,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  activePollBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  activePollText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  pollQuestion: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  votesCounterWrapper: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  votesCount: {
    ...theme.typography.button,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  votesLabel: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.outline,
  },
  pollOptions: {
    gap: 10,
  },
  pollOptionBtn: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    position: "relative",
  },
  pollOptionBtnSelected: {
    borderColor: theme.colors.secondary,
  },
  pollFillBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(134, 242, 228, 0.18)",
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  pollOptionText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  pollOptionTextSelected: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  pollPercentText: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.secondary,
  },
  pollFooterText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newTicketText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  ticketIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketInfo: {
    flex: 1,
    gap: 2,
  },
  ticketTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTitleText: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
    flex: 1,
    marginRight: 8,
  },
  ticketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    fontWeight: "700",
  },
  statusResolved: {
    backgroundColor: "rgba(0, 106, 97, 0.08)",
  },
  statusProgress: {
    backgroundColor: "rgba(245, 127, 23, 0.08)",
  },
  statusPending: {
    backgroundColor: "rgba(118, 119, 125, 0.08)",
  },
  textResolved: {
    color: theme.colors.secondary,
  },
  textProgress: {
    color: "#b26a00",
  },
  textPending: {
    color: theme.colors.outline,
  },
  ticketBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketAssigned: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  ticketTime: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.outline,
  },
  contactsList: {
    gap: 14,
    paddingVertical: 4,
  },
  contactItem: {
    alignItems: "center",
    gap: 6,
  },
  contactAvatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  contactAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  contactLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 14,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 4,
  },
  categoryBtn: {
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 19,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  categoryBtnActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  categoryBtnText: {
    ...theme.typography.button,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  categoryBtnTextActive: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
    height: 100,
    textAlignVertical: "top",
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  urgentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  urgentTitle: {
    ...theme.typography.button,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  urgentDesc: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  submitBtn: {
    height: 52,
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontSize: 16,
  },
});
