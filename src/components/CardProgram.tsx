import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { resolveIconName } from "../utils/icons";
import type { AppIconName } from "../utils/icons";
import { normalizeRomanianText } from "../utils/text";
import { AnimatedCardPressable } from "./AnimatedCardPressable";
import { FavoriteButton } from "./FavoriteButton";
import { PillBadge } from "./PillBadge";

export type CardProgramVariant = "list" | "compact" | "favorite" | "add";
export type CardProgramTone = "accent" | "olive" | "deepBlue" | "neutral";

type CardProgramBaseProps = {
  style?: StyleProp<ViewStyle>;
};

type CardProgramDefaultProps = CardProgramBaseProps & {
  variant?: "list" | "compact" | "favorite";
  name: string;
  level: string;
  durationLabel?: string;
  universityName?: string;
  facultyName?: string;
  subtitle?: string;
  studyMode?: string;
  creditsLabel?: string;
  icon?: string;
  tone?: CardProgramTone;
  isFavorite?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
  onPress?: () => void | Promise<void>;
};

type CardProgramAddProps = CardProgramBaseProps & {
  variant: "add";
  ctaLabel: string;
  onPress?: () => void | Promise<void>;
};

export type CardProgramProps = CardProgramDefaultProps | CardProgramAddProps;

const TONE_MAP: Record<CardProgramTone, { iconBackground: string; iconColor: string; levelTone: "accentSoft" | "oliveSoft" | "neutral" }> = {
  accent: {
    iconBackground: theme.colors.accent10,
    iconColor: theme.colors.accent,
    levelTone: "accentSoft",
  },
  olive: {
    iconBackground: theme.colors.olive10,
    iconColor: theme.colors.oliveDark,
    levelTone: "oliveSoft",
  },
  deepBlue: {
    iconBackground: theme.colors.deepBlue10,
    iconColor: theme.colors.textPrimary,
    levelTone: "neutral",
  },
  neutral: {
    iconBackground: theme.colors.sand,
    iconColor: theme.colors.textPrimary60,
    levelTone: "neutral",
  },
};

function resolveProgramIcon(icon: string | undefined, level: string): AppIconName {
  if (icon) {
    return resolveIconName(icon, "school");
  }
  return level.toLowerCase().includes("master") ? "psychology" : "code";
}

