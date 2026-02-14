import { MaterialIcons } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import type { AppIconName } from "../utils/icons";
import { usePressFeedback } from "../utils/press-feedback";
import { normalizeRomanianText } from "../utils/text";

export type PrimaryButtonVariant = "primary" | "secondary" | "ghost";
export type PrimaryButtonSize = "md" | "lg";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void | Promise<void>;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  badgeLabel?: string | number;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: PrimaryButtonSize;
  variant?: PrimaryButtonVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_MAP: Record<PrimaryButtonSize, { height: number; icon: number; textSize: number; lineHeight: number }> = {
  md: {
    height: theme.sizes.controlLg,
    icon: theme.sizes.iconMd,
    textSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  lg: {
    height: theme.sizes.controlXl,
    icon: theme.sizes.iconLg,
    textSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
};

const VARIANT_MAP: Record<
  PrimaryButtonVariant,
  { background: string; border: string; text: string; badge: string; shadow: object }
> = {
  primary: {
    background: theme.colors.accent,
    border: theme.colors.accent,
    text: theme.colors.textOnAccent,
    badge: theme.colors.white20,
    shadow: shadows.sticker,
  },
  secondary: {
    background: theme.colors.surface,
    border: theme.colors.border,
    text: theme.colors.textPrimary,
    badge: theme.colors.sand,
    shadow: shadows.card,
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: theme.colors.textPrimary60,
    badge: theme.colors.sand,
    shadow: shadows.none,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  label,
  onPress,
  leftIcon,
  rightIcon,
  badgeLabel,
  disabled = false,
  fullWidth = true,
  size = "md",
  variant = "primary",
  style,
  testID,
}: PrimaryButtonProps): React.JSX.Element {
  const sizeToken = SIZE_MAP[size];
  const variantToken = VARIANT_MAP[variant];
  const displayLabel = normalizeRomanianText(label);
  const displayBadgeLabel = typeof badgeLabel === "string" ? normalizeRomanianText(badgeLabel) : badgeLabel;
  const { animatedStyle, handlePressIn, handlePressOut } = usePressFeedback({
    disabled,
    pressedScale: 0.988,
    pressedOpacity: 0.95,
    pressInDuration: 80,
    pressOutDuration: 140,
  });

  const handlePress = (): void => {
    if (disabled || !onPress) {
      return;
    }
    void onPress();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          height: sizeToken.height,
          borderColor: variantToken.border,
          backgroundColor: variantToken.background,
          opacity: disabled ? theme.opacity.disabled : 1,
          width: fullWidth ? "100%" : undefined,
        },
        variantToken.shadow,
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {leftIcon ? <MaterialIcons color={variantToken.text} name={leftIcon} size={sizeToken.icon} /> : null}
      <Text
        style={[
          styles.label,
          {
            color: variantToken.text,
            fontSize: sizeToken.textSize,
            lineHeight: sizeToken.lineHeight,
          },
        ]}
      >
        {displayLabel}
      </Text>
      {displayBadgeLabel !== undefined ? (
        <View style={[styles.badge, { backgroundColor: variantToken.badge }]}>
          <Text style={[styles.badgeLabel, { color: variantToken.text }]}>{displayBadgeLabel}</Text>
        </View>
      ) : null}
      {rightIcon ? <MaterialIcons color={variantToken.text} name={rightIcon} size={sizeToken.icon} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: theme.borderWidths.regular,
    borderRadius: theme.radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  label: {
    fontFamily: typography.family.bold,
  },
  badge: {
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});

