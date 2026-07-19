import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NoticeDetailBottomSheet, { NoticeDetail } from "../../../components/NoticeDetailBottomSheet";
import { sendPushNotification } from "../../../../utils/notificationService";
import { supabase } from "../../../../utils/supabase";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";

interface Notice {
  id: string;
  title: string;
  category: "Maintenance" | "Security" | "Event" | "General";
  content: string;
  date: string;
  author: string;
}

interface Poll {
  id: string;
  question: string;
  optionA: string;
  optionA_votes: number;
  optionB: string;
  optionB_votes: number;
  totalVotes: number;
  isActive: boolean;
}

export default function AdminNoticesAndPolls() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"Notices" | "Polls">("Notices");
  const { profile } = useProfileStore();

  const notifyAllMembers = async (title: string, body: string, screen: string) => {
    try {
      const { data: members, error: memErr } = await supabase
        .from("societymembers")
        .select(`
          user_id,
          users (
            notification_token
          )
        `)
        .eq("society_id", profile?.societyId);

      if (memErr) throw memErr;

      if (members && members.length > 0) {
        const promises = members.map(async (member) => {
          const usersData = member.users;
          const token = Array.isArray(usersData)
            ? usersData[0]?.notification_token
            : (usersData as any)?.notification_token;
          if (token) {
            try {
              await sendPushNotification({
                token,
                title,
                body,
                data: {
                  screen,
                  url: screen,
                },
              });
            } catch (err) {
              console.warn(`Failed to send push to token ${token}:`, err);
            }
          }

          try {
            await supabase.from("push_notifications").insert({
              user_id: member.user_id,
              title,
              body,
              screen,
              status: "Sent",
            });
          } catch (err) {
            console.warn(`Failed to insert push notification log for user ${member.user_id}:`, err);
          }
        });

        await Promise.all(promises);
      }
    } catch (err) {
      console.warn("Failed to notify community members:", err);
    }
  };

  // State Lists
  const [notices, setNotices] = useState<Notice[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);

  // Spinning animation for refresh button
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = () => {
    spinAnim.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    );
    spinLoopRef.current.start();
  };

  const stopSpin = () => {
    spinLoopRef.current?.stop();
    Animated.timing(spinAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Modal states
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);

  // Notice detail bottom sheet
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);
  const [noticeSheetVisible, setNoticeSheetVisible] = useState(false);

  const openNoticeSheet = (notice: Notice) => {
    setSelectedNotice({
      id: notice.id,
      title: notice.title,
      category: notice.category,
      content: notice.content,
      date: notice.date,
      author: notice.author,
    });
    setNoticeSheetVisible(true);
  };

  // Form states
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState<"Maintenance" | "Security" | "Event" | "General">("General");
  const [newNoticeContent, setNewNoticeContent] = useState("");

  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptionA, setNewPollOptionA] = useState("");
  const [newPollOptionB, setNewPollOptionB] = useState("");

  const mapDbNoticeToFrontend = (item: any): Notice => {
    const match = item.description.match(/^\[(Maintenance|Security|Event|General)\] ([\s\S]*)$/);
    if (match) {
      return {
        id: item.id,
        title: item.title,
        category: match[1] as any,
        content: match[2],
        date: new Date(item.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        author: "Admin Team",
      };
    }
    return {
      id: item.id,
      title: item.title,
      category: (item.category === "Urgent" ? "Security" : "General") as any,
      content: item.description,
      date: new Date(item.created_at).toLocaleDateString(),
      author: "Admin Team",
    };
  };

  const fetchNotices = async () => {
    if (!profile?.societyId) return;
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setNotices(data.map(mapDbNoticeToFrontend));
      }
    } catch (err: any) {
      console.error("Error fetching notices:", err.message);
    }
  };

  const fetchPolls = async () => {
    if (!profile?.societyId) return;
    try {
      const { data: pollsData, error: pollsErr } = await supabase
        .from("polls")
        .select("*")
        .eq("society_id", profile.societyId)
        .order("created_at", { ascending: false });

      if (pollsErr) throw pollsErr;

      if (pollsData && pollsData.length > 0) {
        const pollIds = pollsData.map((p: any) => p.id);
        const { data: votesData, error: votesErr } = await supabase
          .from("poll_votes")
          .select("poll_id, selected_option")
          .in("poll_id", pollIds);

        if (votesErr) throw votesErr;

        const votesByPoll: Record<string, { total: number; optA: number; optB: number }> = {};
        pollIds.forEach((id: string) => {
          votesByPoll[id] = { total: 0, optA: 0, optB: 0 };
        });

        if (votesData) {
          votesData.forEach((vote: any) => {
            const p = pollsData.find((pl: any) => pl.id === vote.poll_id);
            if (p) {
              const optA = p.options[0] || "Yes";
              const optB = p.options[1] || "No";
              votesByPoll[vote.poll_id].total += 1;
              if (vote.selected_option === optA) {
                votesByPoll[vote.poll_id].optA += 1;
              } else if (vote.selected_option === optB) {
                votesByPoll[vote.poll_id].optB += 1;
              }
            }
          });
        }

        const mappedPolls: Poll[] = pollsData.map((p: any) => {
          const stats = votesByPoll[p.id] || { total: 0, optA: 0, optB: 0 };
          const isExpired = new Date(p.expires_at).getTime() < Date.now();
          return {
            id: p.id,
            question: p.question,
            optionA: p.options[0] || "Yes",
            optionA_votes: stats.optA,
            optionB: p.options[1] || "No",
            optionB_votes: stats.optB,
            totalVotes: stats.total,
            isActive: !isExpired,
          };
        });

        setPolls(mappedPolls);
      } else {
        setPolls([]);
      }
    } catch (err: any) {
      console.error("Error fetching polls:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      setLoading(true);
      Promise.all([fetchNotices(), fetchPolls()]).finally(() => setLoading(false));
    }
  }, [profile?.societyId]);

  // Auto-refresh when admin navigates to this screen
  useFocusEffect(
    useCallback(() => {
      if (profile?.societyId) {
        setLoading(true);
        Promise.all([fetchNotices(), fetchPolls()]).finally(() => setLoading(false));
      }
    }, [profile?.societyId]),
  );

  // Spin icon while loading
  useEffect(() => {
    if (loading) {
      startSpin();
    } else {
      stopSpin();
    }
  }, [loading]);

  const handleRefresh = () => {
    if (!profile?.societyId || loading) return;
    setLoading(true);
    Promise.all([fetchNotices(), fetchPolls()]).finally(() => setLoading(false));
  };

  const handleCreateNotice = async () => {
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      Alert.alert("Missing Fields", "Please enter notice title and details.");
      return;
    }
    if (!profile?.societyId) return;

    try {
      const formattedDesc = `[${newNoticeCategory}] ${newNoticeContent.trim()}`;
      const dbCategory = (newNoticeCategory === "Security" || newNoticeCategory === "Maintenance") ? "Urgent" : "General";

      const { data, error } = await supabase
        .from("notices")
        .insert({
          society_id: profile.societyId,
          title: newNoticeTitle.trim(),
          description: formattedDesc,
          category: dbCategory,
        })
        .select()
        .single();

      if (data) {
        const newNotice = mapDbNoticeToFrontend(data);
        setNotices([newNotice, ...notices]);
        // Notify community members asynchronously
        notifyAllMembers(
          "New Community Notice 📢",
          newNoticeTitle.trim(),
          "/resident/community"
        );
      }

      setNoticeModalVisible(false);
      // Reset form
      setNewNoticeTitle("");
      setNewNoticeCategory("General");
      setNewNoticeContent("");
      Alert.alert("Success", "Notice posted to community successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create notice.");
    }
  };

  const handleCreatePoll = async () => {
    if (!newPollQuestion.trim() || !newPollOptionA.trim() || !newPollOptionB.trim()) {
      Alert.alert("Missing Fields", "Please enter poll question and both options.");
      return;
    }
    if (!profile?.societyId) return;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Default expiry 7 days

      const { data, error } = await supabase
        .from("polls")
        .insert({
          society_id: profile.societyId,
          question: newPollQuestion.trim(),
          options: [newPollOptionA.trim(), newPollOptionB.trim()],
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newPoll: Poll = {
          id: data.id,
          question: data.question,
          optionA: data.options[0],
          optionA_votes: 0,
          optionB: data.options[1],
          optionB_votes: 0,
          totalVotes: 0,
          isActive: true,
        };
        setPolls([newPoll, ...polls]);
        // Notify community members asynchronously
        notifyAllMembers(
          "New Community Poll 🗳️",
          newPollQuestion.trim(),
          "/resident/community"
        );
      }

      setPollModalVisible(false);
      // Reset form
      setNewPollQuestion("");
      setNewPollOptionA("");
      setNewPollOptionB("");
      Alert.alert("Success", "Poll created and opened for voting!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create poll.");
    }
  };

  const getCategoryColor = (cat: "Maintenance" | "Security" | "Event" | "General") => {
    switch (cat) {
      case "Maintenance":
        return { bg: "rgba(0, 106, 97, 0.1)", text: theme.colors.secondary };
      case "Security":
        return { bg: "rgba(186, 26, 26, 0.1)", text: theme.colors.error };
      case "Event":
        return { bg: "rgba(218, 226, 253, 0.5)", text: "#3f465c" };
      case "General":
      default:
        return { bg: "rgba(124, 131, 155, 0.15)", text: theme.colors.onSurfaceVariant };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notices & Polls</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <MaterialIcons
                name="refresh"
                size={22}
                color={loading ? theme.colors.secondary : theme.colors.primary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "Notices" && styles.tabButtonActive]}
            onPress={() => setActiveTab("Notices")}
          >
            <Text style={[styles.tabText, activeTab === "Notices" && styles.tabTextActive]}>
              Notices
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "Polls" && styles.tabButtonActive]}
            onPress={() => setActiveTab("Polls")}
          >
            <Text style={[styles.tabText, activeTab === "Polls" && styles.tabTextActive]}>
              Polls
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "Notices" ? (
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setNoticeModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add-alert" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.createButtonText}>Post New Notice</Text>
            </TouchableOpacity>

            <Text style={styles.listSectionTitle}>Active Notice Board</Text>
            {notices.map((notice) => {
              const catStyles = getCategoryColor(notice.category);
              return (
                <TouchableOpacity
                  key={notice.id}
                  style={styles.card}
                  onPress={() => openNoticeSheet(notice)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{notice.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: catStyles.bg }]}>
                      <Text style={[styles.categoryBadgeText, { color: catStyles.text }]}>
                        {notice.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardContent} numberOfLines={2}>{notice.content}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <MaterialIcons name="person" size={14} color={theme.colors.outline} />
                      <Text style={styles.footerText}>{notice.author}</Text>
                    </View>
                    <View style={styles.footerRight}>
                      <MaterialIcons name="access-time" size={14} color={theme.colors.outline} />
                      <Text style={styles.footerText}>{notice.date}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.listContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setPollModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="poll" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.createButtonText}>Create New Poll</Text>
            </TouchableOpacity>

            <Text style={styles.listSectionTitle}>Community Opinion Polls</Text>
            {polls.map((poll) => {
              const percentA =
                poll.totalVotes > 0
                  ? Math.round((poll.optionA_votes / poll.totalVotes) * 100)
                  : 0;
              const percentB =
                poll.totalVotes > 0
                  ? Math.round((poll.optionB_votes / poll.totalVotes) * 100)
                  : 0;

              return (
                <View key={poll.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.pollQuestion}>{poll.question}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: poll.isActive
                            ? "rgba(0, 106, 97, 0.1)"
                            : "rgba(124, 131, 155, 0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: poll.isActive ? theme.colors.secondary : theme.colors.outline },
                        ]}
                      >
                        {poll.isActive ? "Active" : "Closed"}
                      </Text>
                    </View>
                  </View>

                  {/* Results bars */}
                  <View style={styles.pollResults}>
                    {/* Option A */}
                    <View style={styles.pollOptionRow}>
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionLabel}>{poll.optionA}</Text>
                        <Text style={styles.optionPercentage}>{percentA}%</Text>
                      </View>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${percentA}%`, backgroundColor: theme.colors.secondary },
                          ]}
                        />
                      </View>
                      <Text style={styles.votesText}>{poll.optionA_votes} votes</Text>
                    </View>

                    {/* Option B */}
                    <View style={styles.pollOptionRow}>
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionLabel}>{poll.optionB}</Text>
                        <Text style={styles.optionPercentage}>{percentB}%</Text>
                      </View>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${percentB}%`,
                              backgroundColor: theme.colors.secondaryContainer,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.votesText}>{poll.optionB_votes} votes</Text>
                    </View>
                  </View>

                  <View style={styles.pollFooter}>
                    <Text style={styles.totalVotesText}>
                      Total Votes Cast: {poll.totalVotes}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* CREATE NOTICE MODAL */}
      <Modal visible={noticeModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBg}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post New Notice</Text>
              <TouchableOpacity onPress={() => setNoticeModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Notice Title</Text>
              <TextInput
                style={styles.input}
                value={newNoticeTitle}
                onChangeText={setNewNoticeTitle}
                placeholder="e.g. Water tank cleaning"
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelectRow}>
                {(["General", "Maintenance", "Security", "Event"] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categorySelectButton,
                      newNoticeCategory === cat && styles.categorySelectButtonActive,
                    ]}
                    onPress={() => setNewNoticeCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categorySelectText,
                        newNoticeCategory === cat && styles.categorySelectTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notice Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newNoticeContent}
                onChangeText={setNewNoticeContent}
                placeholder="Write notice description details here..."
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.8}
                onPress={handleCreateNotice}
              >
                <Text style={styles.submitButtonText}>Publish Announcement</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CREATE POLL MODAL */}
      <Modal visible={pollModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBg}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Opinion Poll</Text>
              <TouchableOpacity onPress={() => setPollModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Poll Question</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newPollQuestion}
                onChangeText={setNewPollQuestion}
                placeholder="e.g. Should we host a summer pool party?"
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Option A</Text>
              <TextInput
                style={styles.input}
                value={newPollOptionA}
                onChangeText={setNewPollOptionA}
                placeholder="e.g. Yes, host it"
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.inputLabel}>Option B</Text>
              <TextInput
                style={styles.input}
                value={newPollOptionB}
                onChangeText={setNewPollOptionB}
                placeholder="e.g. No, cancel"
                placeholderTextColor={theme.colors.outline}
              />

              <TouchableOpacity
                style={styles.submitButton}
                activeOpacity={0.8}
                onPress={handleCreatePoll}
              >
                <Text style={styles.submitButtonText}>Launch Poll</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Notice Detail Bottom Sheet */}
      <NoticeDetailBottomSheet
        notice={selectedNotice}
        visible={noticeSheetVisible}
        onClose={() => setNoticeSheetVisible(false)}
      />
    </View>
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
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 12,
    marginBottom: 12,
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 4,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.rounded.default,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  listContainer: {
    marginTop: theme.spacing.lg,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.rounded.full,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  listSectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardContent: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.15)",
    paddingTop: 10,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
  },
  pollQuestion: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
    flex: 1,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
  },
  pollResults: {
    marginTop: 8,
    gap: 16,
    marginBottom: 8,
  },
  pollOptionRow: {
    gap: 6,
  },
  optionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  optionPercentage: {
    ...theme.typography.bodyMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  barBackground: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  votesText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    textAlign: "right",
  },
  pollFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.15)",
    paddingTop: 12,
    marginTop: 12,
  },
  totalVotesText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.rounded.xl,
    borderTopRightRadius: theme.rounded.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalForm: {
    padding: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginBottom: 6,
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
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  categorySelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categorySelectButton: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categorySelectButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categorySelectText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  categorySelectTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.full,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
});
