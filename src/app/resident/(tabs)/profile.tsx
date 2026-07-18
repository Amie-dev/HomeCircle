import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, clearProfile } = useProfileStore();

  // Settings State
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

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
    Alert.alert("Unit Balance", "Your unit balance is ₹0.00. No pending bills.");
  };

  const handleAddVehicle = () => {
    Alert.alert("Add Vehicle", "Enter vehicle registration details to link it to your unit.");
  };

  const handleEditHousehold = () => {
    Alert.alert("Household Members", "Manage registered household members and their gate access permissions.");
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
      <StatusBar style="light" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Profile</Text>
        </View>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA098LF-ol4LdsX4aMYY46Xpyu71H9xcix3GoFyZXiKQspJJxepMnLc1r6Lge9noBJl8KAsJ4DH8T7DPKrpB4T41zGKZTm5IAZbL1mv18PcWu7IyGiekKXnWmFsXv-axJwBWAwKYAN4d0d1mbnh-wmmhULG8f6Y7wts2ZYoTd6TMbWQ8YOKuc4fPABimzFvAt4yyj90zCslyVXnEOTuT1ofu5MBN8LVB0Lm9_Xf_nX2-30oi8OLIjbB8g" }}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Header Section */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPk_kYVr9OpeCYJwBjs8_7FuBa9vVhs3InYCga1MKp8euClaL8UDlCemjOq1ru8WlOc80-wsDZqa5sCWJsZ7zhDFYtj_85TJtoxxfwECGit2kZ3VE3_6pmDS44diLb64wAIlv1TMwfgfzJZ3T3Hcytw41J9wf2MJhL-s7nOfqJb1NpmlDNAjAMhcf8S_UTdJaWrYqM-5Lga-S25-iJjHBfqn4ZElEOZ5hvp2kfmkBkM9zVn1ao2jL3mQ" }}
              style={styles.largeAvatar}
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileMainInfo}>
            <Text style={styles.profileNameText}>Ananya Sharma</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.locationText}>Block C, Unit 402</Text>
            </View>
            <View style={styles.roleLabelWrapper}>
              <Text style={styles.roleLabelText}>Resident Owner</Text>
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
              <Text style={styles.bentoValueDark}>₹0.00</Text>
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
                <Text style={styles.unitRowTitle}>Household Members</Text>
              </View>
              <TouchableOpacity onPress={handleEditHousehold}>
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.householdAvatarsRow}>
              <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_9aIFP4Ag1JWi9wN2MkYh0G1nHLYMx7rl_RnZmrvd-N3r55AfDTWF2RvX_35cJu89FchflleelVa5JqZ1Jgp4Cj_si1PcZTCzo_V6uEvpYk2lnNyeygmRLsOUHD-1Ay_5wGU-racEvJS958SrN9UBTsJ6LK_NElJStPNdews6JNO29pV62C4Tl0WnoeYGWixM3XCPoEfAUbTr-lRaPyL7PY_ZUaol_KbKZFNeZajOekjR-CBBITqqIw" }} style={styles.memberAvatar} />
              <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHnhIKZm8p7UFbp-hpO_IsPs3SPZvM6OXC5j_lhHk8YRn1zu-AR_rWF5cqfmhGOkj_TTO6SqqM0mK_x7tmI7hL9Hrj_0qK-ui1oxSDkQ2VOFlxE7keD0Ylt4XLE2jqa-3PRZkd39W64wK7mAJ-5MZtANha2FGwZEM-DNA6-2C9aF6hQc8KpSnq4S6N3bx_umu6lbmFNgO4IESQEKG5vhqYCgxTIrkDy1CPFunYg0aZTnEg5Kkf_NAmnQ" }} style={[styles.memberAvatar, { marginLeft: -12 }]} />
              <View style={[styles.memberAvatarPlaceholder, { marginLeft: -12 }]}>
                <Text style={styles.placeholderText}>+2</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Registered Vehicles */}
            <View style={styles.unitRow}>
              <View style={styles.rowLeftHeader}>
                <MaterialIcons name="directions-car" size={22} color={theme.colors.secondary} />
                <Text style={styles.unitRowTitle}>Registered Vehicles</Text>
              </View>
              <TouchableOpacity onPress={handleAddVehicle}>
                <Text style={styles.actionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vehicleCard}>
              <View style={styles.vehicleDetails}>
                <View style={styles.vehicleIconWrapper}>
                  <MaterialIcons name="directions-car" size={20} color={theme.colors.secondary} />
                </View>
                <View>
                  <Text style={styles.vehicleName}>Tesla Model 3</Text>
                  <Text style={styles.vehicleNumber}>{profile.vehicleNumber || "MH-12-HC-2024"}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </View>
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
            <TouchableOpacity onPress={() => Alert.alert("Add Emergency Contact", "Request access to add custom emergency contact.")}>
              <Text style={styles.actionBtnText}>Add</Text>
            </TouchableOpacity>
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
});
