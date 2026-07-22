import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { ChoiceCard } from "../components/get-started/ChoiceCard";
import { useProfileStore } from "../store/useProfileStore";
import { theme } from "../theme";

export default function GetStartedScreen() {
  const router = useRouter();
  const { profile, loadProfile, isLoadingProfile } = useProfileStore();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(15)).current;
const configureNotificationChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4979a6",
  });
};

const fetchAndSaveToken = async () => {
  try {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device.");
      return;
    }

    await configureNotificationChannel();

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("EAS Project ID not found.");
      return;
    }

    const {
      data: expoPushToken,
    } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    if (!expoPushToken) return;

    // console.log("Expo Push Token:", expoPushToken);

    // Save token (avoid duplicates)
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({ token: expoPushToken });

    if (notificationError && notificationError.code !== "23505") {
      console.error("Error saving token to Supabase:", notificationError.message);
    }

    // Link token with current user
    if (profile?.id) {
      // 1. Update in users table if exists
      const { error: userError } = await supabase
        .from("users")
        .update({
          notification_token: expoPushToken,
        })
        .eq("id", profile.id);

      if (userError) {
        console.warn("Could not update token in users table (might be a guest):", userError.message);
      }

      // 2. Update in guestusers table
      const { error: guestError } = await supabase
        .from("guestusers")
        .update({
          notification_token: expoPushToken,
        })
        .eq("id", profile.id);

      if (guestError) {
        console.warn("Could not update token in guestusers table (might not exist yet):", guestError.message);
      }
    }
  } catch (error) {
    console.error("Failed to register push notifications:", error);
  }
};

const checkNotificationPermission = async () => {
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    if (status === "granted") {
      await fetchAndSaveToken();
      return;
    }

    // Only show the alert if the permission is undetermined, or if it is denied but we can still ask again.
    // If status is denied and canAskAgain is false, the OS will block the prompt anyway, so we shouldn't show the alert.
    if (status === "undetermined" || (status === "denied" && canAskAgain)) {
      Alert.alert(
        "Enable Notifications",
        "Stay updated with visitor approvals, guest requests, security alerts, maintenance reminders, and important society announcements.",
        [
          {
            text: "Not Now",
            style: "cancel",
          },
          {
            text: "Enable",
            onPress: async () => {
              const { status: finalStatus } =
                await Notifications.requestPermissionsAsync();

              if (finalStatus === "granted") {
                await fetchAndSaveToken();
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error("Notification permission error:", error);
  }
};

React.useEffect(() => {
  loadProfile();

  if (Platform.OS !== "web") {
    checkNotificationPermission();
  }
}, []);

  React.useEffect(() => {
    if (!isLoadingProfile && profile) {
      if (profile.role === "Resident") {
        router.replace("/resident" as any);
      } else if (profile.role === "Guard") {
        router.replace("/guard" as any);
      } else if (profile.role === "Admin") {
        router.replace("/admin" as any);
      } else {
        router.replace("/request-pass" as any);
      }
    }
  }, [profile, isLoadingProfile]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerOpacity, heroOpacity, heroSlide]);

  const handleHelp = () => {
    Alert.alert(
      "Help & Support",
      "Our resident support channel is online at support@homecircle.com.",
    );
  };

  const handleBecomeMember = () => {
    router.push("/create-account" as any);
  };

  const handleGeneratePass = () => {
    router.push("/request-pass" as any);
  };

  const handleLogin = () => {
    router.push("/login" as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Bar (Sticky) */}
      <SafeAreaView edges={["top"]} style={styles.safeHeader}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Text style={styles.headerLogo}>HomeCircle</Text>
          <Pressable
            onPress={handleHelp}
            style={({ pressed }) => [
              styles.helpButton,
              pressed && styles.helpButtonPressed,
            ]}
          >
            <MaterialIcons
              name="help-outline"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Scrollable Bento Grid Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: heroOpacity, transform: [{ translateY: heroSlide }] },
          ]}
        >
          <View style={styles.heroIconWrapper}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.heroFavicon}
              contentFit="contain"
            />
          </View>
          <Text style={styles.heroTitle}>How can we help you today?</Text>
          <Text style={styles.heroSubtitle}>
            Choose an option below to get started with your society management
            portal.
          </Text>
        </Animated.View>

        {/* Grid/Bento Layout */}
        <View style={styles.grid}>
          <ChoiceCard
            iconName="home"
            largeIconName="house"
            title="Become a Member"
            description="Register as a resident to manage your home and community."
            actionText="Start registration"
            onPress={handleBecomeMember}
            delay={300}
          />

          <ChoiceCard
            iconName="qr-code-2"
            largeIconName="vibration"
            title="Generate Visitor Pass"
            description="Quickly request an entry pass for society access."
            actionText="Create pass"
            onPress={handleGeneratePass}
            delay={450}
          />
        </View>

        {/* Context Info Footer */}
        <View style={styles.footerSection}>
          <View style={styles.securityBadge}>
            <MaterialIcons
              name="verified-user"
              size={18}
              color={theme.colors.secondary}
            />
            <Text style={styles.securityText}>Encrypted & Secure Access</Text>
          </View>

          <Pressable onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginText}>
              Already have an account? Log in
            </Text>
          </Pressable>
        </View>

        {/* Footer legal text */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            © 2026 HomeCircle Smart Society Solutions. All rights reserved.
          </Text>
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
  safeHeader: {
    backgroundColor: "rgba(247, 249, 251, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.md,
  },
  headerLogo: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  helpButtonPressed: {
    backgroundColor: theme.colors.surfaceContainerHighest,
    opacity: 0.9,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    maxWidth: 450,
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroFavicon: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  heroTitle: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
  },
  grid: {
    width: "100%",
    maxWidth: 600,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  footerSection: {
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.rounded.full,
  },
  securityText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  loginButton: {
    paddingVertical: theme.spacing.xs,
  },
  loginText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: "underline",
  },
  legalFooter: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    width: "100%",
  },
  legalText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    textAlign: "center",
  },
});
