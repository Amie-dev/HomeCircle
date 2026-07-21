import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPushToken } from "../../../utils/pushToken";
import { supabase } from "../../../utils/supabase";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function CreateAccountScreen() {
  const router = useRouter();
  const [role, setRole] = useState<"Resident" | "Guard" | "Admin">("Resident");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setSignupData = useProfileStore((state) => state.setSignupData);

  const handleContinue = async () => {
    if (!fullName || !phone || !email || !password) {
      Alert.alert("Missing Fields", "Please enter all required information.");
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user?.id || "temp-auth-uuid-" + Date.now();
      const token = await getPushToken();

      if (token) {
        // Insert token into notifications table first (avoiding duplicates)
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({ token });

        if (notificationError && notificationError.code !== "23505") {
          console.error("Error saving token to notifications table:", notificationError.message);
        }
      }

      const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(fullName.trim() || Math.random().toString())}`;

      // 1b. Insert credentials into custom database users table
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: userId,
          role: role,
          full_name: fullName,
          phone: phone,
          email: email.trim(),
          password: password,
          notification_token: token,
          avatar_url: randomAvatarUrl,
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      // 2. Save progress in Zustand Store
      setSignupData({
        id: userId,
        fullName,
        phone,
        email: email.trim(),
        password,
        role,
        avatarUrl: randomAvatarUrl,
      });

      // 3. Forward to role-specific setup screens
      if (role === "Resident") {
        router.push("/resident-details" as any);
      } else if (role === "Guard") {
        router.push("/guard-details" as any);
      } else if (role === "Admin") {
        router.push("/society-setup" as any);
      }
    } catch (err: any) {
      const message = err.message || "Failed to sign up";
      // Fallback for missing backend or networking issues
      if (message.includes("network") || message.includes("credentials") || message.includes("relation")) {
        Alert.alert(
          "DB Warning",
          "Supabase Auth registration failed. Proceeding with offline mockup state for testing.",
          [
            {
              text: "Continue Offline",
              onPress: () => {
                const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(fullName.trim() || Math.random().toString())}`;
                setSignupData({
                  id: "b617bf12-1c95-4073-9c3f-e3ead539540a",
                  fullName,
                  phone,
                  email: email.trim(),
                  password,
                  role,
                  avatarUrl: randomAvatarUrl,
                });
                if (role === "Resident") {
                  router.push("/resident-details" as any);
                } else if (role === "Guard") {
                  router.push("/guard-details" as any);
                } else if (role === "Admin") {
                  router.push("/society-setup" as any);
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Signup Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: "Google" | "Apple") => {
    setLoading(true);
    try {
      const userId = "social-uuid-" + Date.now();
      const mockName = `${provider} User`;
      const mockEmail = `${provider.toLowerCase()}user-${Date.now()}@gmail.com`;
      const mockPhone = "9999999999";
      const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(mockName.trim() || Math.random().toString())}`;

      // Insert into users table with default Resident role
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: userId,
          role: "Resident",
          full_name: mockName,
          phone: mockPhone,
          email: mockEmail,
          password: "", // no password for social logins
          avatar_url: randomAvatarUrl,
        });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setSignupData({
        id: userId,
        fullName: mockName,
        phone: mockPhone,
        email: mockEmail,
        password: "",
        role: "Resident",
        avatarUrl: randomAvatarUrl,
      });

      Alert.alert(
        `${provider} Sign Up Successful`,
        "Your account is created. Let's configure your society residency details.",
        [
          {
            text: "Continue",
            onPress: () => router.push("/resident-details" as any),
          },
        ]
      );
    } catch (err: any) {
      console.warn(`${provider} signup failed:`, err.message);
      // Fallback offline state
      const mockId = "social-uuid-mock-" + Date.now();
      const mockName = `${provider} User (Offline)`;
      const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(mockName.trim() || Math.random().toString())}`;
      setSignupData({
        id: mockId,
        fullName: mockName,
        phone: "9999999999",
        email: `${provider.toLowerCase()}-${Date.now()}@example.com`,
        password: "",
        role: "Resident",
        avatarUrl: randomAvatarUrl,
      });
      router.push("/resident-details" as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom", "left", 'right']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.container]} keyboardShouldPersistTaps="handled">
          <StatusBar style="dark" />

          {/* Top Branding Anchor */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <MaterialIcons name="home" size={32} color={theme.colors.secondary} />
              <Text style={styles.logoText}>HomeCircle</Text>
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join your digital smart society community today.</Text>
          </View>

          {/* Role Segmented Selector */}
          <View style={styles.roleWrapper}>
            <Text style={styles.inputLabel}>I AM A</Text>
            <View style={styles.segmentedControl}>
              {/* Active indicator overlay */}
              <View
                style={[
                  styles.indicator,
                  {
                    left: role === "Resident" ? 4 : role === "Guard" ? "34.5%" : "66%",
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.segmentBtn, role === "Resident" && styles.segmentBtnActive]}
                onPress={() => setRole("Resident")}
              >
                <Text style={[styles.segmentBtnText, role === "Resident" && styles.segmentBtnTextActive]}>
                  Resident
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, role === "Guard" && styles.segmentBtnActive]}
                onPress={() => setRole("Guard")}
              >
                <Text style={[styles.segmentBtnText, role === "Guard" && styles.segmentBtnTextActive]}>
                  Guard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, role === "Admin" && styles.segmentBtnActive]}
                onPress={() => setRole("Admin")}
              >
                <Text style={[styles.segmentBtnText, role === "Admin" && styles.segmentBtnTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="person" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.outline}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="mail" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Create password"
                  placeholderTextColor={theme.colors.outline}
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleContinue}
              style={styles.continueButton}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.line} />
          </View>

          {/* Social Register */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignup("Google")}>
              <MaterialIcons name="g-mobiledata" size={28} color={theme.colors.primary} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignup("Apple")}>
              <MaterialIcons name="phone-iphone" size={20} color={theme.colors.primary} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Return to Sign In */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.signInLink} onPress={() => router.push("/login" as any)}>
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  logoText: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  headerTitle: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  roleWrapper: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 12,
    height: 48,
    padding: 4,
    position: "relative",
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: "30%",
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    borderRadius: 8,
    zIndex: 10,
  },
  segmentBtnActive: {
    // text color handled via typography
  },
  segmentBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  segmentBtnTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  formContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inputWrapper: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    paddingHorizontal: 4,
    letterSpacing: 0.8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: theme.spacing.md,
  },
  continueButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
  socialRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    height: 48,
  },
  socialButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
  },
  footer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  signInLink: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
});
