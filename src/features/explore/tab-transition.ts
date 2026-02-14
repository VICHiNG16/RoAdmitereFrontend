import { resolveOrderedTabTransitionMeta } from "../../utils/horizontal-tab-swipe";
import { getMotionDuration } from "../../utils/motion";
import { EXPLORE_TAB_ORDER, exploreSwipeConfig, exploreTapTransitionConfig } from "./constants";
import type { ExploreTabKey, ExploreTabTransitionState, ExploreTabTransitionSource } from "./types";

export function resolveExploreTabKeyByIndex(index: number): ExploreTabKey | undefined {
  return EXPLORE_TAB_ORDER[index];
}

export function resolveExploreTabTransition(
  from: ExploreTabKey,
  to: ExploreTabKey,
  source: ExploreTabTransitionSource
): ExploreTabTransitionState | null {
  const meta = resolveOrderedTabTransitionMeta(EXPLORE_TAB_ORDER, from, to, source);
  if (!meta) {
    return null;
  }

  return {
    from: meta.fromKey,
    to: meta.toKey,
    direction: meta.direction,
    source: meta.source,
  };
}

export function computeTapTransitionDuration(
  reducedMotionEnabled: boolean,
  cardsViewportWidth: number,
  from: ExploreTabKey,
  to: ExploreTabKey
): number {
  const baseDuration = getMotionDuration(reducedMotionEnabled, "slow");
  const fromIndex = EXPLORE_TAB_ORDER.indexOf(from);
  const toIndex = EXPLORE_TAB_ORDER.indexOf(to);
  const tabDistance = fromIndex >= 0 && toIndex >= 0 ? Math.max(1, Math.abs(toIndex - fromIndex)) : 1;
  const distanceDurationScale = 1 + Math.max(0, tabDistance - 1) * exploreTapTransitionConfig.distanceDurationScale;
  if (baseDuration === 0 || cardsViewportWidth <= 0) {
    return 0;
  }
  return Math.round(baseDuration * exploreTapTransitionConfig.durationScale * distanceDurationScale);
}

export function computeSwipeShouldCommit(
  progress: number,
  velocityX: number,
  direction: -1 | 1 = velocityX < 0 ? 1 : -1
): boolean {
  const flingTowardsTarget = direction === 1
    ? velocityX <= -exploreSwipeConfig.commitVelocityThreshold
    : velocityX >= exploreSwipeConfig.commitVelocityThreshold;

  return (
    progress >= exploreSwipeConfig.commitProgressThreshold
    || flingTowardsTarget
  );
}

export function computeSwipeSettleDuration(reducedMotionEnabled: boolean, remaining: number): number {
  if (reducedMotionEnabled) {
    return 0;
  }

  return Math.max(
    exploreSwipeConfig.minSettleDuration,
    Math.round(remaining * exploreSwipeConfig.maxSettleDuration)
  );
}
