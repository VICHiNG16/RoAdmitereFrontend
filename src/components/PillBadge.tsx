import { MaterialIcons } from "@expo/vector-icons";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import type { AppIconName } from "../utils/icons";
import { normalizeRomanianText } from "../utils/text";

export type PillBadgeTone =
  | "accent"
  | "accentSoft"
  | "olive"
  | "oliveSoft"
  | "sand"
  | "neutral"
  | "outline";
export type PillBadgeSize = "xs" | "sm" | "md";

type PillBadgeProps = {
  label: string;
  tone?: PillBadgeTone;
  size?: PillBadgeSize;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const TONE_MAP: Record<PillBadgeTone, { background: string; text: string; border: string }> = {
  accent: {
    background: theme.colors.accent,
    text: theme.colors.textOnAccent,
    border: theme.colors.accent,
  },
  accentSoft: {
    background: theme.colors.accent10,
    text: theme.colors.accentDark,
    border: theme.colors.accent10,
  },
  olive: {
    background: theme.colors.olive,
    text: theme.colors.textOnAccent,
    border: theme.colors.olive,
  },
  oliveSoft: {
    background: theme.colors.olive10,
    text: theme.colors.oliveDark,
    border: theme.colors.olive10,
  },
  sand: {
    background: theme.colors.sand,
    text: theme.colors.textPrimary70,
    border: theme.colors.sand,
  },
  neutral: {
    background: theme.colors.surface,
    text: theme.colors.textPrimary60,
    border: theme.colors.borderSoft,
  },
  outline: {
    background: "transparent",
    text: theme.colors.textPrimary,
    border: theme.colors.border,
  },
};

const SIZE_MAP: Record<PillBadgeSize, { vertical: number; horizontal: number; icon: number; text: TextStyle }> = {
  xs: {
    vertical: theme.spacing.xxs,
    horizontal: theme.spacing.sm,
    icon: theme.sizes.iconXs,
    text: {
      fontSize: typography.size.xxs,
      lineHeight: typography.lineHeight.xxs,
      fontFamily: typography.family.bold,
    },
  },
  sm: {
    vertical: theme.spacing.xs,
    horizontal: theme.spacing.md,
    icon: theme.sizes.iconSm,
    text: {
      fontSize: typography.size.sm,
      lineHeight: typography.lineHeight.sm,
      fontFamily: typography.family.bold,
    },
  },
  md: {
    vertical: theme.spacing.sm,
    horizontal: theme.spacing.lg,
    icon: theme.sizes.iconMd,
    text: {
      fontSize: typography.size.md,
      lineHeight: typography.lineHeight.md,
      fontFamily: typography.family.bold,
    },
  },
};

export function PillBadge({
  label,
  tone = "neutral",
  size = "sm",
  leftIcon,
  rightIcon,
  uppercase = false,
  style,
  textStyle,
}: PillBadgeProps): React.JSX.Element {
  const toneToken = TONE_MAP[tone];
  const sizeToken = SIZE_MAP[size];
  const normalizedLabel = normalizeRomanianText(label);
  const displayLabel = uppercase ? normalizedLabel.toUpperCase() : normalizedLabel;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: toneToken.background,
          borderColor: toneToken.border,
          paddingVertical: sizeToken.vertical,
          paddingHorizontal: sizeToken.horizontal,
        },
        style,
      ]}
    >
      {leftIcon ? <MaterialIcons color={toneToken.text} name={leftIcon} size={sizeToken.icon} /> : null}
      <Text style={[styles.label, sizeToken.text, { color: toneToken.text }, textStyle]}>{displayLabel}</Text>
      {rightIcon ? <MaterialIcons color={toneToken.text} name={rightIcon} size={sizeToken.icon} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radii.full,
    borderWidth: theme.borderWidths.regular,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  label: {
    letterSpacing: typography.letterSpacing.wide,
  },
});

