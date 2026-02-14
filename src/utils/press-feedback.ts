import { useCallback } from "react";
import type { GestureResponderEvent } from "react-native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { getMotionEasing, useReducedMotionEnabled } from "./motion";

type PressFeedbackOptions = {
  disabled?: boolean;
  pressedScale?: number;
  pressedOpacity?: number;
  pressInDuration?: number;
  pressOutDuration?: number;
};

const DEFAULT_PRESSED_SCALE = 0.985;
const DEFAULT_PRESSED_OPACITY = 0.96;
const DEFAULT_PRESS_IN_DURATION = 80;
const DEFAULT_PRESS_OUT_DURATION = 140;

export function usePressFeedback({
  disabled = false,
  pressedScale = DEFAULT_PRESSED_SCALE,
  pressedOpacity = DEFAULT_PRESSED_OPACITY,
  pressInDuration = DEFAULT_PRESS_IN_DURATION,
  pressOutDuration = DEFAULT_PRESS_OUT_DURATION,
}: PressFeedbackOptions = {}) {
  const reducedMotionEnabled = useReducedMotionEnabled();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animateTo = useCallback(
    (nextScale: number, nextOpacity: number, duration: number): void => {
      if (reducedMotionEnabled || duration === 0) {
        scale.value = nextScale;
        opacity.value = nextOpacity;
        return;
      }

      const easing = getMotionEasing(reducedMotionEnabled, "standard");
      scale.value = withTiming(nextScale, { duration, easing });
      opacity.value = withTiming(nextOpacity, { duration, easing });
    },
    [opacity, reducedMotionEnabled, scale]
  );

  const handlePressIn = useCallback(
    (_event?: GestureResponderEvent): void => {
      if (disabled) {
        return;
      }
      animateTo(pressedScale, pressedOpacity, pressInDuration);
    },
    [animateTo, disabled, pressInDuration, pressedOpacity, pressedScale]
  );

  const handlePressOut = useCallback(
    (_event?: GestureResponderEvent): void => {
      if (disabled) {
        scale.value = 1;
        opacity.value = 1;
        return;
      }
      animateTo(1, 1, pressOutDuration);
    },
    [animateTo, disabled, opacity, pressOutDuration, scale]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  };
}
