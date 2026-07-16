import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Linking, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: "In Progress" | "Resolved" | "Pending";
  assignedTo?: string;
  timestamp: string;
  description?: string;
}

export default function CommunityHubScreen() {
  const { profile } = useProfileStore();
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Plumbing");
  const [ticketDescription, setTicketDescription] = useState("");

  // Initial Ticket List State matching HTML exactly
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "ticket-1",
      title: "Leaking pipe in kitchen",
      category: "Plumbing",
      status: "In Progress",
      assignedTo: "Ramesh (Plumber)",
      timestamp: "Yesterday",
      description: "Water is continuously dripping from the kitchen sink joint.",
    },
    {
      id: "ticket-2",
      title: "Balcony light fuse",
      category: "Electrical",
      status: "Resolved",
      timestamp: "3 days ago",
      description: "Main balcony bulb fused last night.",
    },
  ]);

  // Poll votes calculations
  const pollVotes = [
    { name: "New Gym Equipment", baseVotes: 52 },
    { name: "Kids Play Zone Extension", baseVotes: 38 },
    { name: "EV Charging Points", baseVotes: 34 },
  ];
  
  const totalVotes = pollVotes.reduce((sum, item) => sum + item.baseVotes, 0) + (selectedPoll !== null ? 1 : 0);

  const getPercent = (index: number) => {
    let votes = pollVotes[index].baseVotes;
    if (selectedPoll === index) votes += 1;
    return Math.round((votes / totalVotes) * 100) + "%";
  };

  const handleCreateTicket = () => {
    if (!ticketTitle.trim()) {
      Alert.alert("Error", "Please provide a title for the ticket.");
      return;
    }

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      title: ticketTitle,
      category: ticketCategory,
      status: "Pending",
      timestamp: "Just now",
      description: ticketDescription,
    };

    setTickets([newTicket, ...tickets]);
    setShowNewTicketModal(false);
    setTicketTitle("");
    setTicketDescription("");
    Alert.alert("Success", "Your helpdesk ticket has been raised successfully!");
  };

  const handleContactCall = (name: string, phone: string) => {
    Alert.alert("Call Contact", `Do you want to call ${name} (${phone})?`, [
      { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!profile) return null;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>HomeCircle</Text>
        </View>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuoYt8stAwlVQvpeWjUX1OksE2yqiWgL_u-Cc0DRgng_1YPs7h7aUCNv-y3seSsSkyRZXDO0r7WtmXGMbPo4ValoBVqImj2XUGAdxjs2v37vyrNa0N8ERZ26wNGp4aNU7aIT15xDlzk2VK5ew9k_Gy0ajnVqwTmDPa2dHjWD2NH5bk9SjVsUb7pkviQU2RPLxNkMxn224ydfEGfKeroV6xYYHAxTWJjkByYx4nOFwKE8EvSt35WnJKVA" }}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Notices Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Notices</Text>
              <Text style={styles.sectionSubtitle}>Stay updated with society news</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Notices", "You are up to date.")}>
              <View style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialIcons name="chevron-right" size={16} color={theme.colors.secondary} />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noticeList}>
            {/* Notice Card 1 */}
            <View style={styles.noticeCard}>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
              <View style={styles.noticeCardHeader}>
                <View style={[styles.noticeIconBox, { backgroundColor: "rgba(19, 27, 46, 0.1)" }]}>
                  <MaterialIcons name="water-drop" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.noticeDate}>TODAY, 10:00 AM</Text>
                  <Text style={styles.noticeTitle}>Water Maintenance</Text>
                </View>
              </View>
              <Text style={styles.noticeDesc}>Water supply will be suspended for 2 hours in Block C for tank cleaning.</Text>
              <TouchableOpacity style={styles.noticeActionBtn} onPress={() => Alert.alert("Notice Details", "Tank cleaning scheduled from 10:00 AM to 12:00 PM. Please store enough water.")}>
                <Text style={styles.noticeActionText}>Read Details</Text>
              </TouchableOpacity>
            </View>

            {/* Notice Card 2 */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeCardHeader}>
                <View style={[styles.noticeIconBox, { backgroundColor: "rgba(0, 106, 97, 0.1)" }]}>
                  <MaterialIcons name="celebration" size={20} color={theme.colors.secondary} />
                </View>
                <View>
                  <Text style={styles.noticeDate}>26 JAN</Text>
                  <Text style={styles.noticeTitle}>Republic Day</Text>
                </View>
              </View>
              <Text style={styles.noticeDesc}>Join us for the flag hoisting ceremony at the main clubhouse garden.</Text>
              <TouchableOpacity style={styles.noticeActionBtn} onPress={() => Alert.alert("Success", "Attendance registered. Thank you!")}>
                <Text style={styles.noticeActionText}>Register Attendance</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Community Polls Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Community Polls</Text>
          <View style={styles.pollContainer}>
            <View style={styles.pollHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.activePollBadge}>
                  <Text style={styles.activePollText}>Active Poll</Text>
                </View>
                <Text style={styles.pollQuestion}>Proposed New Facilities?</Text>
                <Text style={styles.pollSubtext}>Vote for the upgrade you want most in FY24.</Text>
              </View>
              <View style={styles.votesCounterWrapper}>
                <Text style={styles.votesCount}>{totalVotes}</Text>
                <Text style={styles.votesLabel}>Votes</Text>
              </View>
            </View>

            <View style={styles.pollOptions}>
              {pollVotes.map((item, index) => {
                const percentage = getPercent(index);
                const isSelected = selectedPoll === index;
                const hasVoted = selectedPoll !== null;

                return (
                  <TouchableOpacity
                    key={index}
                    disabled={hasVoted}
                    style={[styles.pollOptionBtn, isSelected && styles.pollOptionBtnSelected]}
                    onPress={() => setSelectedPoll(index)}
                  >
                    {/* Fill Bar behind content */}
                    {hasVoted && (
                      <View style={[styles.pollFillBar, { width: percentage as any }]} />
                    )}
                    <View style={styles.pollOptionContent}>
                      <Text style={[styles.pollOptionText, isSelected && styles.pollOptionTextSelected]}>{item.name}</Text>
                      {hasVoted && (
                        <Text style={styles.pollPercentText}>{percentage}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.pollFooterText}>Ending in 2 days • Verified Residents Only</Text>
          </View>
        </View>

        {/* Tickets / Helpdesk Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Tickets</Text>
            <TouchableOpacity onPress={() => setShowNewTicketModal(true)}>
              <Text style={styles.newTicketText}>New Ticket</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ticketList}>
            {tickets.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.ticketCard}
                onPress={() => Alert.alert(item.title, `${item.category} Helpdesk Ticket\nStatus: ${item.status}\n\nDescription: ${item.description || "No further details"}`)}
              >
                <View style={styles.ticketIconBox}>
                  <MaterialIcons
                    name={item.category === "Plumbing" ? "plumbing" : "lightbulb"}
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.ticketInfo}>
                  <View style={styles.ticketTitleRow}>
                    <Text style={styles.ticketTitleText}>{item.title}</Text>
                    <View style={[styles.ticketBadge, item.status === "Resolved" ? styles.statusResolved : item.status === "In Progress" ? styles.statusProgress : styles.statusPending]}>
                      <Text style={[styles.ticketBadgeText, item.status === "Resolved" ? styles.textResolved : item.status === "In Progress" ? styles.textProgress : styles.textPending]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ticketBottomRow}>
                    <Text style={styles.ticketAssigned}>
                      {item.assignedTo ? `Assigned to: ${item.assignedTo}` : "Awaiting assignment"}
                    </Text>
                    <Text style={styles.ticketTime}>{item.timestamp}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Contact Section */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Quick Contact</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsList}>
            {/* Contact 1 */}
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Manager", "+91 98765 43210")}>
              <View style={[styles.contactAvatarBorder, { borderColor: theme.colors.secondary }]}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDokOptZGgsAP-T0MwcRoMG8oak-P1Uqn--I_tu43xxwmWrdn0fzKDYIyD3vwq9_hiJoApMQtyBk4oYkm6Yj_6S-zQbcRL6lcVK58IM-MTb1fAswoE5mzcBlvZqIWQrDmhws-iJp4dg9mCDDv4-j_W61sT1HHHtyOvRE8rG8rEm0JTbPkXpEdfrVxZEZ_LnWsIg-56_DD3K9e1P5rImztMy65bzXpPixfX2WTlqZNBWt5ZtavCq6SG2iw" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Manager</Text>
            </TouchableOpacity>

            {/* Contact 2 */}
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Main Gate", "+91 99999 88888")}>
              <View style={styles.contactAvatarBorder}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbLdi0owwBoA7lU-aZN5MxQh-tf_e2awhb5qLfUlfpgpnT-9SAg6DRgUSfVDJjyahHIiQyoZznys1pODbblmNAz7Ni3BRL-lgVzmvTOVBzOuXElrWIFqqmEiNh_j7uhVgy6a8jYvL6kYqnqe_M4Bw7EyGq2U46nTr9qYjbJJpurQ8hhT1GEHHj2IBmGrnHwsJMA9rDFSv6srU5QfeCcPkD5oXupb-3W0tIyYsqA1pZCm6T2XqrlbMWRQ" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Main Gate</Text>
            </TouchableOpacity>

            {/* Contact 3 */}
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Electrician", "+91 91234 56789")}>
              <View style={styles.contactAvatarBorder}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBobLAwUzZpGx4i3_KFFDiJpuEask7JzMKJF_S84Mz7hgUYFT-AQ1XI_FM8lw8qK2u3ZDEZWmMF7TY0svBUS2VxZRYJWvNK4uLPpVzT6BXW5E2g9umAyi6BLCbVVr60scz7wo5p-b-6YbAsVS7t-lCFfoCIm-md_wMBYUQXQLk2I5gOayP2znOo4gkEX3hcD5qwNGZDU3LeGBItIforIc5u4Zp1fJiXWlHRw4sfif2dpJVvgldhYiEmcA" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Electrician</Text>
            </TouchableOpacity>

            {/* Contact 4 */}
            <TouchableOpacity style={styles.contactItem} onPress={() => handleContactCall("Treasurer", "+91 93456 78901")}>
              <View style={styles.contactAvatarBorder}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcQfVyMTu0kiFgwUvy55RkcOjt-MpMqTj5MzECxoeTxqti5lSwPgmQn0x6LjxFNtcT5jPFxeHhM7MI7FlrhuNqygGvmMw3a_M2rHEjvhHc--hUgrVbUiuoydcsSewY2rwqIdtlRSNBxjSfhJB1dNwYiNGOpdloV2LNGbgB2lyFiPjt2thwnnz7ychbZJm4eyjrPvbCJXSKzOWoDdQ5NP60Qb7c1K9O03B06QEaS2fBXkHEuBwILSkf4Q" }}
                  style={styles.contactAvatar}
                />
              </View>
              <Text style={styles.contactLabel}>Treasurer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowNewTicketModal(true)}>
        <MaterialIcons name="add-comment" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Create Ticket Modal */}
      <Modal visible={showNewTicketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Helpdesk Ticket</Text>
              <TouchableOpacity onPress={() => setShowNewTicketModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.label}>Ticket Title</Text>
              <TextInput
                placeholder="e.g. Broken corridor lamp"
                value={ticketTitle}
                onChangeText={setTicketTitle}
                style={styles.textInput}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {["Plumbing", "Electrical", "Security", "Others"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, ticketCategory === cat && styles.categoryBtnActive]}
                    onPress={() => setTicketCategory(cat)}
                  >
                    <Text style={[styles.categoryBtnText, ticketCategory === cat && styles.categoryBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Describe the issue in detail..."
                value={ticketDescription}
                onChangeText={setTicketDescription}
                multiline
                numberOfLines={4}
                style={[styles.textInput, { height: 100, textAlignVertical: "top" }]}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket}>
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: 32,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
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
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 100,
    gap: theme.spacing.lg,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  newTicketText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  sectionSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
  },
  noticeList: {
    gap: theme.spacing.md,
    paddingBottom: 4,
  },
  noticeCard: {
    width: 280,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    borderRadius: 16,
    gap: 12,
    position: "relative",
  },
  urgentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.onErrorContainer,
    fontWeight: "700",
  },
  noticeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  noticeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  noticeDate: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
  },
  noticeTitle: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  noticeDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  noticeActionBtn: {
    width: "100%",
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  noticeActionText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  pollContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    borderRadius: 16,
    gap: 16,
    shadowColor: "rgba(15, 23, 42, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  activePollBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  activePollText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  pollQuestion: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  pollSubtext: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  votesCounterWrapper: {
    alignItems: "flex-end",
  },
  votesCount: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  votesLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  pollOptions: {
    gap: 10,
  },
  pollOptionBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  pollOptionBtnSelected: {
    borderColor: theme.colors.secondary,
  },
  pollFillBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "rgba(0, 106, 97, 0.08)",
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    zIndex: 2,
  },
  pollOptionText: {
    ...theme.typography.bodyLg,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  pollOptionTextSelected: {
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  pollPercentText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
  },
  pollFooterText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    textAlign: "center",
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
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  ticketIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  ticketInfo: {
    flex: 1,
    gap: 4,
  },
  ticketTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTitleText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  ticketBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusResolved: {
    backgroundColor: "rgba(0, 106, 97, 0.1)",
  },
  statusProgress: {
    backgroundColor: "rgba(19, 27, 46, 0.1)",
  },
  statusPending: {
    backgroundColor: "rgba(245, 127, 23, 0.1)",
  },
  ticketBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    fontWeight: "700",
  },
  textResolved: {
    color: theme.colors.secondary,
  },
  textProgress: {
    color: theme.colors.primary,
  },
  textPending: {
    color: "#f57f17",
  },
  ticketBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketAssigned: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  ticketTime: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
  },
  contactsList: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  contactItem: {
    alignItems: "center",
    gap: 8,
  },
  contactAvatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: 2,
  },
  contactAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  contactLabel: {
    ...theme.typography.labelMd,
    fontSize: 11,
    color: theme.colors.onSurface,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 40,
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
    maxHeight: "80%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    ...theme.typography.headlineLg,
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalForm: {
    gap: 16,
    paddingBottom: 40,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    ...theme.typography.bodyLg,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  categoryBtnActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: "rgba(0,106,97,0.05)",
  },
  categoryBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  categoryBtnTextActive: {
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
});
