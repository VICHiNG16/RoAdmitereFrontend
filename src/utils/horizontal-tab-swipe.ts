import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

export type OrderedTabTransitionMeta<T extends string> = {
  source: "tap" | "swipe";
  fromKey: T;
  toKey: T;
  fromIndex: number;
  toIndex: number;
  direction: -1 | 1;
  translationX?: number;
  velocityX?: number;
};

type UseHorizontalTabSwipeGestureOptions<T extends string> = {
  orderedKeys: readonly T[];
  activeKey: T;
  onChange: (nextKey: T, meta: OrderedTabTransitionMeta<T>) => void;
};

const SWIPE_DISTANCE_THRESHOLD = 52;
const SWIPE_VELOCITY_THRESHOLD = 860;
const SWIPE_ACTIVATION_OFFSET = 14;
const SWIPE_VERTICAL_FAIL_OFFSET = 20;

export function resolveOrderedTabDirection<T extends string>(
  orderedKeys: readonly T[],
  currentKey: T,
  nextKey: T
): -1 | 1 {
  const currentIndex = orderedKeys.indexOf(currentKey);
  const nextIndex = orderedKeys.indexOf(nextKey);

  if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) {
    return 1;
  }

  return nextIndex > currentIndex ? 1 : -1;
}

export function resolveOrderedTabTransitionMeta<T extends string>(
  orderedKeys: readonly T[],
  currentKey: T,
  nextKey: T,
  source: "tap" | "swipe",
  gesture: { translationX?: number; velocityX?: number } = {}
): OrderedTabTransitionMeta<T> | null {
  const fromIndex = orderedKeys.indexOf(currentKey);
  const toIndex = orderedKeys.indexOf(nextKey);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return null;
  }

  return {
    source,
    fromKey: currentKey,
    toKey: nextKey,
    fromIndex,
    toIndex,
    direction: toIndex > fromIndex ? 1 : -1,
    translationX: gesture.translationX,
    velocityX: gesture.velocityX,
  };
}

export function useHorizontalTabSwipeGesture<T extends string>({
  orderedKeys,
  activeKey,
  onChange,
}: UseHorizontalTabSwipeGestureOptions<T>) {
  return useMemo(() => {
    if (orderedKeys.length < 2) {
      return Gesture.Pan().enabled(false);
    }

    return Gesture.Pan()
      .activeOffsetX([-SWIPE_ACTIVATION_OFFSET, SWIPE_ACTIVATION_OFFSET])
      .failOffsetY([-SWIPE_VERTICAL_FAIL_OFFSET, SWIPE_VERTICAL_FAIL_OFFSET])
      .onEnd(({ translationX, velocityX }) => {
        const currentIndex = orderedKeys.indexOf(activeKey);
        if (currentIndex === -1) {
          return;
        }

        const movedLeft =
          translationX <= -SWIPE_DISTANCE_THRESHOLD
          || (velocityX <= -SWIPE_VELOCITY_THRESHOLD && translationX <= -SWIPE_ACTIVATION_OFFSET);
        const movedRight =
          translationX >= SWIPE_DISTANCE_THRESHOLD
          || (velocityX >= SWIPE_VELOCITY_THRESHOLD && translationX >= SWIPE_ACTIVATION_OFFSET);

        let nextIndex = currentIndex;
        if (movedLeft) {
          nextIndex = Math.min(currentIndex + 1, orderedKeys.length - 1);
        } else if (movedRight) {
          nextIndex = Math.max(currentIndex - 1, 0);
        }

        if (nextIndex !== currentIndex) {
          const nextKey = orderedKeys[nextIndex];
          if (!nextKey) {
            return;
          }
          const direction: -1 | 1 = nextIndex > currentIndex ? 1 : -1;
          runOnJS(onChange)(nextKey, {
            source: "swipe",
            fromKey: activeKey,
            toKey: nextKey,
            fromIndex: currentIndex,
            toIndex: nextIndex,
            direction,
            translationX,
            velocityX,
          });
        }
      });
  }, [activeKey, onChange, orderedKeys]);
}
