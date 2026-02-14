import { AccessibilityInfo } from "react-native";
import { useSyncExternalStore } from "react";
import { Easing } from "react-native-reanimated";
import type { WithTimingConfig } from "react-native-reanimated";

import { theme } from "../theme/theme";

export type MotionPreset = "safe" | "premium-subtle";

type MotionDurationKey = keyof typeof theme.motion.duration;
type MotionCurveKey = keyof typeof theme.motion.curve;
type MotionDistanceKey = keyof typeof theme.motion.distance;

type EnvShape = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const SAFE_DURATION_OVERRIDES: Partial<Record<MotionDurationKey, number>> = {
  normal: theme.motion.duration.fast,
  slow: theme.motion.duration.normal,
};

const SAFE_DISTANCE_SCALE = 0.66;

const SERVER_REDUCED_MOTION_SNAPSHOT = false;
const reducedMotionListeners = new Set<() => void>();
let reducedMotionEnabledSnapshot = false;
let reducedMotionSubscription:
  | {
    remove: () => void;
  }
  | null = null;
let reducedMotionInitialized = false;

function emitReducedMotionSnapshot(nextValue: boolean): void {
  if (reducedMotionEnabledSnapshot === nextValue) {
    return;
  }

  reducedMotionEnabledSnapshot = nextValue;
  for (const listener of reducedMotionListeners) {
    listener();
  }
}

function ensureReducedMotionSubscription(): void {
  if (reducedMotionInitialized) {
    return;
  }

  reducedMotionInitialized = true;

  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      emitReducedMotionSnapshot(Boolean(enabled));
    })
    .catch(() => {
      // Keep motion enabled when API is unavailable.
    });

  reducedMotionSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
    emitReducedMotionSnapshot(Boolean(enabled));
  });
}

function subscribeToReducedMotion(listener: () => void): () => void {
  ensureReducedMotionSubscription();
  reducedMotionListeners.add(listener);

  return () => {
    reducedMotionListeners.delete(listener);

    if (reducedMotionListeners.size > 0 || reducedMotionSubscription === null) {
      return;
    }

    reducedMotionSubscription.remove();
    reducedMotionSubscription = null;
    reducedMotionInitialized = false;
  };
}

function getReducedMotionSnapshot(): boolean {
  return reducedMotionEnabledSnapshot;
}

export function useReducedMotionEnabled(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => SERVER_REDUCED_MOTION_SNAPSHOT
  );
}

export const __motionStoreForTests = {
  reset(): void {
    if (reducedMotionSubscription) {
      reducedMotionSubscription.remove();
    }

    reducedMotionListeners.clear();
    reducedMotionEnabledSnapshot = false;
    reducedMotionSubscription = null;
    reducedMotionInitialized = false;
  },
};

export function getMotionPreset(): MotionPreset {
  const rawPreset = (globalThis as EnvShape).process?.env?.EXPO_PUBLIC_MOTION_PRESET?.trim().toLowerCase();

  if (rawPreset === "safe") {
    return "safe";
  }

  return "premium-subtle";
}

export function getMotionDuration(
  reducedMotionEnabled: boolean,
  key: MotionDurationKey
): number {
  if (reducedMotionEnabled) {
    return 0;
  }

  const preset = getMotionPreset();
  if (preset === "safe") {
    return SAFE_DURATION_OVERRIDES[key] ?? theme.motion.duration[key];
  }

  return theme.motion.duration[key];
}

export function getMotionEasing(
  reducedMotionEnabled: boolean,
  key: MotionCurveKey
): NonNullable<WithTimingConfig["easing"]> {
  if (reducedMotionEnabled) {
    return Easing.linear;
  }

  const preset = getMotionPreset();
  const resolvedKey: MotionCurveKey = preset === "safe" && key !== "standard" ? "standard" : key;

  const [x1, y1, x2, y2] = theme.motion.curve[resolvedKey];
  return Easing.bezier(x1, y1, x2, y2);
}

export function getMotionDistance(
  reducedMotionEnabled: boolean,
  key: MotionDistanceKey
): number {
  if (reducedMotionEnabled) {
    return 0;
  }

  const baseDistance = theme.motion.distance[key];
  if (getMotionPreset() === "safe") {
    return Math.round(baseDistance * SAFE_DISTANCE_SCALE);
  }

  return baseDistance;
}
