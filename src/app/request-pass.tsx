import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useCreatePass,
  usePassesHistory,
  useRegisterProfile,
} from "../hooks/useRequestPasses";
import { useGuestProfileStore } from "../store/useGuestProfileStore";
import { useProfileStore } from "../store/useProfileStore";
import { theme } from "../theme";

// Extracted Modular Components
import { getExpoPushToken } from "../../utils/getExpoPushToken";
import { supabase } from "../../utils/supabase";
import { PassHistoryList } from "../components/request-pass/PassHistoryList";
import { PassRequestForm } from "../components/request-pass/PassRequestForm";
import { ProfileCard } from "../components/request-pass/ProfileCard";
import { ProfileRegModal } from "../components/request-pass/ProfileRegModal";
import { ScreenHeader } from "../components/request-pass/ScreenHeader";

export default function RequestPassScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"request" | "history">("request");

  // Zustand Stores
  const { profile, isLoadingProfile, loadProfile } = useProfileStore();
  const { guestProfile, isLoadingGuest, loadGuestProfile } =
    useGuestProfileStore();
  const [showRegModal, setShowRegModal] = useState<boolean>(false);

  const activeProfile = profile || guestProfile;

  // React Query Hooks
  const { data: historyList = [] } = usePassesHistory(activeProfile?.id);
  // console.log("DEBUG: Current Profile ID:", activeProfile?.id);
  // console.log("DEBUG: Fetched Passes Count:", historyList.length, "passes");
  const createPass = useCreatePass();
  const registerProfile = useRegisterProfile();

  useEffect(() => {
    loadProfile();
    loadGuestProfile();
  }, []);

  useEffect(() => {
    if (!isLoadingProfile && !isLoadingGuest && !profile && !guestProfile) {
      setShowRegModal(true);
    }
  }, [isLoadingProfile, isLoadingGuest, profile, guestProfile]);

  const handleSaveProfile = async (data: {
    fullName: string;
    email: string;
    phone: string;
    vehicleNumber: string;
  }) => {
    if (!data.fullName || !data.email || !data.phone) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name, Email, Phone).",
      );
      return;
    }
    // console.log(
    //   "request-pass.tsx: Checking guest notification token status for email:",
    //   data.email,
    // );
    const { data: guestData } = await supabase
      .from("guestusers")
      .select("id, notification_token")
      .eq("email", data.email)
      .maybeSingle();
    // console.log("request-pass.tsx: guestData result:", guestData);

    // console.log("request-pass.tsx: Fetching current Expo push token...");
    const currentToken = await getExpoPushToken();
    // console.log("request-pass.tsx: Fetched Expo token:", currentToken);

    let resolvedToken: string | undefined =
      guestData?.notification_token || currentToken || undefined;

    if (currentToken) {
      // console.log(
      //   "request-pass.tsx: Inserting token in notifications table:",
      //   currentToken,
      // );
      // Save in notifications table (ignore unique constraint duplicates)
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert({ token: currentToken });
      if (insertErr && insertErr.code !== "23505") {
        // console.warn(
        //   "request-pass.tsx: Error inserting token:",
        //   insertErr.message,
        // );
      }

      resolvedToken = currentToken;

      if (guestData) {
        if (guestData.notification_token !== currentToken) {
          // console.log(
          //   "request-pass.tsx: Updating existing guest profile notification_token in database...",
          // );
          const { error: updateErr } = await supabase
            .from("guestusers")
            .update({
              notification_token: currentToken,
            })
            .eq("id", guestData.id);

          if (updateErr) {
            // console.error(
            //   "request-pass.tsx: Error updating guestusers notification_token:",
            //   updateErr.message,
            // );
          } else {
            // console.log(
            //   "request-pass.tsx: Successfully updated guestusers notification_token for id:",
            //   guestData.id,
            // );
          }
        } else {
          // console.log(
          //   "request-pass.tsx: Token in database already matches current Expo token.",
          // );
        }
      }
    }
    registerProfile.mutate(
      {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        vehicle_number: data.vehicleNumber || null,
        notification_token: resolvedToken,
      },
      {
        onSuccess: (savedProfile) => {
          // console.log(
          //   "request-pass.tsx: Successfully registered/loaded guest profile:",
          //   savedProfile,
          // );
          setShowRegModal(false);
        },
        onError: (err: any) => {
          // console.error(
          //   "request-pass.tsx: Failed to register guest profile. Error:",
          //   err,
          // );
          Alert.alert(
            "Error saving profile",
            err.message || "Please try again.",
          );
        },
      },
    );
  };

  const handleRequestPass = (formData: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    visitorDesignation: string;
    towerNo: string;
    flatNo: string;
    expiryHours: number;
    afterScanExpiry: string;
    societyId?: string;
    societyName?: string;
    towerId?: string;
    flatId?: string;
  }) => {
    if (!activeProfile) {
      setShowRegModal(true);
      return;
    }

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + formData.expiryHours);
    const initialStatus = profile ? "Approved" : "Pending";

    createPass.mutate(
      {
        passData: {
          user_id: activeProfile.id,
          visitor_name: formData.visitorName,
          visitor_email: formData.visitorEmail,
          visitor_phone: formData.visitorPhone,
          designation: formData.visitorDesignation,
          tower_no: formData.towerNo,
          flat_no: formData.flatNo,
          status: initialStatus,
          expiry_hours: formData.expiryHours,
          expiry_time: expiryDate.toISOString(),
          after_scan_qr_expiry: formData.afterScanExpiry,
          resident_details: {
            fullName: activeProfile.fullName,
            email: activeProfile.email,
            phone: activeProfile.phone,
            societyId: formData.societyId,
            societyName: formData.societyName,
          },
        },
        flatId: formData.flatId,
      },
      {
        onSuccess: (newPass) => {
          // console.log({
          //   newPass,
          // });
          Alert.alert(
            initialStatus === "Approved"
              ? "Pass Approved"
              : "Access Request Sent",
            initialStatus === "Approved"
              ? `Pass generated successfully for ${newPass.visitor_name}.\nDestination: Greenwood Heights, Tower ${newPass.tower_no}, Flat ${newPass.flat_no}`
              : `Your request to visit Tower ${newPass.tower_no}, Flat ${newPass.flat_no} has been sent to the resident for approval.`,
            [
              {
                text: "View History",
                onPress: () => setActiveTab("history"),
              },
            ],
          );
        },
        onError: (err: any) => {
          Alert.alert(
            "Error requesting pass",
            err.message || "Please try again.",
          );
        },
      },
    );
  };

  if (isLoadingProfile || isLoadingGuest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Connecting to HomeCircle...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <StatusBar style="dark" />
        {/* Top Header Bar */}
        <ScreenHeader onBack={() => router.back()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Profile Card Section */}
          {activeProfile && <ProfileCard profile={activeProfile as any} />}

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab("request")}
              style={[
                styles.tabButton,
                activeTab === "request" && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "request" && styles.tabButtonTextActive,
                ]}
              >
                Request
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("history")}
              style={[
                styles.tabButton,
                activeTab === "history" && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "history" && styles.tabButtonTextActive,
                ]}
              >
                History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Request Pass Form */}
          {activeTab === "request" && (
            <PassRequestForm
              isPending={createPass.isPending}
              guestProfile={activeProfile}
              onSubmit={handleRequestPass}
            />
          )}

          {/* Tab 2: History List */}
          {activeTab === "history" && (
            <PassHistoryList historyList={historyList} />
          )}
        </ScrollView>

        {/* Profile Registration Modal */}
        <ProfileRegModal
          visible={showRegModal}
          isRegistering={registerProfile.isPending}
          onRegister={handleSaveProfile}
          onClose={() => setShowRegModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.background,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.secondary,
  },
  tabButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
});
