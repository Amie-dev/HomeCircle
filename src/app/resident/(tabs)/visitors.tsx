import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { sendPushNotification } from "../../../../utils/notificationService";
import { supabase } from "../../../../utils/supabase";
import { usePassesHistory } from "../../../hooks/useRequestPasses";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";
import VisitorDetailModal from "../../../components/VisitorDetailModal";

export default function VisitorsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<"approvals" | "history">("approvals");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const handleVisitorPress = (item: any) => {
    const isMock = item.id.startsWith("mock-") || item.id.startsWith("act-") || item.id.startsWith("res-");
    
    const typeMap: Record<string, any> = {
      "Delivery": "Delivery",
      "Guest": "Guest",
      "Service": "Daily Help",
      "Cab": "Cab"
    };

    if (isMock) {
      // Mapping mock items
      setSelectedLog({
        id: item.id,
        name: item.visitor_name,
        type: typeMap[item.designation] || "Guest",
        status: item.status === "Approved" ? "Entered" : item.status === "Pending" ? "Entered" : item.status,
        icon: item.designation === "Delivery" ? "delivery-dining" : item.designation === "Service" ? "cleaning-services" : "person",
        avatar: item.avatar || null,
        vehicleNumber: "MH-12-HC-2024",
        entryTime: "12:45 PM",
        time: "12:45 PM",
        date: "Today",
        residentName: profile?.fullName || "Resident",
        residentFlat: `${profile?.towerName || "Block C"}, Unit ${profile?.flatName || "402"}`,
        unit: `${profile?.towerName || "Block C"}, Unit ${profile?.flatName || "402"}`,
        approvedByResident: item.status === "Approved" ? "Resident Pre-Approved" : "Pending Approval",
        guardName: "Vikram Singh",
        guardGate: "Main Gate No. 1",
      });
    } else {
      // Mapping real database items (requestpasses format)
      setSelectedLog({
        id: item.id,
        name: item.visitor_name,
        type: typeMap[item.designation] || "Guest",
        status: item.status === "Verified" ? "Entered" : item.status === "Approved" ? "Entered" : item.status,
        icon: item.designation === "Delivery" ? "delivery-dining" : item.designation === "Service" ? "cleaning-services" : "person",
        avatar: null,
        vehicleNumber: item.visitor_phone || "N/A",
        entryTime: new Date(item.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        time: new Date(item.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        date: new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        residentName: item.resident_details?.fullName || profile?.fullName || "Resident",
        residentFlat: `${profile?.towerName || ""}, Unit ${profile?.flatName || ""}`,
        unit: `${profile?.towerName || ""}, Unit ${profile?.flatName || ""}`,
        approvedByResident: item.status === "Verified" ? "Resident Pre-Approved" : item.status === "Approved" ? "Resident Pre-Approved" : "Pending Approval",
        guardName: item.verified_by || "Main Gate Guard",
        guardGate: "Main Security Gate",
      });
    }
    setShowDetailModal(true);
  };

  // Spinning animation for the refresh button
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

  console.log("DEBUG [visitors.tsx] Render state:", {
    profileId: profile?.id,
    role: profile?.role,
    societyId: profile?.societyId,
    towerId: profile?.towerId,
    towerName: profile?.towerName,
    flatName: profile?.flatName,
  });

  // Fetch visitor history/live data
  const { data: historyList = [], isLoading, isFetching, refetch } = usePassesHistory(
    profile?.id,
    profile?.role,
    profile?.societyId,
    profile?.towerId,
    profile?.towerName,
    profile?.flatName,
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  console.log(
    "DEBUG [visitors.tsx] Passes history list count:",
    historyList.length,
    "isLoading:",
    isLoading,
  );

  // Subscribe to realtime updates for requestpasses table
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`realtime-visitor-passes-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requestpasses",
        },
        (payload) => {
          console.log("DEBUG Realtime visitor pass change received:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
    }, []),
  );

  // Spin icon while fetching (covers both initial load AND manual refresh)
  useEffect(() => {
    if (isFetching) {
      startSpin();
    } else {
      stopSpin();
    }
  }, [isFetching]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isFetching) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
    } finally {
      // React Query handles the loading state; reset our flag after a short delay
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  // Mutation to approve/reject passes
  const updatePassStatusMutation = useMutation({
    mutationFn: async ({
      passId,
      status,
      visitorEmail,
    }: {
      passId: string;
      status: "Approved" | "Rejected";
      visitorEmail: string;
    }) => {
      const { error } = await supabase
        .from("requestpasses")
        .update({ status })
        .eq("id", passId);

      if (error) throw error;

      const title =
        status === "Approved" ? "Pass Approved 🎟️" : "Pass Rejected ❌";
      const body =
        status === "Approved"
          ? "Your request to visit has been approved by the resident."
          : "Your request to visit was rejected by the resident.";
      const screen = "/request-pass";

      // Fetch the guest's push token from guestusers table using email
      try {
        const { data: guestData } = await supabase
          .from("guestusers")
          .select("id, notification_token")
          .eq("email", visitorEmail)
          .maybeSingle();
        console.log("visitortsx line 115", { guestData });
        if (guestData) {
          if (guestData.notification_token) {
            await sendPushNotification({
              token: guestData.notification_token,
              title,
              body,
              data: {
                screen,
                url: screen,
              },
            });
          }

          // Notify the guest in push_notifications table
          await supabase.from("push_notifications").insert({
            user_id: guestData.id,
            title,
            body,
            screen,
            status: "Sent",
          });
        }
      } catch (pushErr) {
        console.warn("Failed to send push notification to guest:", pushErr);
      }
    },
    onSuccess: (_, variables) => {
      Alert.alert(
        "Success",
        `Visitor pass has been ${variables.status.toLowerCase()}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Error",
        err.message || "Failed to update visitor pass status.",
      );
    },
  });

  const handleAction = (
    passId: string,
    status: "Approved" | "Rejected",
    visitorEmail: string,
  ) => {
    updatePassStatusMutation.mutate({ passId, status, visitorEmail });
  };

  const getVisitorIcon = (designation: string) => {
    const desc = designation.toLowerCase();
    if (
      desc.includes("delivery") ||
      desc.includes("zomato") ||
      desc.includes("swiggy")
    ) {
      return "delivery-dining";
    }
    if (
      desc.includes("service") ||
      desc.includes("plumb") ||
      desc.includes("electr") ||
      desc.includes("clean")
    ) {
      return "cleaning-services";
    }
    return "person";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return { bg: "rgba(0, 106, 97, 0.1)", text: theme.colors.secondary };
      case "Verified":
        return { bg: "rgba(46, 125, 50, 0.1)", text: "#2e7d32" };
      case "Rejected":
        return { bg: "rgba(186, 26, 26, 0.1)", text: theme.colors.error };
      case "Pending":
      default:
        return { bg: "rgba(245, 127, 23, 0.1)", text: "#f57f17" };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch {
      return "Today";
    }
  };

  if (!profile) return null;

  // Filter lists from DB
  const pendingPasses = historyList.filter((pass) => pass.status === "Pending");
  const upcomingGuests = historyList.filter(
    (pass) =>
      pass.status === "Approved" && new Date(pass.expiry_time) > new Date(),
  );
  const verifiedVisitors = historyList.filter(
    (pass) => pass.status === "Verified",
  );

  // Visual mock data matching HTML exactly
  const mockPendingPasses = [
    {
      id: "mock-p-1",
      visitor_name: "Ramesh Kumar",
      designation: "Swiggy • Delivery",
      flat_no: profile.flatName || "B-402",
      tower_no: profile.towerName || "Block C",
      gate: "Main Gate",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAqSOxGh9UnEt7aRX29od_iWb77r1fVoLYW1UStb52IaY8dhmJAYCxCS_lVMyVAdfVgWHx6u1ZcWsNDhYCbFgA44rGbrKsFXZ-qOupEsBbU8eRV0CQgT5JtGsg-V76Wb9lgFfdmBb6bB0krN7GEnFgc7PE9ST3Ta28IBV94w6cze0RrrRb2jPb5BiGZ3jNlz4WVaGd-zpiyFsEp99mhgfofmtg-PtHbP9vc0ST3cUCfAK240OoHOeqPkw",
    },
  ];

  const mockUpcomingGuests = [
    {
      id: "mock-u-1",
      visitor_name: "Ananya Sharma",
      designation: "Personal",
      valid_until: "Today, 9:00 PM",
    },
    {
      id: "mock-u-2",
      visitor_name: "UrbanCompany: Plumber",
      designation: "Service",
      valid_until: "Tom, 2:00 PM",
    },
  ];

  const displayPending = pendingPasses;
  const displayUpcoming = upcomingGuests;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />

      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons
              name="grid-view"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Visitors</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={isFetching || isRefreshing}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
            <MaterialIcons
              name="refresh"
              size={22}
              color={(isFetching || isRefreshing) ? theme.colors.secondary : theme.colors.primary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {profile.societyId === "mock-soc-1" && (
          <View style={styles.mockBanner}>
            <MaterialIcons
              name="warning"
              size={16}
              color={theme.colors.error}
            />
            <Text style={styles.mockBannerText}>
              Offline Mock Mode. Please log out and register online to receive
              live visitor requests.
            </Text>
          </View>
        )}
        {/* Custom Tab Switcher inside ScrollView */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "approvals" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("approvals")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "approvals" && styles.tabTextActive,
              ]}
            >
              Approvals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "history" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.tabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "approvals" ? (
          <View style={styles.sectionContainer}>
            {/* Pending Requests Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>
                  {pendingPasses.length} New
                </Text>
              </View>
            </View>

            {displayPending.length > 0 ? (
              displayPending.map((item: any) => {
                const isMock = item.id.startsWith("mock-");
                return (
                  <View key={item.id} style={styles.pendingCard}>
                    <TouchableOpacity onPress={() => handleVisitorPress(item)} activeOpacity={0.7} style={styles.pendingDetailsRow}>
                      <Image
                        source={{
                          uri:
                            item.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(item.visitor_name)}&background=random&color=fff`,
                        }}
                        style={styles.visitorAvatar}
                      />
                      <View style={styles.pendingInfo}>
                        <Text style={styles.visitorNameText}>
                          {item.visitor_name}
                        </Text>
                        <View style={styles.designationRow}>
                          <MaterialIcons
                            name={getVisitorIcon(item.designation)}
                            size={14}
                            color={theme.colors.secondary}
                          />
                          <Text style={styles.designationText}>
                            {item.designation}
                          </Text>
                        </View>
                        <Text style={styles.flatText}>
                          Flat: {item.tower_no || "B"}-{item.flat_no || "402"}
                        </Text>
                      </View>
                      <View style={styles.gateWrapper}>
                        <Text style={styles.gateLabel}>Waiting at</Text>
                        <Text style={styles.gateText}>
                          {item.gate || "Main Gate"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.actionButtonRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        disabled={updatePassStatusMutation.isPending}
                        onPress={() => {
                          if (isMock) {
                            Alert.alert(
                              "Action Mocked",
                              "Rejected visitor via mock demo!",
                            );
                          } else {
                            handleAction(
                              item.id,
                              "Rejected",
                              item.visitor_email,
                            );
                          }
                        }}
                      >
                        <MaterialIcons
                          name="close"
                          size={16}
                          color={theme.colors.error}
                        />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        disabled={updatePassStatusMutation.isPending}
                        onPress={() => {
                          if (isMock) {
                            Alert.alert(
                              "Action Mocked",
                              "Approved visitor via mock demo!",
                            );
                          } else {
                            handleAction(
                              item.id,
                              "Approved",
                              item.visitor_email,
                            );
                          }
                        }}
                      >
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyPendingCard}>
                <MaterialIcons
                  name="doorbell"
                  size={32}
                  color={theme.colors.outline}
                />
                <Text style={styles.emptyPendingText}>
                  No pending requests at the gate.
                </Text>
              </View>
            )}

            {/* Upcoming Guests */}
            <Text
              style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}
            >
              Upcoming Guests
            </Text>
            {displayUpcoming.length > 0 ? (
              <View style={styles.upcomingList}>
                {displayUpcoming.map((item: any) => {
                  const isMock = item.id.startsWith("mock-");
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.upcomingCard}
                      onPress={() => handleVisitorPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.upcomingLeft}>
                        <View
                          style={[
                            styles.upcomingIconBox,
                            {
                              backgroundColor:
                                item.designation === "Service"
                                  ? "rgba(213,227,253,0.3)"
                                  : "rgba(134,242,228,0.2)",
                            },
                          ]}
                        >
                          <MaterialIcons
                            name={
                              item.designation === "Service"
                                ? "handyman"
                                : "person"
                            }
                            size={20}
                            color={
                              item.designation === "Service"
                                ? theme.colors.outline
                                : theme.colors.secondary
                            }
                          />
                        </View>
                        <View>
                          <Text style={styles.upcomingNameText}>
                            {item.visitor_name}
                          </Text>
                          <Text style={styles.upcomingDescText}>
                            Visitor Type: {item.designation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.upcomingRight}>
                        <Text style={styles.validLabel}>Valid Until</Text>
                        <Text style={styles.validTime}>
                          {isMock
                            ? item.valid_until
                            : formatTime(item.expiry_time)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPendingCard}>
                <MaterialIcons
                  name="event-available"
                  size={32}
                  color={theme.colors.outline}
                />
                <Text style={styles.emptyPendingText}>
                  No upcoming scheduled visitors.
                </Text>
              </View>
            )}

            {/* Visitors Inside */}
            <Text
              style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}
            >
              Active Visitors (Inside)
            </Text>
            {verifiedVisitors.length > 0 ? (
              <View style={styles.upcomingList}>
                {verifiedVisitors.map((item: any) => {
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.upcomingCard,
                        { borderColor: "#2e7d32", borderWidth: 1 },
                      ]}
                    >
                      <View style={styles.upcomingLeft}>
                        <View
                          style={[
                            styles.upcomingIconBox,
                            { backgroundColor: "rgba(46, 125, 50, 0.1)" },
                          ]}
                        >
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#2e7d32"
                          />
                        </View>
                        <View>
                          <Text style={styles.upcomingNameText}>
                            {item.visitor_name}
                          </Text>
                          <Text style={styles.upcomingDescText}>
                            {item.designation} • Inside Society
                          </Text>
                        </View>
                      </View>
                      <View style={styles.upcomingRight}>
                        <Text style={[styles.validLabel, { color: "#2e7d32" }]}>
                          Checked In At
                        </Text>
                        <Text style={styles.validTime}>
                          {formatTime(item.verified_at || item.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyPendingCard}>
                <MaterialIcons
                  name="home"
                  size={32}
                  color={theme.colors.outline}
                />
                <Text style={styles.emptyPendingText}>
                  No active visitors inside your unit.
                </Text>
              </View>
            )}
            <View style={styles.bannerCard}>
              <ImageBackground
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDRxlvqhh6kUzegIEZ4Rqg5Rr-aEY7Sli6EslMQZHaceiGmGGIIqODqnfjr5PyytQKkUwf1QI_lbVpIxhX1r_MgJ8Mthu9CaQ4YanEQs-YNYmSZrqmp028mB0pBcWiqAJV5CQFVdeTKMFnBbdP_eYh9vWsIOuU7v1M_KogjB5kI5E5E7KlrMJzqjjJ160B8M9Zya9uLZ4vAz2tbpeyTQLTBECRvNhgwwSCYi3gWDrrvwaOC0U7F0ZqwA",
                }}
                style={styles.bannerBg}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>Safety First</Text>
                  <Text style={styles.bannerText}>
                    Monitor all entries in real-time for ultimate peace of mind.
                  </Text>
                </View>
              </ImageBackground>
            </View>
          </View>
        ) : (
          <View style={styles.historyList}>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.secondary}
                style={{ marginVertical: 32 }}
              />
            ) : historyList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons
                  name="history"
                  size={48}
                  color={theme.colors.outlineVariant}
                />
                <Text style={styles.emptyTitle}>No Visitor History</Text>
                <Text style={styles.emptyText}>
                  Visitor passes you generate will show up here.
                </Text>
              </View>
            ) : (
              historyList.map((item) => {
                const statusColor = getStatusColor(item.status);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyCard}
                    onPress={() => handleVisitorPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.historyIconWrapper}>
                        <MaterialIcons
                          name={getVisitorIcon(item.designation)}
                          size={22}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                      <View>
                        <Text style={styles.historyName}>
                          {item.visitor_name}
                        </Text>
                        <Text style={styles.historyDetails}>
                          {item.designation} • {formatTime(item.created_at)}
                        </Text>
                        <Text style={styles.historyDestination}>
                          Destination: Tower {item.tower_no}, Flat{" "}
                          {item.flat_no}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: statusColor.text },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/request-pass" as any)}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      <VisitorDetailModal
        visible={showDetailModal}
        selectedLog={selectedLog}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        onToggleStatus={() => {
          Alert.alert("Access Denied", "Only security guards can check-in/out visitors.");
        }}
      />
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 100,
  },
  sectionContainer: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  errorBadge: {
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  errorBadgeText: {
    ...theme.typography.labelMd,
    color: theme.colors.onErrorContainer,
    fontSize: 10,
    fontWeight: "700",
  },
  pendingCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    gap: 16,
    shadowColor: "rgba(15, 23, 42, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  pendingDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  visitorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  pendingInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    gap: 2,
  },
  visitorNameText: {
    ...theme.typography.headlineMd,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  designationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  designationText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  flatText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  gateWrapper: {
    alignItems: "flex-end",
  },
  gateLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  gateText: {
    ...theme.typography.headlineMd,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  rejectBtnText: {
    ...theme.typography.button,
    color: theme.colors.error,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  upcomingList: {
    gap: 12,
  },
  upcomingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
  },
  upcomingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  upcomingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingNameText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  upcomingDescText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  upcomingRight: {
    alignItems: "flex-end",
  },
  validLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  validTime: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  bannerCard: {
    height: 128,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
  },
  bannerBg: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(13, 28, 47, 0.75)",
    padding: 20,
    justifyContent: "center",
  },
  bannerTitle: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "700",
  },
  bannerText: {
    ...theme.typography.bodyMd,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    maxWidth: 240,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  historyIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  historyName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  historyDetails: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  historyDestination: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 12,
  },
  emptyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 20,
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
  emptyPendingCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 8,
  },
  emptyPendingText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
  },
  mockBanner: {
    backgroundColor: "rgba(186, 26, 26, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.3)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  mockBannerText: {
    fontSize: 12,
    color: theme.colors.error,
    flex: 1,
    fontWeight: "500",
  },
});
