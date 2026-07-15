import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCreatePass, usePassesHistory, useRegisterProfile } from "../hooks/useRequestPasses";
import { useProfileStore } from "../store/useProfileStore";
import { theme } from "../theme";

// Extracted Modular Components
import { PassHistoryList } from "../components/request-pass/PassHistoryList";
import { PassRequestForm } from "../components/request-pass/PassRequestForm";
import { ProfileCard } from "../components/request-pass/ProfileCard";
import { ProfileRegModal } from "../components/request-pass/ProfileRegModal";
import { ScreenHeader } from "../components/request-pass/ScreenHeader";

export default function RequestPassScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"request" | "history">("request");

  // Zustand Store
  const { profile, isLoadingProfile, loadProfile } = useProfileStore();
  const [showRegModal, setShowRegModal] = useState<boolean>(false);

  // React Query Hooks
  const { data: historyList = [] } = usePassesHistory(profile?.id);
  console.log("DEBUG: Current Profile ID:", profile?.id);
  console.log("DEBUG: Fetched Passes Count:", historyList.length, "passes");
  const createPass = useCreatePass();
  const registerProfile = useRegisterProfile();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isLoadingProfile && !profile) {
      setShowRegModal(true);
    }
  }, [isLoadingProfile, profile]);

  const handleSaveProfile = (data: {
    fullName: string;
    email: string;
    phone: string;
    vehicleNumber: string;
  }) => {
    if (!data.fullName || !data.email || !data.phone) {
      Alert.alert("Error", "Please fill in all required fields (Name, Email, Phone).");
      return;
    }

    registerProfile.mutate({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      vehicle_number: data.vehicleNumber || null,
      notification_token: undefined,
    }, {
      onSuccess: () => {
        setShowRegModal(false);
      },
      onError: (err: any) => {
        Alert.alert("Error saving profile", err.message || "Please try again.");
      }
    });
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
  }) => {
    if (!profile) {
      setShowRegModal(true);
      return;
    }

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + formData.expiryHours);

    createPass.mutate({
      user_id: profile.id,
      visitor_name: formData.visitorName,
      visitor_email: formData.visitorEmail,
      visitor_phone: formData.visitorPhone,
      designation: formData.visitorDesignation,
      tower_no: formData.towerNo,
      flat_no: formData.flatNo,
      status: "Approved",
      expiry_hours: formData.expiryHours,
      expiry_time: expiryDate.toISOString(),
      after_scan_qr_expiry: formData.afterScanExpiry,
      resident_details: {
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
      },
    }, {
      onSuccess: (newPass) => {
        Alert.alert(
          "Pass Approved",
          `Pass generated successfully for ${newPass.visitor_name}.\nDestination: Greenwood Heights, Tower ${newPass.tower_no}, Flat ${newPass.flat_no}`,
          [
            {
              text: "View History",
              onPress: () => setActiveTab("history"),
            },
          ]
        );
      },
      onError: (err: any) => {
        Alert.alert("Error requesting pass", err.message || "Please try again.");
      }
    });
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Connecting to HomeCircle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <ScreenHeader onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={true}>
        {/* Profile Card Section */}
        {profile && <ProfileCard profile={profile} />}

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab("request")}
            style={[styles.tabButton, activeTab === "request" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === "request" && styles.tabButtonTextActive]}>
              Request
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            style={[styles.tabButton, activeTab === "history" && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === "history" && styles.tabButtonTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Request Pass Form */}
        {activeTab === "request" && (
          <PassRequestForm isPending={createPass.isPending} onSubmit={handleRequestPass} />
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
