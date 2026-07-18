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

  const fetchAndSaveToken = async () => {
    try {
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7A",
        });
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn("EAS Project ID not found. Ensure app config is correct.");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      if (!token) return;

      console.log("Expo Push Token:", token);

      // Save token into 'notifications' table in Supabase
      const { error: insertErr } = await supabase
        .from("notifications")
        .insert({ token })
        .select();

      if (insertErr && !insertErr.message.includes("duplicate") && insertErr.code !== "23505") {
        console.error("Error saving token to Supabase:", insertErr.message);
      }

      // If user profile exists, update 'guestusers' to link the token
      if (profile?.id) {
        const { error: updateErr } = await supabase
          .from("guestusers")
          .update({ notification_token: token })
          .eq("id", profile.id);

        if (updateErr) {
          console.error("Error linking token to guestuser profile:", updateErr.message);
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch or save push token:", err.message || err);
    }
  };

  React.useEffect(() => {
    loadProfile();

    async function checkAndPromptNotifications() {
      if (Platform.OS === "web") return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus === "undetermined" || existingStatus === "denied") {
          Alert.alert(
            "Enable Push Notifications",
            "Get real-time updates for visitor approvals, guard status, and community announcements directly on your device.",
            [
              { text: "Not Now", style: "cancel" },
              {
                text: "Enable",
                onPress: async () => {
                  const { status } = await Notifications.requestPermissionsAsync();
                  if (status === "granted") {
                    await fetchAndSaveToken();
                  }
                },
              },
            ]
          );
        } else if (existingStatus === "granted") {
          await fetchAndSaveToken();
        }
      } catch (err) {
        console.warn("Error checking notification permissions:", err);
      }
    }

    checkAndPromptNotifications();
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
      <StatusBar style="light" />

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
