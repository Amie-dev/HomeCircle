import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ImageBackground, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { usePassesHistory } from "../../../hooks/useRequestPasses";
import { supabase } from "../../../../utils/supabase";
import VisitorDetailModal from "../../../components/VisitorDetailModal";

export default function ResidentDashboard() {
  const router = useRouter();
  const { profile, clearProfile } = useProfileStore();

  // Fetch passes history to count active/pending and display recent activity
  const { data: historyList = [], isLoading } = usePassesHistory(profile?.id);

  // Live pending count
  const pendingPasses = historyList.filter(pass => pass.status === "Pending");
  const activeCount = pendingPasses.length;

  const [duesAmount, setDuesAmount] = useState(0);
  const [noticesCount, setNoticesCount] = useState(0);
  const [guardsCount, setGuardsCount] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    if (!profile?.id || !profile?.societyId) return;

    const loadDashboardStats = async () => {
      try {
        // 1. Get flat_id for the resident
        const { data: memberData } = await supabase
          .from("societymembers")
          .select("flat_id")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (memberData?.flat_id) {
          // Query pending dues
          const { data: invoices } = await supabase
            .from("maintenance_invoices")
            .select("amount")
            .eq("flat_id", memberData.flat_id)
            .eq("status", "Pending");

          if (invoices) {
            const sum = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
            setDuesAmount(sum);
          }
        }

        // 2. Query notices count
        const { count: notices } = await supabase
          .from("notices")
          .select("*", { count: "exact", head: true })
          .eq("society_id", profile.societyId);

        setNoticesCount(notices || 0);

        // 3. Query active guards
        const { count: guards } = await supabase
          .from("guard_assignments")
          .select("*", { count: "exact", head: true });

        setGuardsCount(guards || 0);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    };

    loadDashboardStats();
  }, [profile?.id, profile?.societyId]);

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          router.replace("/get-started" as any);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRaiseComplaint = () => {
    router.push("/resident/(home)/complaint" as any);
  };

  const handleBookAmenity = () => {
    router.push("/resident/(home)/amenities" as any);
  };

  const handlePayDues = () => {
    router.push("/resident/(home)/dues" as any);
  };

  const handleActivityPress = (activity: any) => {
    if (!profile) return;
    try {
      if (activity.id.startsWith("act-")) {
        // Mock item fallback details mapping
        const typeMap: Record<string, any> = {
          "Zomato Delivery": "Delivery",
          "Guest: Rahul": "Guest",
          "Domestic Help": "Daily Help"
        };
        setSelectedLog({
          id: activity.id,
          name: activity.visitor_name,
          type: typeMap[activity.visitor_name] || "Guest",
          status: activity.status === "Approved" ? "Entered" : activity.status,
          icon: activity.icon,
          avatar: activity.avatar,
          vehicleNumber: "MH-12-HC-2024",
          entryTime: "12:45 PM",
          time: activity.time.includes(",") ? activity.time.split(",")[1].trim() : "12:45 PM",
          date: activity.time.includes(",") ? activity.time.split(",")[0].trim() : "Today",
          residentName: profile.fullName,
          residentFlat: `${profile.towerName || "Block C"}, Unit ${profile.flatName || "402"}`,
          unit: `${profile.towerName || "Block C"}, Unit ${profile.flatName || "402"}`,
          approvedByResident: "Resident Pre-Approved",
          guardName: "Vikram Singh",
          guardGate: "Main Gate No. 1",
        });
      } else {
        // Real DB item: Query pass details
        const pass = activity.rawPass;
        const typeMap: Record<string, any> = {
          "Delivery": "Delivery",
          "Guest": "Guest",
          "Service": "Daily Help",
          "Cab": "Cab"
        };
        setSelectedLog({
          id: pass.id,
          name: pass.visitor_name,
          type: typeMap[pass.designation] || "Guest",
          status: pass.status === "Verified" ? "Entered" : pass.status,
          icon: pass.designation === "Delivery" ? "delivery-dining" : pass.designation === "Service" ? "cleaning-services" : "person",
          avatar: null,
          vehicleNumber: pass.vehicle_number || "N/A",
          entryTime: new Date(pass.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          time: new Date(pass.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          date: new Date(pass.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
          residentName: pass.resident_details?.fullName || profile.fullName,
          residentFlat: `${pass.resident_details?.towerName || ""}, Unit ${pass.resident_details?.flatName || ""}`,
          unit: `${pass.resident_details?.towerName || ""}, Unit ${pass.resident_details?.flatName || ""}`,
          approvedByResident: "Resident Pre-Approved",
          guardName: pass.verified_by || "Main Gate Guard",
          guardGate: "Main Security Gate",
        });
      }
      setShowDetailModal(true);
    } catch (err) {
      console.warn("Failed to load activity details:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Entered":
        return { bg: "rgba(0, 106, 97, 0.1)", text: theme.colors.secondary };
      case "Exited":
        return { bg: "rgba(118, 119, 125, 0.1)", text: theme.colors.outline };
      case "Pending":
      default:
        return { bg: "rgba(245, 127, 23, 0.1)", text: "#f57f17" };
    }
  };

  if (!profile) return null;

  // Mock list for fallback
  const mockRecentActivity = [
    {
      id: "act-1",
      visitor_name: "Zomato Delivery",
      time: "Today, 12:45 PM",
      status: "Approved",
      icon: "delivery-dining",
      avatar: null,
    },
    {
      id: "act-2",
      visitor_name: "Guest: Rahul",
      time: "Today, 10:15 AM",
      status: "Entered",
      icon: "person",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9waEMY4zh3JrY85yMTtWEar_kH0S7lHmaAMJTrxFW6-kefJbT_bA1pzMj_1dxfiP0CCcM22iQCL5heV19VBozlTw9xpKMaG1fUEqhaCjcD-aLm_tLu0XC21HBi97jmFCuO-G-KKDmNiAFaaITDjlR0xDOAXZv9lDcwXtpyohZbKSAHOqXFHDn179n8N8fOVIH4pqd1slJbNMmujtBm217fI-R514fjdFxl0mA4hR7o47wmd53-ehsmQ",
    },
    {
      id: "act-3",
      visitor_name: "Domestic Help",
      time: "Yesterday, 09:00 AM",
      status: "Exited",
      icon: "cleaning-services",
      avatar: null,
    }
  ];

  // Merge or show mock activities to match layout copy
  const activitiesToDisplay = historyList.length > 0 
    ? historyList.slice(0, 3).map(pass => ({
        id: pass.id,
        visitor_name: pass.visitor_name,
        time: new Date(pass.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + ", " + new Date(pass.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        status: pass.status === "Verified" ? "Entered" : pass.status,
        icon: pass.designation.toLowerCase().includes("delivery") ? "delivery-dining" : pass.designation.toLowerCase().includes("service") ? "cleaning-services" : "person",
        avatar: null,
        rawPass: pass,
      }))
    : mockRecentActivity;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>HomeCircle</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatarWrapper} onPress={handleSignOut}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMNCD6Y7hL6sQ3JxSuK02cR_fT3x_mEk-XGF4tF4duKYHvXwUg8gwt4V-Tghbu6Z8-fu7m4peAAhQRMdUWIs2kYviS4xEeaIumADu0UtHl66ojO9VJFgEmIysApNIspZOTlfL5EhW7dOfi1_T8lHZPVQR37kYgacI95uqfW7mmWC6JeFbGouv8DzVVnT3gN6SaFPtQDeOnj0aw-SJ4SimuOUx_CbZyk9IDEyU5QdqX3iakWZGdN1QECQ" }}
            style={styles.profileAvatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hello, {profile.fullName}</Text>
          <Text style={styles.unitText}>
            {profile.towerName || "Block C"}, Unit {profile.flatName || "402"} • {profile.isVerified ? "Verified" : "Pending"}
          </Text>
        </View>

        {/* Hero Status Cards - Bento Style */}
        <View style={styles.bentoContainer}>
          {/* Active Visitors Card */}
          <TouchableOpacity 
            style={styles.activeVisitorsCard}
            onPress={() => router.push("/resident/visitors" as any)}
          >
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardLabelText}>Active Visitors</Text>
                <Text style={styles.largeCardTitle}>
                  {activeCount} <Text style={styles.cardSubTitleText}>at gate</Text>
                </Text>
              </View>
              <MaterialIcons name="doorbell" size={28} color={theme.colors.secondaryContainer} />
            </View>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>Waiting for your approval</Text>
            </View>
          </TouchableOpacity>

          {/* Sub Bento Cards */}
          <View style={styles.bentoRow}>
            {/* Notices */}
            <TouchableOpacity 
              style={styles.halfCard}
              onPress={() => router.push("/resident/community" as any)}
            >
              <View style={[styles.miniIconWrapper, { backgroundColor: "rgba(0, 106, 97, 0.1)" }]}>
                <MaterialIcons name="notifications" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.halfCardLabel}>Notices</Text>
              <Text style={styles.halfCardValue}>{noticesCount} Active</Text>
            </TouchableOpacity>

            {/* Dues */}
            <TouchableOpacity style={styles.halfCard} onPress={handlePayDues}>
              <View style={[styles.miniIconWrapper, { backgroundColor: "rgba(186, 26, 26, 0.1)" }]}>
                <MaterialIcons name="account-balance-wallet" size={20} color={theme.colors.error} />
              </View>
              <Text style={styles.halfCardLabel}>Dues</Text>
              <Text style={styles.halfCardValue}>₹{duesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabelText}>QUICK ACTIONS</Text>
        </View>
        <View style={styles.actionsGrid}>
          {/* Action 1 */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/resident/(home)/pre-approve" as any)}>
            <View style={styles.actionIconOuter}>
              <MaterialIcons name="person-add" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Pre-approve Guest</Text>
          </TouchableOpacity>

          {/* Action 2 */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleRaiseComplaint}>
            <View style={styles.actionIconOuter}>
              <MaterialIcons name="report-problem" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Raise Complaint</Text>
          </TouchableOpacity>

          {/* Action 3 */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleBookAmenity}>
            <View style={styles.actionIconOuter}>
              <MaterialIcons name="event-available" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Book Amenity</Text>
          </TouchableOpacity>

          {/* Action 4 */}
          <TouchableOpacity style={styles.actionBtn} onPress={handlePayDues}>
            <View style={styles.actionIconOuter}>
              <MaterialIcons name="payments" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Pay Dues</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityHeaderRow}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/resident/visitors" as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {activitiesToDisplay.map((item) => {
            const statusStyle = getStatusColor(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.activityCard}
                onPress={() => handleActivityPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.activityLeft}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.activityAvatar} />
                  ) : (
                    <View style={styles.activityIconBox}>
                      <MaterialIcons name={item.icon as any} size={22} color={theme.colors.onSurfaceVariant} />
                    </View>
                  )}
                  <View>
                    <Text style={styles.visitorName}>{item.visitor_name}</Text>
                    <Text style={styles.visitorTime}>{item.time}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Neighborhood/Security Status Card */}
        <View style={styles.neighborhoodCard}>
          <ImageBackground
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuADACFev9f_46HnQeRKOVOeBrE7S0MeLWN3CjERGibzMqgM3VJmqjRofu4cEAqogXN4_lZLtJ5u88DC04pglx8nbcgwmuAlzHO6kGYLN8NUrJOEpfUD4my1fmKKxDTVSbdJVpif8ejQmkM2SP6lYawCtWnbaDb46y4NRuGcnoSsQbGktAf6Kwe-unnxfRi9j7DlX3Wr11ZRtgQxJ0R6rqDbra6tip-BuSpznXFxkqPg6Z7E1exCAJwSsw" }}
            style={styles.mapBg}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.mapOverlay}>
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>{guardsCount} Active Guards</Text>
              </View>
              <View>
                <Text style={styles.mapLabel}>Society Status</Text>
                <Text style={styles.mapStatusTitle}>All Systems Secure</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* FAB to Pre-approve Guest */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push("/resident/(home)/pre-approve" as any)}
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
  profileAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 100,
    gap: theme.spacing.lg,
  },
  welcomeSection: {
    marginBottom: 4,
  },
  welcomeText: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  unitText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  bentoContainer: {
    gap: theme.spacing.md,
  },
  activeVisitorsCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLabelText: {
    ...theme.typography.labelMd,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
  },
  largeCardTitle: {
    ...theme.typography.headlineXl,
    color: "#ffffff",
    marginTop: 4,
  },
  cardSubTitleText: {
    ...theme.typography.bodyMd,
    color: "rgba(255, 255, 255, 0.7)",
  },
  pulseContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondaryContainer,
  },
  pulseText: {
    ...theme.typography.bodyMd,
    color: "rgba(255, 255, 255, 0.8)",
  },
  bentoRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  halfCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.1)",
  },
  miniIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  halfCardLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  halfCardValue: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  sectionLabelText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  actionIconOuter: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 12,
  },
  activityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  recentActivityTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  viewAllText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
  },
  activityList: {
    gap: 8,
  },
  activityCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.1)",
    borderRadius: 16,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  visitorName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  visitorTime: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
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
  neighborhoodCard: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: theme.spacing.sm,
  },
  mapBg: {
    flex: 1,
    justifyContent: "flex-end",
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  mapBadge: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapBadgeText: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    fontSize: 11,
  },
  mapLabel: {
    ...theme.typography.labelMd,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
  },
  mapStatusTitle: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 2,
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
});
