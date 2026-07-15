import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { FadeInView } from '../components/welcome/FadeInView';
import { useProfileStore } from '../store/useProfileStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, loadProfile, isLoadingProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isLoadingProfile && profile) {
      if (profile.role === "Resident") {
        router.replace("/(resident)" as any);
      } else if (profile.role === "Guard") {
        router.replace("/(guard)" as any);
      } else if (profile.role === "Admin") {
        router.replace("/(admin)" as any);
      } else {
        router.replace("/request-pass" as any);
      }
    }
  }, [profile, isLoadingProfile]);

  // Animation for Get Started button hover/press scale
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = () => {
    router.push('/get-started' as any);
  };

  const handleLogin = () => {
    router.push('/login' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Decorative Blobs */}
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Branding Header */}
          <FadeInView delay={100}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons
                  name="home-heart"
                  size={30}
                  color={theme.colors.secondary}
                />
                <Text style={styles.logoText}>HomeCircle</Text>
              </View>
            </View>
          </FadeInView>

          {/* Hero Image Container */}
          <FadeInView delay={250} style={styles.heroContainer}>
            <Image
              source="https://lh3.googleusercontent.com/aida-public/AB6AXuDb8P6888OJT_nsr_u5HwcM24lQ_5d-jqsOTvthKHMVQVHPRNJmznauk8D7RI_k6p1txxmDDluPSYDaxTBj1W2YrOZYwzCynaKmxyi9onMAkxy0HkJcaqjFao01ezvNK3PBWFvWR5pU7TjeT1Ge-xwGkF0SmobTcgQZcI7OOox8d-ej5YWFnzeMOl0jhgJZVt5dnv7vv5Z0L20dWDga3kTAy_dWK9KWNqryGPxuvEG5TJ3_pgUrbDNCPw"
              style={styles.heroImage}
              contentFit="cover"
              transition={1000}
            />

            {/* Floating Glass Card overlay */}
            <View style={styles.glassCard}>
              <View style={styles.glassCardBadge}>
                <View style={styles.verifiedIconWrapper}>
                  <MaterialIcons name="verified" size={14} color="#ffffff" />
                </View>
                <Text style={styles.glassCardText}>Verified Community #2401</Text>
              </View>
            </View>
          </FadeInView>

          {/* Value Proposition */}
          <FadeInView delay={400} style={styles.textSection}>
            <Text style={styles.headline}>Welcome to HomeCircle</Text>
            <Text style={styles.subtitle}>
              Your modern community management platform. Elevating residential living with smart security and seamless interactions.
            </Text>
          </FadeInView>

          {/* Benefit Pills */}
          <FadeInView delay={550} style={styles.pillsContainer}>
            <View style={styles.pill}>
              <MaterialIcons name="security" size={16} color={theme.colors.secondary} />
              <Text style={styles.pillText}>Secure Access</Text>
            </View>

            <View style={styles.pill}>
              <MaterialIcons name="groups" size={16} color={theme.colors.secondary} />
              <Text style={styles.pillText}>Community</Text>
            </View>

            <View style={styles.pill}>
              <MaterialIcons name="receipt-long" size={16} color={theme.colors.secondary} />
              <Text style={styles.pillText}>Digital Billing</Text>
            </View>
          </FadeInView>

          {/* Actions Footer */}
          <FadeInView delay={700} style={styles.footer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleGetStarted}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
              <Text style={styles.loginText}>
                Already a resident? <Text style={styles.loginHighlight}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  blob1: {
    position: 'absolute',
    top: -96,
    left: -96,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: theme.colors.secondaryContainer,
    opacity: 0.20,
  },
  blob2: {
    position: 'absolute',
    top: '50%',
    right: -128,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: theme.colors.primaryFixed,
    opacity: 0.10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoText: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.secondary,
    fontWeight: '700',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  glassCard: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  glassCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  verifiedIconWrapper: {
    padding: 2,
    backgroundColor: theme.colors.secondary,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCardText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
  },
  textSection: {
    marginBottom: theme.spacing.lg,
  },
  headline: {
    ...theme.typography.headlineXl,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.rounded.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pillText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
  },
  footer: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.rounded.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
  loginLink: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  loginText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  loginHighlight: {
    color: theme.colors.secondary,
    fontWeight: '700',
  },
});