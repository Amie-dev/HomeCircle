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
import { supabase } from "../../../utils/supabase";
import { useProfileStore } from "../../store/useProfileStore";
import { theme } from "../../theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setProfile = useProfileStore((state) => state.setProfile);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Could not authenticate user");
      }

      const userId = authData.user.id;

      // 2. Fetch profile from guestusers table
      const { data: profileData, error: profileError } = await supabase
        .from("user")
        .select("*")
        .eq("email", email.trim())
        .maybeSingle();

      if (profileError) {
        console.warn("Profile fetch error:", profileError);
      }

      // 3. Fetch verification and role details
      let role: 'Resident' | 'Guard' | 'Admin' | undefined = undefined;
      let isVerified = false;
      let societyId = "";
      let societyName = "";
      let towerName = "";
      let flatName = "";

      const { data: verifyData, error: verifyError } = await supabase
        .from("userverifications")
        .select(`
          role,
          is_verified,
          society_id,
          societies ( name ),
          towers ( name ),
          flats ( flat_number )
        `)
        .eq("user_id", userId)
        .maybeSingle();

      if (verifyError) {
        console.warn("Verification fetch error:", verifyError);
      }

      if (verifyData) {
        role = (verifyData.role as any) || undefined;
        isVerified = verifyData.is_verified || false;
        societyId = verifyData.society_id || "";
        if (verifyData.societies) {
          societyName = (verifyData.societies as any).name || "";
        }
        if (verifyData.towers) {
          towerName = (verifyData.towers as any).name || "";
        }
        if (verifyData.flats) {
          flatName = (verifyData.flats as any).flat_number || "";
        }
      }

      // 4. Save profile in Zustand
      await setProfile({
        id: userId,
        fullName: profileData?.full_name || authData.user.user_metadata?.full_name || "User",
        email: email.trim(),
        phone: profileData?.phone || "N/A",
        vehicleNumber: profileData?.vehicle_number || undefined,
        role,
        isVerified,
        societyId,
        societyName,
        towerName,
        flatName,
      });
      console.log({ role })
      // 5. Navigate based on role & verification
      if (role === "Admin") {
        Alert.alert("Welcome Admin", "Logging into society administration dashboard.", [
          { text: "OK", onPress: () => router.replace("/admin" as any) },
        ]);
      } else if (role === "Resident") {
        if (!isVerified) {
          Alert.alert(
            "Verification Pending",
            `Your profile is awaiting approval from ${societyName || "your society"} Admin.`,
            [{ text: "Continue", onPress: () => router.replace("/resident" as any) }]
          );
        } else {
          router.replace("/resident" as any);
        }
      } else if (role === "Guard") {
        if (!isVerified) {
          Alert.alert(
            "Verification Pending",
            `Your profile is awaiting approval from ${societyName || "your society"} Admin.`,
            [{ text: "Continue", onPress: () => router.replace("/guard" as any) }]
          );
        } else {
          router.replace("/guard" as any);
        }
      } else {
        // Fallback or Guest
        router.replace("/request-pass" as any);
      }
    } catch (err: any) {
      // Fallback: If DB table not ready, let user log in locally for testing
      const message = err.message || "Failed to log in";
      if (message.includes("relation") || message.includes("schema cache")) {
        Alert.alert(
          "DB Warning",
          "Supabase tables are missing. Logging you in with a mock profile for testing.\n\nMake sure to run migrations!",
          [
            {
              text: "Log in with Mock",
              onPress: async () => {
                await setProfile({
                  id: "11111111-1111-1111-1111-111111111111",
                  fullName: "Resident User (Mock)",
                  email,
                  phone: "9876543210",
                  role: "Resident",
                  isVerified: true,
                  societyId: "soc-1",
                  societyName: "Greenwood Heights",
                  towerName: "Tower A",
                  flatName: "101",
                });
                router.replace("/(resident)" as any);
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Login Error", message);
      }
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <StatusBar style="light" />

          {/* Header Anchor */}
          <View style={styles.header}>
            <MaterialIcons name="security" size={48} color={theme.colors.secondary} />
            <Text style={styles.headerTitle}>HomeCircle</Text>
            <Text style={styles.headerSubtitle}>Securely manage your community experience.</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="mail" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Password reset link will be sent to your email.")}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityButton}>
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={theme.colors.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.loginButton}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Login to Account</Text>
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

          {/* Social Login Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Google Login", "Logging in with Google.")}>
              <MaterialIcons name="g-mobiledata" size={28} color={theme.colors.primary} />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Apple Login", "Logging in with Apple.")}>
              <MaterialIcons name="phone-iphone" size={20} color={theme.colors.primary} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
              <Text style={styles.signUpText} onPress={() => router.push("/create-account" as any)}>
                Sign Up
              </Text>
            </Text>
          </View>

          {/* Bottom Encrypted Badge */}
          <View style={styles.encryptedBadge}>
            <MaterialIcons name="verified-user" size={14} color={theme.colors.outline} />
            <Text style={styles.encryptedText}>END-TO-END ENCRYPTED</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    letterSpacing: -1,
  },
  headerSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: theme.spacing.xs,
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
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
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
  visibilityButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: theme.spacing.sm,
  },
  loginButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSecondary,
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
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
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  signUpText: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  encryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    opacity: 0.5,
  },
  encryptedText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
  },
});
