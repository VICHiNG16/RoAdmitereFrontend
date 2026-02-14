import { useCallback, useEffect, useRef } from "react";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { getMotionDuration, getMotionEasing, useReducedMotionEnabled } from "./motion";

const OPEN_MIN_OPACITY = 0.74;
const OPEN_MIN_SCALE = 0.948;
const OPEN_DURATION_MULTIPLIER = 1.4;
const CLOSE_DURATION_MULTIPLIER = 1.08;

export function useBottomSheetMotion() {
  const reducedMotionEnabled = useReducedMotionEnabled();
  const progress = useSharedValue(reducedMotionEnabled ? 1 : 0);
  const isClosingRef = useRef(false);

  useEffect(() => {
    isClosingRef.current = false;
    const duration = Math.round(getMotionDuration(reducedMotionEnabled, "slow") * OPEN_DURATION_MULTIPLIER);
    const easing = getMotionEasing(reducedMotionEnabled, "standard");
    progress.value = withTiming(1, { duration, easing });
  }, [progress, reducedMotionEnabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacityRange = 1 - OPEN_MIN_OPACITY;
    const scaleRange = 1 - OPEN_MIN_SCALE;
    return {
      opacity: OPEN_MIN_OPACITY + progress.value * opacityRange,
      transform: [{ scale: OPEN_MIN_SCALE + progress.value * scaleRange }],
    };
  }, [reducedMotionEnabled]);

  const closeWithMotion = useCallback((onClosed: () => void): void => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    const duration = Math.round(getMotionDuration(reducedMotionEnabled, "normal") * CLOSE_DURATION_MULTIPLIER);
    const easing = getMotionEasing(reducedMotionEnabled, "exit");

    if (duration === 0) {
      onClosed();
      return;
    }

    progress.value = withTiming(0, { duration, easing }, (finished) => {
      if (finished) {
        runOnJS(onClosed)();
      }
    });
  }, [progress, reducedMotionEnabled]);

  return { animatedStyle, closeWithMotion };
}
