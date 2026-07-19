import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function AdminSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, clearProfile } = useProfileStore();

  // Toggle states
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(false);
  const [emailReports, setEmailReports] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out from HomeCircle?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          router.replace("/get-started" as any);
        },
      },
    ]);
  };

  const handleOptionPress = (optionName: string) => {
    Alert.alert("Settings Option", `${optionName} pressed`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
            <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity onPress={() => handleOptionPress("Settings Config")}>
          <MaterialIcons name="settings" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSXTT1jY-7nYhxQiaGMgm4GkvvmFbNlAuyNe_MzrmegoD31f3MDv4B6hXzoRP6JOb0I1PdSwe1edErpsD9U06-AGdBhTxYS6T7dlops_tBDGs0hGsMSMNkjgFhwBZhcd-8cwha62-SP79ZbAAwhKUwBs8jR7q3Diqscyn1Id1ezY3k_NvdUcfJWGrPyuOcX2SZhkPUpL00HwLbEUhgWo2gi9B182D_cWSqOiIRkXy8lRPYVDA8Y2JwcA",
              }}
            />
            <TouchableOpacity style={styles.editAvatarButton} activeOpacity={0.8}>
              <MaterialIcons name="edit" size={16} color={theme.colors.onSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile?.fullName || "Ananya Sharma"}</Text>
          <View style={styles.roleContainer}>
            <MaterialIcons name="verified" size={16} color={theme.colors.secondary} />
            <Text style={styles.profileRole}>
              Admin • {profile?.societyName || "HomeCircle Society"}
            </Text>
          </View>
        </View>

        {/* Account Settings Group */}
        <View style={styles.groupSection}>
          <Text style={styles.groupTitle}>Account Settings</Text>
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Edit Profile")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="person-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Edit Profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Manage Household Members")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="people-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Manage Household Members</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Registered Vehicles")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="directions-car" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Registered Vehicles</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/admin/socities" as any)}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="business" size={22} color={theme.colors.onSurfaceVariant} />
                <View style={{ marginLeft: 0 }}>
                  <Text style={styles.optionText}>{profile?.societyName || "HomeCircle Society"}</Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                    Sector 15, Gurgaon
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Privacy Group */}
        <View style={styles.groupSection}>
          <Text style={styles.groupTitle}>Security & Privacy</Text>
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Change Password")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="lock-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Change Password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="fingerprint" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Biometric Login</Text>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondaryContainer }}
                thumbColor={biometricLogin ? theme.colors.secondary : theme.colors.surfaceContainerLowest}
              />
            </View>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomWidth: 0 }]}
              onPress={() => handleOptionPress("Privacy Settings")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="visibility-off" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Privacy Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Group */}
        <View style={styles.groupSection}>
          <Text style={styles.groupTitle}>Notifications</Text>
          <View style={styles.groupContainer}>
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="notifications-none" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondaryContainer }}
                thumbColor={pushNotifications ? theme.colors.secondary : theme.colors.surfaceContainerLowest}
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="chat-bubble-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>WhatsApp Updates</Text>
              </View>
              <Switch
                value={whatsappUpdates}
                onValueChange={setWhatsappUpdates}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondaryContainer }}
                thumbColor={whatsappUpdates ? theme.colors.secondary : theme.colors.surfaceContainerLowest}
              />
            </View>

            <View style={[styles.optionItem, { borderBottomWidth: 0 }]}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="mail-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Email Reports</Text>
              </View>
              <Switch
                value={emailReports}
                onValueChange={setEmailReports}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondaryContainer }}
                thumbColor={emailReports ? theme.colors.secondary : theme.colors.surfaceContainerLowest}
              />
            </View>
          </View>
        </View>

        {/* Support & Legal Group */}
        <View style={styles.groupSection}>
          <Text style={styles.groupTitle}>Support & Legal</Text>
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Help Center")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="help-outline" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Help Center</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOptionPress("Terms of Service")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="description" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Terms of Service</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomWidth: 0 }]}
              onPress={() => handleOptionPress("Privacy Policy")}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons name="policy" size={22} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.optionText}>Privacy Policy</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
            <Text style={styles.logoutText}>Logout from HomeCircle</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 2.4.0 (Build 128)</Text>
        </View>
      </ScrollView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: 140,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  profileCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: theme.colors.secondaryContainer,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    padding: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.surfaceContainerLowest,
  },
  profileName: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 16,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  profileRole: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  groupSection: {
    marginBottom: theme.spacing.lg,
  },
  groupTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.rounded.lg,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.15)",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  logoutWrapper: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    alignItems: "center",
  },
  logoutButton: {
    width: "100%",
    backgroundColor: theme.colors.surfaceContainerHighest,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: theme.rounded.md,
    gap: 8,
  },
  logoutText: {
    ...theme.typography.button,
    color: theme.colors.error,
  },
  versionText: {
    ...theme.typography.bodyMd,
    fontSize: 11,
    color: theme.colors.outline,
    marginTop: 24,
  },
});
