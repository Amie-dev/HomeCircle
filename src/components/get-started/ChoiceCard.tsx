import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface ChoiceCardProps {
  iconName: string;
  largeIconName: string;
  title: string;
  description: string;
  actionText: string;
  onPress: () => void;
  delay: number;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  iconName,
  largeIconName,
  title,
  description,
  actionText,
  onPress,
  delay,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(15)).current;
  const [isPressed, setIsPressed] = useState(false);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, slide, delay]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity,
          transform: [{ translateY: slide }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.card,
          (pressed || isPressed) && styles.cardActive,
        ]}
      >
        {/* Decorative background icon */}
        <View style={styles.cardBackdropIcon}>
          <MaterialIcons
            name={largeIconName as any}
            size={110}
            color={theme.colors.secondary}
            style={{ opacity: isPressed ? 0.08 : 0.04 }}
          />
        </View>

        {/* Card Header Icon */}
        <View
          style={[
            styles.cardIconWrapper,
            isPressed && styles.cardIconWrapperActive,
          ]}
        >
          <MaterialIcons
            name={iconName as any}
            size={24}
            color={isPressed ? "#ffffff" : theme.colors.secondary}
          />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>

        {/* Action Button Row */}
        <View
          style={[
            styles.cardActionRow,
            isPressed && styles.cardActionRowActive,
          ]}
        >
          <Text style={styles.cardActionText}>{actionText}</Text>
          <MaterialIcons
            name="arrow-forward"
            size={16}
            color={theme.colors.secondary}
            style={styles.cardArrow}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardActive: {
    borderColor: theme.colors.secondary,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardBackdropIcon: {
    position: "absolute",
    top: -15,
    right: -15,
    pointerEvents: "none",
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  cardIconWrapperActive: {
    backgroundColor: theme.colors.secondary,
  },
  cardContent: {
    flexGrow: 1,
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  cardActionRowActive: {
    transform: [{ translateX: 4 }],
  },
  cardActionText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  cardArrow: {
    marginTop: 1,
  },
});
