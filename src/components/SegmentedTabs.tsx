import { useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { getMotionDuration, getMotionEasing, useReducedMotionEnabled } from "../utils/motion";
import { normalizeRomanianText } from "../utils/text";
import { PillBadge } from "./PillBadge";

export type SegmentedTabItem = {
  key: string;
  label: string;
  badgeLabel?: string | number;
  disabled?: boolean;
};

export type SegmentedTabsVariant = "pills" | "folder";
export type SegmentedTabsPalette =
  | "default"
  | "favoritesUniversities"
  | "favoritesFaculties"
  | "favoritesPrograms";
export type SegmentedTabsMotionSource = "tap" | "swipe";
export type SegmentedTabsSwipePreview = {
  fromIndex: SharedValue<number>;
  toIndex: SharedValue<number>;
  progress: SharedValue<number>;
};

type SegmentedTabsProps = {
  items: SegmentedTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: SegmentedTabsVariant;
  palette?: SegmentedTabsPalette;
  folderWidthRatio?: number;
  motionSource?: SegmentedTabsMotionSource;
  swipePreview?: SegmentedTabsSwipePreview;
  style?: StyleProp<ViewStyle>;
};

type FolderPalette = {
  activeBackground: string;
  activeText: string;
  line: string;
  inactiveBackgrounds: [string, string, string];
};

type FolderTabProps = {
  item: SegmentedTabItem;
  index: number;
  isActive: boolean;
  stackDepth: number;
  inactiveBackground: string;
  palette: FolderPalette;
  onPress: () => void;
  reducedMotionEnabled: boolean;
  animateTransitions: boolean;
};

type PillTabLabelProps = {
  index: number;
  label: string;
  itemsCount: number;
  indicatorIndex: SharedValue<number>;
  swipePreview?: SegmentedTabsSwipePreview;
};

const FOLDER_PALETTES: Record<SegmentedTabsPalette, FolderPalette> = {
  default: {
    activeBackground: theme.colors.tabInactive,
    activeText: theme.colors.textPrimary,
    line: theme.colors.mutedSand,
    inactiveBackgrounds: [theme.colors.tabInactiveDarker, theme.colors.tabInactive, theme.colors.sandMuted],
  },
  favoritesUniversities: {
    activeBackground: theme.colors.accentMuted,
    activeText: theme.colors.accent,
    line: theme.colors.accentMuted,
    inactiveBackgrounds: [theme.colors.tabInactiveDarker, theme.colors.tabInactive, theme.colors.sandMuted],
  },
  favoritesFaculties: {
    activeBackground: theme.colors.sageSoft,
    activeText: theme.colors.oliveDark,
    line: theme.colors.sageSoft,
    inactiveBackgrounds: [theme.colors.tabInactiveDarker, theme.colors.tabInactive, theme.colors.sandMuted],
  },
  favoritesPrograms: {
    activeBackground: theme.colors.mutedSand,
    activeText: theme.colors.textPrimary,
    line: theme.colors.mutedSand,
    inactiveBackgrounds: [theme.colors.tabInactiveDarker, theme.colors.tabInactive, theme.colors.sandMuted],
  },
};

const PILL_CONTAINER_INSET = 6;
const PILL_HORIZONTAL_PADDING = PILL_CONTAINER_INSET;
const PILL_TAB_GAP = theme.spacing.xs;
const FOLDER_TAB_OVERLAP = theme.spacing.md;
const PILL_LABEL_ACTIVE_COLOR = theme.colors.textPrimary;
const PILL_LABEL_INACTIVE_COLOR = theme.colors.textPrimary50;

function FolderTab({
  item,
  index,
  isActive,
  stackDepth,
  inactiveBackground,
  palette,
  onPress,
  reducedMotionEnabled,
  animateTransitions,
}: FolderTabProps): React.JSX.Element {
  const liftProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    const duration = animateTransitions ? getMotionDuration(reducedMotionEnabled, "normal") : 0;
    const easing = getMotionEasing(reducedMotionEnabled, "enter");
    const nextValue = isActive ? 1 : 0;

    if (duration === 0) {
      liftProgress.value = nextValue;
      return;
    }

    liftProgress.value = withTiming(nextValue, { duration, easing });
  }, [animateTransitions, isActive, liftProgress, reducedMotionEnabled]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.92 + liftProgress.value * 0.08,
    };
  });

  return (
    <Animated.View
      style={[
        styles.folderTabSlot,
        index > 0 ? styles.folderTabOverlap : null,
        { zIndex: stackDepth },
        animatedContainerStyle,
      ]}
    >
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled: item.disabled }}
        disabled={item.disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.folderTab,
          {
            backgroundColor: isActive ? palette.activeBackground : inactiveBackground,
            opacity: item.disabled ? theme.opacity.disabled : pressed ? 0.94 : 1,
            borderColor: isActive ? palette.line : theme.colors.borderSoft,
          },
          shadows.none,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.folderLabel,
            {
              color: isActive ? palette.activeText : theme.colors.textPrimary40,
            },
          ]}
        >
          {normalizeRomanianText(item.label)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PillTabLabel({
  index,
  label,
  itemsCount,
  indicatorIndex,
  swipePreview,
}: PillTabLabelProps): React.JSX.Element {
  const animatedLabelStyle = useAnimatedStyle(() => {
    const hasSwipePreview =
      swipePreview !== undefined
      && swipePreview.fromIndex.value >= 0
      && swipePreview.toIndex.value >= 0
      && swipePreview.fromIndex.value < itemsCount
      && swipePreview.toIndex.value < itemsCount;

    const fallbackIndex = indicatorIndex.value;
    const currentIndex = hasSwipePreview
      ? swipePreview.fromIndex.value
      + (swipePreview.toIndex.value - swipePreview.fromIndex.value)
      * Math.max(0, Math.min(1, swipePreview.progress.value))
      : fallbackIndex;

    const distance = Math.abs(currentIndex - index);
    const emphasis = Math.max(0, 1 - Math.min(1, distance));

    return {
      color: interpolateColor(
        emphasis,
        [0, 1],
        [PILL_LABEL_INACTIVE_COLOR, PILL_LABEL_ACTIVE_COLOR]
      ),
    };
  }, [index, indicatorIndex, itemsCount, swipePreview]);

  return (
    <Animated.Text style={[styles.pillLabel, animatedLabelStyle]}>
      {normalizeRomanianText(label)}
    </Animated.Text>
  );
}

export function SegmentedTabs({
  items,
  activeKey,
  onChange,
  variant = "pills",
  palette = "default",
  folderWidthRatio = 1,
  motionSource = "tap",
  swipePreview,
  style,
}: SegmentedTabsProps): React.JSX.Element {
  const reducedMotionEnabled = useReducedMotionEnabled();
  const animateTransitions = !reducedMotionEnabled;
  const [pillContainerWidth, setPillContainerWidth] = useState(0);
  const folderPalette = FOLDER_PALETTES[palette];
  const clampedFolderWidthRatio = Math.max(0.6, Math.min(1, folderWidthRatio));
  const folderWidthPercent = `${Math.round(clampedFolderWidthRatio * 100)}%` as `${number}%`;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey)
  );
  const previousActiveIndexRef = useRef(activeIndex);

  const pillWidth = useMemo(() => {
    if (pillContainerWidth <= 0 || items.length === 0) {
      return 0;
    }

    const totalGapWidth = PILL_TAB_GAP * Math.max(0, items.length - 1);
    const horizontalPadding = PILL_HORIZONTAL_PADDING * 2;
    const available = pillContainerWidth - totalGapWidth - horizontalPadding;
    return available > 0 ? available / items.length : 0;
  }, [items.length, pillContainerWidth]);

  const indicatorMetrics = useMemo(() => {
    const translateX = activeIndex * (pillWidth + PILL_TAB_GAP);
    return {
      translateX,
      width: pillWidth,
      opacity: pillWidth > 0 ? 1 : 0,
    };
  }, [activeIndex, pillWidth]);

  const onPillContainerLayout = (event: LayoutChangeEvent): void => {
    setPillContainerWidth(event.nativeEvent.layout.width);
  };

  const indicatorTranslateX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorIndex = useSharedValue(activeIndex);

  useEffect(() => {
    const hasMeasuredIndicator = indicatorWidth.value > 0;
    const indexDistance = Math.abs(activeIndex - previousActiveIndexRef.current);
    const distanceScale = 1 + Math.max(0, indexDistance - 1) * 0.55;
    const duration = Math.round(getMotionDuration(reducedMotionEnabled, "normal") * 0.92 * distanceScale);
    const easing = getMotionEasing(reducedMotionEnabled, "enter");

    if (!animateTransitions || !hasMeasuredIndicator) {
      indicatorTranslateX.value = indicatorMetrics.translateX;
      indicatorWidth.value = indicatorMetrics.width;
      indicatorIndex.value = activeIndex;
      previousActiveIndexRef.current = activeIndex;
      return;
    }

    indicatorTranslateX.value = withTiming(indicatorMetrics.translateX, { duration, easing });
    indicatorWidth.value = withTiming(indicatorMetrics.width, { duration, easing });
    indicatorIndex.value = withTiming(activeIndex, { duration, easing });
    previousActiveIndexRef.current = activeIndex;
  }, [
    activeIndex,
    activeKey,
    indicatorMetrics.translateX,
    indicatorMetrics.width,
    indicatorIndex,
    indicatorTranslateX,
    indicatorWidth,
    previousActiveIndexRef,
    reducedMotionEnabled,
    animateTransitions,
  ]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const hasSwipePreview =
      swipePreview !== undefined
      && pillWidth > 0
      && swipePreview.fromIndex.value >= 0
      && swipePreview.toIndex.value >= 0
      && swipePreview.fromIndex.value < items.length
      && swipePreview.toIndex.value < items.length;

    if (hasSwipePreview) {
      const progress = Math.max(0, Math.min(1, swipePreview.progress.value));
      const step = pillWidth + PILL_TAB_GAP;
      const fromTranslateX = swipePreview.fromIndex.value * step;
      const toTranslateX = swipePreview.toIndex.value * step;
      const translateX = fromTranslateX + (toTranslateX - fromTranslateX) * progress;
      return {
        transform: [{ translateX: Number.isFinite(translateX) ? translateX : 0 }],
        width: pillWidth,
        opacity: 1,
      };
    }

    return {
      transform: [{ translateX: Number.isFinite(indicatorTranslateX.value) ? indicatorTranslateX.value : 0 }],
      width: indicatorWidth.value,
      opacity: indicatorWidth.value > 0 ? 1 : 0,
    };
  }, [indicatorTranslateX, indicatorWidth, items.length, pillWidth, swipePreview]);

  if (variant === "folder") {
    return (
      <View style={style}>
        <View style={[styles.folderShell, { width: folderWidthPercent }]}>
          <View style={styles.folderRow}>
            {items.map((item, index) => {
              const isActive = activeKey === item.key;
              const inactiveBackground = folderPalette.inactiveBackgrounds[index] ?? theme.colors.tabInactive;
              const stackDepth = isActive ? items.length + 1 : index + 1;

              return (
                <FolderTab
                  key={item.key}
                  inactiveBackground={inactiveBackground}
                  index={index}
                  isActive={isActive}
                  item={item}
                  onPress={() => onChange(item.key)}
                  palette={folderPalette}
                  reducedMotionEnabled={reducedMotionEnabled}
                  animateTransitions={animateTransitions}
                  stackDepth={stackDepth}
                />
              );
            })}
          </View>
        </View>
        <View style={[styles.folderLine, { backgroundColor: folderPalette.line }]} />
      </View>
    );
  }

  return (
    <View onLayout={onPillContainerLayout} style={[styles.pillContainer, style]}>
      <Animated.View pointerEvents="none" style={[styles.pillIndicator, animatedIndicatorStyle]} />
      {items.map((item, index) => {
        const isActive = activeKey === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: item.disabled }}
            disabled={item.disabled}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.pillTab,
              {
                opacity: item.disabled ? theme.opacity.disabled : 1,
                ...(pressed ? styles.pillTabPressed : null),
              },
            ]}
          >
            <PillTabLabel
              index={index}
              indicatorIndex={indicatorIndex}
              itemsCount={items.length}
              label={item.label}
              swipePreview={swipePreview}
            />
            {item.badgeLabel !== undefined ? (
              <PillBadge
                label={`${item.badgeLabel}`}
                size="xs"
                tone={isActive ? "accentSoft" : "neutral"}
                style={styles.badge}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    backgroundColor: theme.colors.white60,
    borderRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
    padding: PILL_CONTAINER_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    position: "relative",
  },
  pillIndicator: {
    position: "absolute",
    top: PILL_CONTAINER_INSET,
    bottom: PILL_CONTAINER_INSET,
    left: PILL_HORIZONTAL_PADDING,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    ...shadows.card,
  },
  pillTab: {
    flex: 1,
    minHeight: theme.sizes.segmentedTab,
    borderRadius: theme.radii.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    zIndex: 1,
  },
  pillTabPressed: {
    opacity: 0.86,
  },
  pillLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
  },
  folderShell: {
    alignSelf: "center",
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    overflow: "visible",
    paddingHorizontal: 0,
  },
  folderTabSlot: {
    position: "relative",
    overflow: "visible",
    flex: 1,
  },
  folderTabOverlap: {
    marginLeft: -FOLDER_TAB_OVERLAP,
  },
  folderTab: {
    width: "100%",
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    minHeight: theme.sizes.segmentedTab + theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: theme.borderWidths.regular,
    borderLeftWidth: theme.borderWidths.regular,
    borderRightWidth: theme.borderWidths.regular,
  },
  folderLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: "center",
  },
  folderLine: {
    height: theme.borderWidths.regular,
    width: "100%",
  },
});
