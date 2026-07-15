import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface FadeInViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: any;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  delay = 0,
  duration = 600,
  children,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
