import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

export interface NoticeDetail {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  author: string;
  isUrgent?: boolean;
}

interface Props {
  notice: NoticeDetail | null;
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  Maintenance: {
    bg: "rgba(0, 106, 97, 0.12)",
    text: theme.colors.secondary,
    icon: "build",
  },
  Security: {
    bg: "rgba(186, 26, 26, 0.12)",
    text: theme.colors.error,
    icon: "security",
  },
  Urgent: {
    bg: "rgba(186, 26, 26, 0.12)",
    text: theme.colors.error,
    icon: "error",
  },
  Event: {
    bg: "rgba(63, 70, 92, 0.10)",
    text: "#3f465c",
    icon: "event",
  },
  General: {
    bg: "rgba(124, 131, 155, 0.15)",
    text: theme.colors.onSurfaceVariant,
    icon: "campaign",
  },
};

export default function NoticeDetailBottomSheet({
  notice,
  visible,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!notice) return null;

  const catKey = notice.isUrgent ? "Urgent" : notice.category;
  const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.General;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header row: category pill + close button */}
        <View style={styles.sheetHeader}>
          <View
            style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}
          >
            <MaterialIcons
              name={catStyle.icon}
              size={13}
              color={catStyle.text}
            />
            <Text
              style={[styles.categoryPillText, { color: catStyle.text }]}
            >
              {catKey}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>{notice.title}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons
              name="person-outline"
              size={14}
              color={theme.colors.outline}
            />
            <Text style={styles.metaText}>{notice.author}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <MaterialIcons
              name="access-time"
              size={14}
              color={theme.colors.outline}
            />
            <Text style={styles.metaText}>{notice.date}</Text>
          </View>
        </View>

        {/* Thin divider */}
        <View style={styles.divider} />

        {/* Scrollable content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
          contentContainerStyle={styles.contentInner}
        >
          <Text style={styles.content}>{notice.content}</Text>
        </ScrollView>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.dismissBtnText}>Got it</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 12,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.outlineVariant,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginBottom: 16,
    opacity: 0.5,
  },
  contentScroll: {
    flexShrink: 1,
  },
  contentInner: {
    paddingBottom: 8,
  },
  content: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  dismissBtn: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissBtnText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontWeight: "700",
  },
});
