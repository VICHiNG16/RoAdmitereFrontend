import { useCallback } from "react";
import type { ReactNode } from "react";
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { theme } from "../theme/theme";
import { getMotionEasing, useReducedMotionEnabled } from "../utils/motion";

type CardPressFeedback = "none" | "subtle" | "card";

type AnimatedCardPressableProps = Omit<PressableProps, "children" | "onPress" | "style"> & {
  children: ReactNode;
  onPress?: () => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
  feedback?: CardPressFeedback;
  disableScale?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_IN_DURATION = 80;
const PRESS_OUT_DURATION = 100;

function resolveScale(
  pressed: boolean,
  disableScale: boolean,
  reducedMotionEnabled: boolean,
  feedback: CardPressFeedback
): number {
  if (!pressed || disableScale || reducedMotionEnabled || feedback === "none") {
    return 1;
  }
  if (feedback === "subtle") {
    return theme.motion.pressScale.subtle;
  }
  return theme.motion.pressScale.card;
}

export function AnimatedCardPressable({
  children,
  onPress,
  style,
  feedback = "card",
  disableScale = false,
  onPressIn,
  onPressOut,
  ...restProps
}: AnimatedCardPressableProps): React.JSX.Element {
  const reducedMotionEnabled = useReducedMotionEnabled();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = useCallback((): void => {
    if (!onPress) {
      return;
    }
    void onPress();
  }, [onPress]);

  const animateFeedback = useCallback((nextScale: number, nextOpacity: number, duration: number): void => {
    if (reducedMotionEnabled || duration === 0) {
      scale.value = nextScale;
      opacity.value = nextOpacity;
      return;
    }

    const easing = getMotionEasing(reducedMotionEnabled, "standard");
    scale.value = withTiming(nextScale, { duration, easing });
    opacity.value = withTiming(nextOpacity, { duration, easing });
  }, [opacity, reducedMotionEnabled, scale]);

  const handlePressIn = useCallback((event: GestureResponderEvent): void => {
    if (feedback === "none") {
      animateFeedback(1, 0.92, PRESS_IN_DURATION);
    } else {
      animateFeedback(resolveScale(true, disableScale, reducedMotionEnabled, feedback), 1, PRESS_IN_DURATION);
    }
    onPressIn?.(event);
  }, [animateFeedback, disableScale, feedback, onPressIn, reducedMotionEnabled]);

  const handlePressOut = useCallback((event: GestureResponderEvent): void => {
    animateFeedback(1, 1, PRESS_OUT_DURATION);
    onPressOut?.(event);
  }, [animateFeedback, onPressOut]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      {...restProps}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
