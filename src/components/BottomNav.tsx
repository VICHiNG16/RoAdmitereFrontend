import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import type { AppIconName } from "../utils/icons";
import { usePressFeedback } from "../utils/press-feedback";
import { normalizeRomanianText } from "../utils/text";

type TabRouteKey = "explore" | "favorites";

type BottomNavTabButtonProps = {
  label: string;
  iconName: AppIconName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function resolveTabRouteKey(routeName: string): TabRouteKey | undefined {
  const normalized = routeName.replace(/^\(tabs\)\//, "").replace(/\/index$/, "");
  const lastSegment = normalized.split("/").pop();

  if (lastSegment === "explore" || lastSegment === "favorites") {
    return lastSegment;
  }

  return undefined;
}

function resolveTabIcon(routeKey: TabRouteKey | undefined, isFocused: boolean): AppIconName {
  if (routeKey === "explore") {
    return "explore";
  }
  if (routeKey === "favorites") {
    return isFocused ? "favorite" : "favorite-border";
  }
  return "circle";
}

function resolveTabLabel(rawLabel: string, routeName: string, routeKey: TabRouteKey | undefined): string {
  if (rawLabel === routeName) {
    if (routeKey === "explore") {
      return "Explorează";
    }
    if (routeKey === "favorites") {
      return "Favorite";
    }
  }

  return normalizeRomanianText(rawLabel);
}

function BottomNavTabButton({
  label,
  iconName,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: BottomNavTabButtonProps): React.JSX.Element {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressFeedback({
    pressedScale: 0.978,
    pressedOpacity: 0.95,
    pressInDuration: 70,
    pressOutDuration: 140,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tab, animatedStyle]}
    >
      <View style={[styles.tabInner, isFocused ? styles.tabInnerActive : styles.tabInnerInactive]}>
        <MaterialIcons
          name={iconName}
          size={theme.sizes.iconLg}
          color={isFocused ? theme.colors.accent : theme.colors.textPrimary40}
        />
        <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
          {label}
        </Text>
        <View style={[styles.dot, isFocused ? styles.dotActive : styles.dotInactive]} />
      </View>
    </AnimatedPressable>
  );
}

export function BottomNav({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps): React.JSX.Element {
  const bottomInset = Math.max(insets.bottom, theme.spacing.xs);

  return (
    <View style={styles.outer}>
      <View style={[styles.wrapper, { paddingBottom: bottomInset + theme.spacing.xs }]}>
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const isFocused = state.index === index;
            const routeKey = resolveTabRouteKey(route.name);
            const rawLabel =
              typeof descriptor.options.tabBarLabel === "string"
                ? descriptor.options.tabBarLabel
                : (descriptor.options.title as string | undefined) ?? route.name;
            const label = resolveTabLabel(rawLabel, route.name, routeKey);
            const iconName = resolveTabIcon(routeKey, isFocused);

            const onPress = (): void => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = (): void => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <BottomNavTabButton
                accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
                iconName={iconName}
                isFocused={isFocused}
                key={route.key}
                label={label}
                onLongPress={onLongPress}
                onPress={onPress}
                testID={descriptor.options.tabBarButtonTestID}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "transparent",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 0,
  },
  wrapper: {
    minHeight: theme.sizes.bottomNav - theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    position: "relative",
    overflow: "hidden",
    ...shadows.nav,
  },
  row: {
    flexDirection: "row",
    gap: 0,
    paddingHorizontal: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: theme.sizes.controlLg,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  tabInner: {
    alignSelf: "center",
    width: "92%",
    borderRadius: theme.radii.xxl,
    minHeight: theme.sizes.controlLg,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.xs,
  },
  tabInnerActive: {
    backgroundColor: "transparent",
  },
  tabInnerInactive: {
    backgroundColor: "transparent",
  },
  label: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontFamily: typography.family.bold,
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
  labelInactive: {
    color: theme.colors.textPrimary50,
  },
  dot: {
    width: theme.spacing.xxs,
    height: theme.spacing.xxs,
    borderRadius: theme.radii.full,
    marginTop: theme.spacing.xxs,
  },
  dotActive: {
    backgroundColor: theme.colors.accent,
  },
  dotInactive: {
    backgroundColor: "transparent",
  },
});
