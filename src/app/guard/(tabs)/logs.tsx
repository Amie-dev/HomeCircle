import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { sendPushNotification } from "../../../../utils/notificationService";
import { getPushToken } from "../../../../utils/pushToken";
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

  // Detailed Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [passLogs, setPassLogs] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [gateName, setGateName] = useState("Main Gate");
  const [isOnDuty, setIsOnDuty] = useState(false);

  // Sync push notification token on login/mount
  useEffect(() => {
    const syncPushToken = async () => {
      if (!profile?.id) return;
      try {
        const currentpushToken = await getPushToken();
        if (currentpushToken) {
          // 1. Fetch current notification token from users table
          const { data: userData, error } = await supabase
            .from("users")
            .select("notification_token")
            .eq("id", profile.id)
            .maybeSingle();

          if (error) throw error;

          // 2. If it differs or is missing, update it
          if (!userData || userData.notification_token !== currentpushToken) {
            console.log("Updating guard push notification token in DB to:", currentpushToken);
            const { error: updateError } = await supabase
              .from("users")
              .update({ notification_token: currentpushToken })
              .eq("id", profile.id);

            if (updateError) throw updateError;
          }
        }
      } catch (err: any) {
        console.warn("Failed to sync guard push token:", err.message);
      }
    };

    syncPushToken();
  }, [profile?.id]);

  const fetchLogs = async () => {
    if (!profile?.id) return;
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
            phone_number:visitor_phone,
            visitor_email,
            tower_no,
            flat_no,
            resident_details
          )
        `)
        .eq("logged_by", profile.id)
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

  const fetchPassStatus = async (passId: string) => {
    try {
      setLoadingDetails(true);
      const { data, error } = await supabase
        .from("visitor_logs")
        .select("id, action_type, created_at, gate_name")
        .eq("pass_id", passId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setPassLogs(data);
      }
    } catch (err: any) {
      console.error("Error fetching pass status:", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDetails = (log: any) => {
    setSelectedLog(log);
    setDetailsModalVisible(true);
    if (log.requestpasses?.id) {
      fetchPassStatus(log.requestpasses.id);
    }
  };

  const handleLogCheckout = async () => {
    if (!isOnDuty) {
      Alert.alert("Off Duty", "You must be on duty to record check-outs. Please start shift in Profile tab.");
      return;
    }
    const p = selectedLog?.requestpasses;
    if (!p || !profile?.id) return;

    setCheckoutProcessing(true);
    try {
      // 1. Insert Check-out log
      const { error: logErr } = await supabase
        .from("visitor_logs")
        .insert({
          pass_id: p.id,
          logged_by: profile.id,
          action_type: "Check-out",
          gate_name: gateName,
        });

      if (logErr) throw logErr;

      // Log to guardlogs
      if (profile.societyId) {
        try {
          await supabase.from("guardlogs").insert({
            guard_id: profile.id,
            society_id: profile.societyId,
            gate_name: gateName || "Main Gate",
            action_type: "Scan",
            details: {
              action: "Visitor Checkout",
              pass_id: p.id,
              visitor_name: p.visitor_name,
              designation: p.designation,
              type: "Check-out",
            },
          });
        } catch (logErr) {
          console.warn("Failed to write to guardlogs on checkout:", logErr);
        }
      }

      // 2. Fetch matched residents of the destination flat to notify them
      let residentList: any[] = [];
      try {
        if (profile.societyId) {
          const { data: towersData } = await supabase
            .from("towers")
            .select("id, name, tower_id")
            .eq("society_id", profile.societyId);

          let matchedTower = null;
          if (towersData) {
            matchedTower = towersData.find(
              (t) =>
                t.name?.toLowerCase() === p.tower_no?.toLowerCase() ||
                t.tower_id?.toLowerCase() === p.tower_no?.toLowerCase() ||
                t.name?.toLowerCase().includes(p.tower_no?.toLowerCase())
            );
          }

          if (matchedTower) {
            const { data: flatData } = await supabase
              .from("flats")
              .select("id")
              .eq("tower_id", matchedTower.id)
              .eq("flat_number", p.flat_no)
              .maybeSingle();

            if (flatData) {
              const { data: membersData } = await supabase
                .from("societymembers")
                .select("user_id")
                .eq("flat_id", flatData.id);

              if (membersData && membersData.length > 0) {
                const userIds = membersData.map((m) => m.user_id);
                const { data: usersData } = await supabase
                  .from("users")
                  .select("id, full_name, notification_token")
                  .in("id", userIds);

                if (usersData) {
                  residentList = await Promise.all(
                    usersData.map(async (u) => {
                      if (!u.notification_token) {
                        const { data: guestData } = await supabase
                          .from("guestusers")
                          .select("notification_token")
                          .eq("id", u.id)
                          .maybeSingle();
                        if (guestData?.notification_token) {
                          return { ...u, notification_token: guestData.notification_token };
                        }
                      }
                      return u;
                    })
                  );
                }
              }
            }
          }
        }
      } catch (smErr) {
        console.warn("Failed to retrieve residents for notification:", smErr);
      }

      // 3. Send notifications to residents
      for (const resident of residentList) {
        if (resident.notification_token) {
          try {
            await sendPushNotification({
              token: resident.notification_token,
              title: "Visitor Checked Out 🚪",
              body: `${p.visitor_name} has checked out and left the society.`,
              data: {
                screen: "/resident",
                url: "/resident",
              },
            });
          } catch (err) {
            console.warn(`Failed to send checkout notification to resident:`, err);
          }
        }

        try {
          await supabase
            .from("push_notifications")
            .insert({
              user_id: resident.id,
              title: "Visitor Checked Out 🚪",
              body: `${p.visitor_name} has checked out and left the society.`,
              screen: "/resident",
              status: "Sent",
            });
        } catch (dbNotifErr) {
          console.warn("Failed to log checkout push notification for resident:", dbNotifErr);
        }
      }

      // 4. Send checkout notification to guest
      try {
        const { data: guestData } = await supabase
          .from("guestusers")
          .select("id, notification_token")
          .eq("email", p.visitor_email)
          .maybeSingle();

        if (guestData) {
          if (guestData.notification_token) {
            try {
              await sendPushNotification({
                token: guestData.notification_token,
                title: "Pass Checked Out 👋",
                body: "You have successfully checked out of the society. Thank you!",
                data: {
                  screen: "/request-pass",
                  url: "/request-pass",
                },
              });
            } catch (err) {
              console.warn("Failed to send checkout notification to visitor:", err);
            }
          }

          try {
            await supabase
              .from("push_notifications")
              .insert({
                user_id: guestData.id,
                title: "Pass Checked Out 👋",
                body: "You have successfully checked out of the society. Thank you!",
                screen: "/request-pass",
                status: "Sent",
              });
          } catch (dbNotifErr) {
            console.warn("Failed to log checkout push notification for visitor:", dbNotifErr);
          }
        }
      } catch (guestNotifErr) {
        console.warn("Failed to notify guest of checkout:", guestNotifErr);
      }

      Alert.alert("Check-out Recorded", `${p.visitor_name} has been checked out successfully.`);
      fetchPassStatus(p.id);
      fetchLogs();
    } catch (err: any) {
      Alert.alert("Checkout Error", err.message || "Failed to record checkout.");
    } finally {
      setCheckoutProcessing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkDutyStatus = async () => {
        if (!profile?.id) return;
        try {
          const { data, error } = await supabase
            .from("guard_assignments")
            .select("gate_name")
            .eq("guard_id", profile.id)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            setIsOnDuty(true);
            setGateName(data.gate_name || "Main Gate");
          } else {
            setIsOnDuty(false);
          }
        } catch (err: any) {
          console.error("Error checking duty status in logs:", err.message);
        }
      };

      checkDutyStatus();
      if (profile?.societyId) {
        fetchLogs();
      }
    }, [profile?.id, profile?.societyId])
  );

  const filteredLogs = logs.filter((log) => {
    const p = log.requestpasses;
    const query = searchQuery.toLowerCase();
    const vehicleNumber = p?.resident_details?.vehicleNumber || p?.resident_details?.vehicleNo || "";
    return (
      p?.visitor_name?.toLowerCase().includes(query) ||
      p?.designation?.toLowerCase().includes(query) ||
      p?.tower_no?.toLowerCase().includes(query) ||
      p?.flat_no?.toLowerCase().includes(query) ||
      p?.phone_number?.toLowerCase().includes(query) ||
      vehicleNumber.toLowerCase().includes(query)
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
                  <TouchableOpacity
                    key={log.id}
                    style={styles.logCard}
                    onPress={() => handleOpenDetails(log)}
                    activeOpacity={0.7}
                  >
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
                        {(p?.resident_details?.vehicleNumber || p?.resident_details?.vehicleNo) && (
                          <Text style={styles.logVehicle}>
                            Vehicle: {p.resident_details.vehicleNumber || p.resident_details.vehicleNo}
                          </Text>
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
                  </TouchableOpacity>
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

      {/* Detailed Log Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
              {selectedLog && (
                <>
                  {/* Visitor Info Card */}
                  <View style={styles.detailCard}>
                    <Text style={styles.cardHeader}>VISITOR INFO</Text>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Name</Text>
                        <Text style={styles.detailValue}>{selectedLog.requestpasses?.visitor_name}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="phone" size={20} color={theme.colors.secondary} />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Phone Number</Text>
                        <Text style={styles.detailValue}>{selectedLog.requestpasses?.phone_number}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="email" size={20} color={theme.colors.secondary} />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedLog.requestpasses?.visitor_email || "N/A"}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialIcons name="label" size={20} color={theme.colors.secondary} />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Role / Purpose</Text>
                        <Text style={styles.detailValue}>{selectedLog.requestpasses?.designation}</Text>
                      </View>
                    </View>

                    {(selectedLog.requestpasses?.resident_details?.vehicleNumber || selectedLog.requestpasses?.resident_details?.vehicleNo) && (
                      <View style={styles.detailRow}>
                        <MaterialIcons name="directions-car" size={20} color={theme.colors.secondary} />
                        <View style={styles.detailTextCol}>
                          <Text style={styles.detailLabel}>Vehicle Number</Text>
                          <Text style={styles.detailValue}>
                            {selectedLog.requestpasses?.resident_details?.vehicleNumber || selectedLog.requestpasses?.resident_details?.vehicleNo}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <MaterialIcons name="meeting-room" size={20} color={theme.colors.secondary} />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Destination Unit</Text>
                        <Text style={styles.detailValue}>
                          Tower {selectedLog.requestpasses?.tower_no}, Flat {selectedLog.requestpasses?.flat_no}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status & History Card */}
                  <View style={styles.detailCard}>
                    <Text style={styles.cardHeader}>STATUS & LOGS</Text>

                    {loadingDetails ? (
                      <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 12 }} />
                    ) : (
                      (() => {
                        const checkoutLog = passLogs.find((l) => l.action_type === "Check-out");
                        const checkinLog = passLogs.find((l) => l.action_type === "Check-in") || selectedLog;
                        const isExited = !!checkoutLog;

                        return (
                          <View style={{ gap: 12 }}>
                            {/* Present/Exited status badge */}
                            <View style={[styles.statusBadge, isExited ? styles.exitedBadge : styles.presentBadge]}>
                              <MaterialIcons 
                                name={isExited ? "exit-to-app" : "run-circle"} 
                                size={16} 
                                color={isExited ? theme.colors.outline : "#006a61"} 
                              />
                              <Text style={[styles.statusBadgeText, isExited ? styles.exitedBadgeText : styles.presentBadgeText]}>
                                {isExited ? "Exited (Checked Out)" : "Present (Inside)"}
                              </Text>
                            </View>

                            {/* Check in time */}
                            <View style={styles.timelineRow}>
                              <View style={styles.timelinePointSuccess} />
                              <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Checked In</Text>
                                <Text style={styles.timelineTime}>
                                  {new Date(checkinLog.created_at).toLocaleDateString()} at{" "}
                                  {new Date(checkinLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={styles.timelineGate}>Gate: {checkinLog.gate_name || "Main Gate"}</Text>
                              </View>
                            </View>

                            {/* Check out time (if exited) */}
                            {isExited && (
                              <View style={styles.timelineRow}>
                                <View style={styles.timelinePointDefault} />
                                <View style={styles.timelineContent}>
                                  <Text style={styles.timelineTitle}>Checked Out</Text>
                                  <Text style={styles.timelineTime}>
                                    {new Date(checkoutLog.created_at).toLocaleDateString()} at{" "}
                                    {new Date(checkoutLog.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Text>
                                  <Text style={styles.timelineGate}>Gate: {checkoutLog.gate_name || "Main Gate"}</Text>
                                </View>
                              </View>
                            )}

                            {/* Log Checkout button (if present) */}
                            {!isExited && (
                              <View style={{ width: "100%" }}>
                                <TouchableOpacity
                                  style={[
                                    styles.checkoutBtn, 
                                    (checkoutProcessing || !isOnDuty) && { opacity: 0.7, backgroundColor: theme.colors.outline }
                                  ]}
                                  onPress={handleLogCheckout}
                                  disabled={checkoutProcessing || !isOnDuty}
                                  activeOpacity={0.8}
                                >
                                  {checkoutProcessing ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                  ) : (
                                    <>
                                      <MaterialIcons name="logout" size={18} color="#ffffff" />
                                      <Text style={styles.checkoutBtnText}>
                                        {isOnDuty ? "Log Check-out / Exit" : "On Duty Required"}
                                      </Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                                {!isOnDuty && (
                                  <Text style={{
                                    color: theme.colors.error,
                                    fontSize: 11,
                                    textAlign: "center",
                                    marginTop: 4,
                                    fontWeight: "600"
                                  }}>
                                    You must be on duty to record check-outs.
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })()
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.detailsModalActions}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailsModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  detailsScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  detailCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    ...theme.typography.labelMd,
    fontWeight: "700",
    color: theme.colors.outline,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    textTransform: "uppercase",
  },
  detailValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  presentBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.08)",
  },
  presentBadgeText: {
    color: "#006a61",
    fontWeight: "700",
  },
  exitedBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  exitedBadgeText: {
    color: theme.colors.outline,
    fontWeight: "700",
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    paddingLeft: 4,
  },
  timelinePointSuccess: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary,
    marginTop: 6,
  },
  timelinePointDefault: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.outline,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    ...theme.typography.bodyMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  timelineTime: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  timelineGate: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
    marginTop: 1,
  },
  checkoutBtn: {
    height: 44,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  checkoutBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontWeight: "700",
  },
  detailsModalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  closeBtn: {
    height: 48,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