function CardProgramBase(props: CardProgramProps): React.JSX.Element {
  if (props.variant === "add") {
    const ctaLabel = normalizeRomanianText(props.ctaLabel);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => void props.onPress?.()}
        style={({ pressed }) => [
          styles.addCard,
          {
            opacity: pressed ? 0.88 : 1,
          },
          props.style,
        ]}
      >
        <View style={styles.addIconWrapper}>
          <MaterialIcons color={theme.colors.textPrimary30} name="add" size={theme.sizes.iconXl} />
        </View>
        <Text style={styles.addLabel}>{ctaLabel}</Text>
      </Pressable>
    );
  }

  const {
    variant = "list",
    name,
    level,
    durationLabel,
    universityName,
    facultyName,
    subtitle,
    studyMode,
    creditsLabel,
    icon,
    tone = "accent",
    isFavorite = false,
    onToggleFavorite,
    onPress,
    style,
  } = props;
  const isCompact = variant === "compact";
  const isFavoriteRow = variant === "favorite";
  const displayName = normalizeRomanianText(name);
  const displayLevel = normalizeRomanianText(level);
  const displayDurationLabel = durationLabel ? normalizeRomanianText(durationLabel) : undefined;
  const displayUniversityName = universityName ? normalizeRomanianText(universityName) : undefined;
  const displayFacultyName = facultyName ? normalizeRomanianText(facultyName) : undefined;
  const displaySubtitle = subtitle ? normalizeRomanianText(subtitle) : undefined;
  const displayStudyMode = studyMode ? normalizeRomanianText(studyMode) : undefined;
  const displayCreditsLabel = creditsLabel ? normalizeRomanianText(creditsLabel) : undefined;
  const toneToken = TONE_MAP[tone];
  const iconName = resolveProgramIcon(icon, displayLevel);
  const accessibilityLabel = [
    displayName,
    displayLevel,
    isFavoriteRow ? undefined : `la ${displayUniversityName}`,
    displayFacultyName,
    displayDurationLabel,
    isFavorite ? "favorit" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <AnimatedCardPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      feedback="card"
      onPress={onPress}
      style={[styles.card, isCompact ? styles.cardCompact : isFavoriteRow ? styles.cardFavorite : styles.cardList, style]}
    >
      <View style={styles.favoriteButton}>
        <FavoriteButton
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          size={isFavoriteRow ? "sm" : "md"}
          tone={isFavoriteRow ? "floating" : isCompact ? "soft" : "minimal"}
        />
      </View>

      <View style={[styles.media, isFavoriteRow ? styles.mediaFavorite : styles.mediaDefault]}>
        <View style={[styles.mediaOverlay, { backgroundColor: toneToken.iconBackground }]} />
        <MaterialIcons color={toneToken.iconColor} name={iconName} size={theme.sizes.iconXxl} />
        {!isFavoriteRow ? (
          <PillBadge label={displayLevel} size="xs" tone={toneToken.levelTone} uppercase style={styles.levelBadge} />
        ) : null}
      </View>

      <View style={[styles.content, isFavoriteRow ? styles.contentFavorite : styles.contentDefault]}>
        {isFavoriteRow ? (
          <View style={styles.favoriteMetaRow}>
            <PillBadge label={displayLevel} size="xs" tone={toneToken.levelTone} uppercase />
            {displayDurationLabel ? (
              <Text numberOfLines={1} style={styles.favoriteDuration}>
                {displayDurationLabel}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text numberOfLines={isFavoriteRow ? 1 : 2} style={isCompact ? styles.titleCompact : styles.titleDefault}>
          {displayName}
        </Text>

        {isFavoriteRow ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {displaySubtitle ?? [displayFacultyName, displayUniversityName].filter(Boolean).join(" • ")}
          </Text>
        ) : (
          <>
            {displayUniversityName ? (
              <View style={styles.metaRow}>
                <View style={styles.metaIconOlive}>
                  <MaterialIcons color={theme.colors.olive} name="school" size={theme.sizes.iconXs} />
                </View>
                <Text numberOfLines={1} style={styles.metaText}>
                  {displayUniversityName}
                </Text>
              </View>
            ) : null}
            {displayDurationLabel ? (
              <View style={styles.metaRow}>
                <View style={styles.metaIconAccent}>
                  <MaterialIcons color={theme.colors.accent} name="schedule" size={theme.sizes.iconXs} />
                </View>
                <Text numberOfLines={1} style={styles.metaText}>
                  {displayDurationLabel}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {isCompact ? (
          <View style={styles.badgeRow}>
            {displayStudyMode ? <PillBadge label={displayStudyMode} size="xs" tone="neutral" /> : null}
            {displayCreditsLabel ? <PillBadge label={displayCreditsLabel} size="xs" tone="neutral" /> : null}
          </View>
        ) : null}

        {!isFavoriteRow ? (
          <View style={styles.footerRow}>
            {displayFacultyName ? <PillBadge label={displayFacultyName} size="sm" tone="sand" /> : <View />}
            <View style={[styles.arrowButton, isCompact ? styles.arrowButtonSoft : undefined]}>
              <MaterialIcons
                color={isCompact ? theme.colors.oliveDark : theme.colors.textOnAccent}
                name="arrow-forward"
                size={theme.sizes.iconSm}
              />
            </View>
          </View>
        ) : null}
      </View>
    </AnimatedCardPressable>
  );
}

export const CardProgram = memo(CardProgramBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    ...shadows.card,
  },
  cardList: {
    padding: theme.spacing.md,
    minHeight: theme.sizes.listCard,
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  cardCompact: {
    padding: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  cardFavorite: {
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 2,
  },
  media: {
    borderRadius: theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  mediaDefault: {
    width: theme.layout.cardMediaColumnWidth,
    minHeight: theme.sizes.listCard - theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  mediaFavorite: {
    width: theme.sizes.controlLg + theme.spacing.sm,
    height: theme.sizes.controlLg + theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
  },
  mediaOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  levelBadge: {
    marginTop: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentDefault: {
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  contentFavorite: {
    gap: theme.spacing.xs,
  },
  favoriteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginRight: theme.sizes.controlMd,
  },
  favoriteDuration: {
    color: theme.colors.textPrimary40,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
  },
  titleDefault: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    paddingRight: theme.sizes.controlMd,
  },
  titleCompact: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    paddingRight: theme.sizes.controlMd,
  },
  subtitle: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: theme.spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaIconOlive: {
    width: theme.sizes.controlSm - theme.spacing.md,
    height: theme.sizes.controlSm - theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.olive10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaIconAccent: {
    width: theme.sizes.controlSm - theme.spacing.md,
    height: theme.sizes.controlSm - theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accent10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    flex: 1,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  footerRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowButton: {
    width: theme.sizes.controlSm,
    height: theme.sizes.controlSm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -theme.spacing.sm,
  },
  arrowButtonSoft: {
    backgroundColor: theme.colors.sand,
  },
  addCard: {
    borderWidth: theme.borderWidths.strong,
    borderStyle: "dashed",
    borderColor: theme.colors.deepBlue10,
    borderRadius: theme.radii.xl,
    minHeight: theme.sizes.addCardMinHeight,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  addIconWrapper: {
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.deepBlue10,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    color: theme.colors.textPrimary40,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
});



