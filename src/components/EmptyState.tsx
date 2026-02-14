import { MaterialIcons } from "@expo/vector-icons";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import type { AppIconName } from "../utils/icons";
import { normalizeRomanianText } from "../utils/text";
import { PrimaryButton } from "./PrimaryButton";

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void | Promise<void>;
  icon?: AppIconName;
  accentIcon?: AppIconName;
  supportIcon?: AppIconName;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  ctaLabel,
  onPressCta,
  icon = "backpack",
  accentIcon = "search",
  supportIcon = "menu-book",
  style,
}: EmptyStateProps): React.JSX.Element {
  const displayTitle = normalizeRomanianText(title);
  const displayDescription = normalizeRomanianText(description);
  const displayCtaLabel = ctaLabel ? normalizeRomanianText(ctaLabel) : undefined;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.visualShell}>
        <View style={styles.visualCard}>
          <MaterialIcons
            color={theme.colors.accent}
            name={icon}
            size={theme.sizes.iconHero}
            style={styles.mainIcon}
          />
          <View style={styles.accentBadge}>
            <MaterialIcons color={theme.colors.accent} name={accentIcon} size={theme.sizes.iconXxl} />
          </View>
          <View style={styles.supportBadge}>
            <MaterialIcons color={theme.colors.oliveDark} name={supportIcon} size={theme.sizes.iconXl} />
          </View>
        </View>
      </View>

      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>

      {displayCtaLabel ? (
        <View style={styles.ctaWrapper}>
          <PrimaryButton label={displayCtaLabel} onPress={onPressCta} rightIcon="arrow-forward" size="lg" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xxxl,
    paddingVertical: theme.spacing.xxxl,
  },
  visualShell: {
    width: "100%",
    maxWidth: theme.sizes.emptyStateMax,
    aspectRatio: theme.ratios.square,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xxl,
  },
  visualCard: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.white60,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  mainIcon: {
    opacity: theme.opacity.muted,
  },
  accentBadge: {
    position: "absolute",
    right: -theme.spacing.xs,
    bottom: -theme.spacing.xs,
    width: theme.sizes.controlLg,
    height: theme.sizes.controlLg,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  supportBadge: {
    position: "absolute",
    left: -theme.spacing.sm,
    top: -theme.spacing.sm,
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  description: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.regular,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: "center",
    marginBottom: theme.spacing.xxl,
  },
  ctaWrapper: {
    width: "100%",
  },
});

