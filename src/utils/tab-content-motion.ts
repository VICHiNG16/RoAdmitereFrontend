import { useCallback } from "react";
import { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { getMotionDistance, getMotionDuration, getMotionEasing, getMotionPreset } from "./motion";

type UseTabContentMotionOptions<T extends string> = {
  activeKey: T;
  onChangeActive: (nextKey: T) => void;
  reducedMotionEnabled: boolean;
  tapTransitionStyle?: "lift" | "slide-horizontal";
};

export type TabTransitionSource = "tap" | "swipe";

export type TabTransitionConfig = {
  source?: TabTransitionSource;
  direction?: -1 | 1;
};

const TAP_MIN_OPACITY_PREMIUM = 0.94;
const TAP_MIN_SCALE_PREMIUM = 0.992;
const TAP_MIN_OPACITY_SAFE = 0.97;
const TAP_MIN_SCALE_SAFE = 0.996;
const TAP_VERTICAL_DIP = 2;
const TAP_SETTLE_FRACTION = 0.26;
const TAP_SETTLE_RATIO = 0.36;
const TAP_MIN_DIP_TARGET = 0.76;
const TAP_SLIDE_DISTANCE_MULTIPLIER = 1.8;
const TAP_SLIDE_MIN_OPACITY_PREMIUM = 0.92;
const TAP_SLIDE_MIN_SCALE_PREMIUM = 0.996;
const TAP_SLIDE_MIN_OPACITY_SAFE = 0.96;
const TAP_SLIDE_MIN_SCALE_SAFE = 0.998;

export function useTabContentMotion<T extends string>({
  activeKey,
  onChangeActive,
  reducedMotionEnabled,
  tapTransitionStyle = "lift",
}: UseTabContentMotionOptions<T>) {
  const tapProgress = useSharedValue(1);
  const tapDirection = useSharedValue<-1 | 1>(1);

  const transitionTo = useCallback(
    (nextKey: T, config: TabTransitionConfig = {}): void => {
      if (nextKey === activeKey) {
        return;
      }

      const source = config.source ?? "tap";
      onChangeActive(nextKey);

      const baseDuration = getMotionDuration(reducedMotionEnabled, "normal");

      if (source === "swipe") {
        // Swipe should feel direct but with a brief settle animation for premium feel
        cancelAnimation(tapProgress);
        tapProgress.value = 0.7;
        const swipeDuration = Math.round(baseDuration * 0.65);
        if (swipeDuration === 0) {
          tapProgress.value = 1;
          return;
        }
        const easing = getMotionEasing(reducedMotionEnabled, "enter");
        tapProgress.value = withTiming(1, { duration: swipeDuration, easing });
        return;
      }

      const duration = Math.round(baseDuration * 1.2);
      if (duration === 0) {
        tapDirection.value = config.direction ?? 1;
        tapProgress.value = 1;
        return;
      }

      tapDirection.value = config.direction ?? 1;

      // Blend from the current progress instead of hard-resetting to avoid one-frame flashes.
      cancelAnimation(tapProgress);
      const currentProgress = Math.max(0, Math.min(tapProgress.value, 1));
      const dipTarget = Math.max(TAP_MIN_DIP_TARGET, currentProgress - TAP_SETTLE_FRACTION);
      const dipDuration = Math.max(1, Math.round(duration * TAP_SETTLE_RATIO));
      const riseDuration = Math.max(1, duration - dipDuration);
      const dipEasing = getMotionEasing(reducedMotionEnabled, "standard");
      const riseEasing = getMotionEasing(reducedMotionEnabled, "enter");

      tapProgress.value = withTiming(
        dipTarget,
        { duration: dipDuration, easing: dipEasing },
        (finished) => {
          if (finished) {
            tapProgress.value = withTiming(1, { duration: riseDuration, easing: riseEasing });
          }
        }
      );
    },
    [activeKey, onChangeActive, reducedMotionEnabled, tapDirection, tapProgress]
  );

  const premiumMotionEnabled = !reducedMotionEnabled && getMotionPreset() === "premium-subtle";
  const tapMinOpacity = premiumMotionEnabled ? TAP_MIN_OPACITY_PREMIUM : TAP_MIN_OPACITY_SAFE;
  const tapMinScale = premiumMotionEnabled ? TAP_MIN_SCALE_PREMIUM : TAP_MIN_SCALE_SAFE;
  const tapSlideMinOpacity = premiumMotionEnabled ? TAP_SLIDE_MIN_OPACITY_PREMIUM : TAP_SLIDE_MIN_OPACITY_SAFE;
  const tapSlideMinScale = premiumMotionEnabled ? TAP_SLIDE_MIN_SCALE_PREMIUM : TAP_SLIDE_MIN_SCALE_SAFE;
  const tapSlideDistance = getMotionDistance(reducedMotionEnabled, "md") * TAP_SLIDE_DISTANCE_MULTIPLIER;

  const contentAnimatedStyle = useAnimatedStyle(() => {
    if (tapTransitionStyle === "slide-horizontal") {
      const opacityRange = 1 - tapSlideMinOpacity;
      const scaleRange = 1 - tapSlideMinScale;
      return {
        opacity: tapSlideMinOpacity + tapProgress.value * opacityRange,
        transform: [
          { translateX: -tapDirection.value * tapSlideDistance * (1 - tapProgress.value) },
          { scale: tapSlideMinScale + tapProgress.value * scaleRange },
        ],
      };
    }

    const opacityRange = 1 - tapMinOpacity;
    const scaleRange = 1 - tapMinScale;
    return {
      opacity: tapMinOpacity + tapProgress.value * opacityRange,
      transform: [
        { translateY: (1 - tapProgress.value) * TAP_VERTICAL_DIP },
        { scale: tapMinScale + tapProgress.value * scaleRange },
      ],
    };
  }, [
    tapDirection,
    tapMinOpacity,
    tapMinScale,
    tapProgress,
    tapSlideDistance,
    tapSlideMinOpacity,
    tapSlideMinScale,
    tapTransitionStyle,
  ]);

  return {
    contentAnimatedStyle,
    transitionTo,
  };
}
