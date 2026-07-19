import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, clearProfile } = useProfileStore();

  // Settings State
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Dynamic DB States
  const [duesAmount, setDuesAmount] = useState(0);
  const [household, setHousehold] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfileData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      // 1. Get flat_id to query dues
      const { data: memberData } = await supabase
        .from("societymembers")
        .select("flat_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (memberData?.flat_id) {
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

      // 2. Query household members
      const { data: householdData } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", profile.id);

      if (householdData) {
        setHousehold(householdData);
      }

      // 3. Query vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", profile.id);

      if (vehiclesData) {
        setVehicles(vehiclesData);
      }
    } catch (err) {
      console.error("Error loading profile DB data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchProfileData();
    }
  }, [profile?.id]);

  const handleLogout = async () => {
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

  const handlePayBills = () => {
    router.push("/resident/(home)/dues" as any);
  };

  const handleAddVehicle = () => {
    Alert.alert("Add Vehicle", "Enter vehicle details:", [
      {
        text: "Register Test Car",
        onPress: async () => {
          if (!profile?.id) return;
          try {
            const testNum = "MH-12-HC-" + Math.floor(1000 + Math.random() * 9000);
            const { error } = await supabase
              .from("vehicles")
              .insert({
                user_id: profile.id,
                vehicle_name: "BMW X5",
                vehicle_number: testNum,
                vehicle_type: "Four Wheeler",
              });

            if (error) throw error;
            Alert.alert("Success", `Vehicle registered: BMW X5 (${testNum})`);
            fetchProfileData();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to register vehicle.");
          }
        }
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleAddHousehold = () => {
    Alert.alert("Add Member", "Register household family member:", [
      {
        text: "Add Test Family Member",
        onPress: async () => {
          if (!profile?.id) return;
          try {
            const { error } = await supabase
              .from("household_members")
              .insert({
                user_id: profile.id,
                full_name: "Priya Sharma",
                phone: "+91 99998 88887",
                relationship: "Spouse",
              });

            if (error) throw error;
            Alert.alert("Success", "Registered प्रिया शर्मा as Spouse");
            fetchProfileData();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to add member.");
          }
        }
      },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert("Change Password", "A password reset link has been sent to your registered email address.");
  };

  const handleCallEmergency = () => {
    Alert.alert("Call Security", "Do you want to call Society Security (+91 99999 88888)?", [
      { text: "Call", onPress: () => Alert.alert("Dialing...", "Dialing Society Security...") },
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
          <Text style={styles.appBarTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchProfileData}>
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Header Section */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0D9488&color=fff&size=100` }}
              style={styles.largeAvatar}
            />
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.profileMainInfo}>
            <Text style={styles.profileNameText}>{profile.fullName}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.locationText}>
                {profile.towerName || "Block C"}, Unit {profile.flatName || "402"}
              </Text>
            </View>
            <View style={styles.roleLabelWrapper}>
              <Text style={styles.roleLabelText}>{profile.role || "Resident"}</Text>
            </View>
          </View>
        </View>

        {/* Bento Grid Info */}
        <View style={styles.bentoRow}>
          {/* Security Status */}
          <View style={styles.securityStatusCard}>
            <View style={styles.securityTextGroup}>
              <Text style={styles.bentoLabel}>Security Status</Text>
              <Text style={styles.bentoValue}>Safe</Text>
            </View>
            <View style={styles.securityStatusBadge}>
              <MaterialIcons name="check-circle" size={14} color={theme.colors.secondaryContainer} />
              <Text style={styles.securityStatusText}>All clear</Text>
            </View>
            <MaterialIcons name="shield" size={64} color="rgba(255,255,255,0.06)" style={styles.shieldBgIcon} />
          </View>

          {/* Unit Balance */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.bentoLabelDark}>Unit Balance</Text>
              <Text style={styles.bentoValueDark}>
                ₹{duesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity style={styles.payBillsBtn} onPress={handlePayBills}>
              <Text style={styles.payBillsText}>Pay Bills</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Unit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY UNIT</Text>
          <View style={styles.cardContainer}>
            {/* Household Members */}
            <View style={styles.unitRow}>
              <View style={styles.rowLeftHeader}>
                <MaterialIcons name="people" size={22} color={theme.colors.secondary} />
                <Text style={styles.unitRowTitle}>Household Members ({household.length})</Text>
              </View>
              <TouchableOpacity onPress={handleAddHousehold}>
                <Text style={styles.actionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {household.length > 0 ? (
              <View style={styles.householdList}>
                {household.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <Image
                      source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random&color=fff&size=40` }}
                      style={styles.memberAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.memberNameText}>{member.full_name}</Text>
                      <Text style={styles.memberRoleText}>{member.relationship} • {member.phone}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No registered household family members.</Text>
            )}

            <View style={styles.divider} />

            {/* Registered Vehicles */}
            <View style={styles.unitRow}>
              <View style={styles.rowLeftHeader}>
                <MaterialIcons name="directions-car" size={22} color={theme.colors.secondary} />
                <Text style={styles.unitRowTitle}>Registered Vehicles ({vehicles.length})</Text>
              </View>
              <TouchableOpacity onPress={handleAddVehicle}>
                <Text style={styles.actionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 ? (
              <View style={styles.vehiclesList}>
                {vehicles.map((v) => (
                  <View key={v.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleDetails}>
                      <View style={styles.vehicleIconWrapper}>
                        <MaterialIcons name="directions-car" size={20} color={theme.colors.secondary} />
                      </View>
                      <View>
                        <Text style={styles.vehicleName}>{v.vehicle_name}</Text>
                        <Text style={styles.vehicleNumber}>{v.vehicle_number}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="verified" size={20} color={theme.colors.secondary} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No registered vehicles.</Text>
            )}
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT SECURITY</Text>
          <View style={styles.cardContainer}>
            {/* Change Password */}
            <TouchableOpacity style={styles.menuRow} onPress={handleChangePassword}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(19, 27, 46, 0.05)" }]}>
                  <MaterialIcons name="lock-open" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Change Password</Text>
                  <Text style={styles.menuSubtitle}>Update your login credentials</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Biometric Login */}
            <View style={styles.menuRowNoTouch}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(19, 27, 46, 0.05)" }]}>
                  <MaterialIcons name="fingerprint" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Biometric Login</Text>
                  <Text style={styles.menuSubtitle}>Use FaceID or Fingerprint</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.cardContainer}>
            {/* Push Notifications */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="notifications" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            {/* WhatsApp Updates */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="chat" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>WhatsApp Updates</Text>
              </View>
              <Switch
                value={whatsappEnabled}
                onValueChange={setWhatsappEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            {/* Email Reports */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="mail" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>Email Reports</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>EMERGENCY CONTACTS</Text>
          </View>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.emergencyCard} onPress={handleCallEmergency}>
              <View style={styles.emergencyLeft}>
                <View style={styles.emergencyIconBox}>
                  <MaterialIcons name="call" size={20} color={theme.colors.error} />
                </View>
                <View>
                  <Text style={styles.emergencyTitle}>Society Security</Text>
                  <Text style={styles.emergencyPhone}>+91 99999 88888</Text>
                </View>
              </View>
              <MaterialIcons name="emergency" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.supportRow} onPress={() => Alert.alert("Help Center", "Opening help documentation...")}>
              <MaterialIcons name="help" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.supportRowText}>Help Center</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.supportRow} onPress={() => Alert.alert("Terms of Service", "Opening Terms & Privacy document...")}>
              <MaterialIcons name="description" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.supportRowText}>Terms of Service</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.supportRow} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={theme.colors.error} />
              <Text style={[styles.supportRowText, { color: theme.colors.error, fontWeight: "600" }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>
          HomeCircle v2.4.0 • Built with Trust
        </Text>
      </ScrollView>
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },
  profileHeaderCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "rgba(15, 23, 42, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: "relative",
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileMainInfo: {
    marginLeft: 16,
    flex: 1,
    gap: 4,
  },
  profileNameText: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  roleLabelWrapper: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,106,97,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  roleLabelText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  bentoRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  securityStatusCard: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: theme.spacing.md,
    height: 128,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  securityTextGroup: {
    zIndex: 2,
  },
  bentoLabel: {
    ...theme.typography.labelMd,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bentoValue: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    marginTop: 4,
  },
  securityStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 2,
  },
  securityStatusText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondaryContainer,
  },
  shieldBgIcon: {
    position: "absolute",
    right: -12,
    bottom: -12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: theme.spacing.md,
    height: 128,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  bentoLabelDark: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  bentoValueDark: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginTop: 4,
  },
  payBillsBtn: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,106,97,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  payBillsText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  unitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  rowLeftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unitRowTitle: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  actionBtnText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  householdAvatarsRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(198, 198, 205, 0.2)",
  },
  vehicleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
  },
  vehicleDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vehicleName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  vehicleNumber: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  menuRowNoTouch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    fontWeight: "500",
  },
  menuSubtitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  notificationToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  notifLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  emergencyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: "rgba(186, 26, 26, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)",
    borderRadius: 12,
    margin: theme.spacing.md,
  },
  emergencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emergencyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  emergencyPhone: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: theme.spacing.md,
  },
  supportRowText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
  },
  versionText: {
    ...theme.typography.labelMd,
    color: theme.colors.outlineVariant,
    textAlign: "center",
    paddingVertical: 16,
  },
  householdList: {
    padding: theme.spacing.md,
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 8,
  },
  memberNameText: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  memberRoleText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  vehiclesList: {
    padding: theme.spacing.md,
    gap: 10,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    padding: theme.spacing.md,
    textAlign: "center",
  },
});
