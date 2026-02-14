import { MaterialIcons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import type { AppIconName } from "../utils/icons";

export type FavoriteButtonSize = "sm" | "md" | "lg";
export type FavoriteButtonTone = "floating" | "soft" | "minimal";

type FavoriteButtonProps = {
  isFavorite: boolean;
  onPress?: () => void | Promise<void>;
  size?: FavoriteButtonSize;
  tone?: FavoriteButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

const SIZE_TOKENS: Record<
  FavoriteButtonSize,
  { box: number; icon: number; radius: number; padding: number }
> = {
  sm: {
    box: theme.sizes.controlSm,
    icon: theme.sizes.iconLg,
    radius: theme.radii.lg,
    padding: theme.spacing.xs,
  },
  md: {
    box: theme.sizes.controlMd,
    icon: theme.sizes.iconXl,
    radius: theme.radii.lg,
    padding: theme.spacing.sm,
  },
  lg: {
    box: theme.sizes.controlLg,
    icon: theme.sizes.iconXxl,
    radius: theme.radii.lg,
    padding: theme.spacing.md,
  },
};

const TONE_TOKENS: Record<FavoriteButtonTone, { background: string; border: string; shadow: object }> = {
  floating: {
    background: theme.colors.white80,
    border: theme.colors.borderSoft,
    shadow: shadows.card,
  },
  soft: {
    background: theme.colors.surface,
    border: theme.colors.borderSoft,
    shadow: shadows.none,
  },
  minimal: {
    background: "transparent",
    border: "transparent",
    shadow: shadows.none,
  },
};

function FavoriteButtonBase({
  isFavorite,
  onPress,
  size = "md",
  tone = "floating",
  disabled = false,
  accessibilityLabel,
  testID,
}: FavoriteButtonProps): React.JSX.Element {
  const sizeToken = SIZE_TOKENS[size];
  const toneToken = TONE_TOKENS[tone];
  const buttonPadding = tone === "minimal" ? 0 : sizeToken.padding;
  const iconName: AppIconName = isFavorite ? "favorite" : "favorite-border";
  const iconSize =
    tone === "minimal" && size === "md"
      ? theme.sizes.iconXxl
      : sizeToken.icon;
  const iconColor = isFavorite ? theme.colors.accent : theme.colors.textPrimary50;
  const iconStyle = tone === "minimal" && isFavorite ? styles.minimalIconShadow : null;

  const handlePress = useCallback((): void => {
    if (disabled || !onPress) {
      return;
    }
    void onPress();
  }, [disabled, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isFavorite }}
      accessibilityLabel={accessibilityLabel ?? (isFavorite ? "Remove from favorites" : "Add to favorites")}
      disabled={disabled}
      hitSlop={theme.spacing.xs}
      onPress={handlePress}
      style={[
        styles.button,
        {
          width: sizeToken.box,
          height: sizeToken.box,
          borderRadius: sizeToken.radius,
          padding: buttonPadding,
          backgroundColor: toneToken.background,
          borderColor: toneToken.border,
          opacity: disabled ? theme.opacity.disabled : 1,
        },
        toneToken.shadow,
      ]}
      testID={testID}
    >
      <View style={styles.iconWrapper}>
        <MaterialIcons color={iconColor} name={iconName} size={iconSize} style={iconStyle} />
      </View>
    </Pressable>
  );
}

export const FavoriteButton = memo(FavoriteButtonBase);

const styles = StyleSheet.create({
  button: {
    borderWidth: theme.borderWidths.regular,
    alignItems: "center",
    justifyContent: "center",
  },
  minimalIconShadow: {
    textShadowColor: "rgba(61, 64, 91, 0.22)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
