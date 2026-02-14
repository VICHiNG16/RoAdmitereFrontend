import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { resolveIconName } from "../utils/icons";
import { normalizeRomanianText } from "../utils/text";
import { AnimatedCardPressable } from "./AnimatedCardPressable";
import { FavoriteButton } from "./FavoriteButton";
import { PillBadge } from "./PillBadge";

export type CardFacultyVariant = "list" | "grid" | "detail" | "add";
export type CardFacultyTone = "accent" | "olive" | "neutral";

type CardFacultyBaseProps = {
  style?: StyleProp<ViewStyle>;
};

type CardFacultyDefaultProps = CardFacultyBaseProps & {
  variant?: "list" | "grid" | "detail";
  name: string;
  universityName: string;
  domain?: string;
  description?: string;
  programCountLabel?: string;
  icon?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
  onPress?: () => void | Promise<void>;
  tone?: CardFacultyTone;
};

type CardFacultyAddProps = CardFacultyBaseProps & {
  variant: "add";
  ctaLabel: string;
  onPress?: () => void | Promise<void>;
};

export type CardFacultyProps = CardFacultyDefaultProps | CardFacultyAddProps;

const TONE_MAP: Record<CardFacultyTone, { iconBackground: string; iconColor: string }> = {
  accent: {
    iconBackground: theme.colors.accent10,
    iconColor: theme.colors.accent,
  },
  olive: {
    iconBackground: theme.colors.olive10,
    iconColor: theme.colors.olive,
  },
  neutral: {
    iconBackground: theme.colors.sand,
    iconColor: theme.colors.textPrimary60,
  },
};

function CardFacultyBase(props: CardFacultyProps): React.JSX.Element {
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
    universityName,
    domain,
    description,
    programCountLabel,
    icon,
    isFavorite = false,
    onToggleFavorite,
    onPress,
    tone = "accent",
    style,
  } = props;
  const isGrid = variant === "grid";
  const isDetail = variant === "detail";
  const toneToken = TONE_MAP[tone];
  const iconName = resolveIconName(icon, "school");
  const displayName = normalizeRomanianText(name);
  const displayUniversityName = normalizeRomanianText(universityName);
  const displayDomain = domain ? normalizeRomanianText(domain) : undefined;
  const displayDescription = description ? normalizeRomanianText(description) : undefined;
  const displayProgramCountLabel = programCountLabel ? normalizeRomanianText(programCountLabel) : undefined;
  const iconPanelStyle = isGrid ? styles.iconPanelGrid : isDetail ? styles.iconPanelDetail : styles.iconPanelList;
  const contentStyle = isGrid ? styles.contentGrid : isDetail ? styles.contentDetail : styles.contentList;

  return (
    <AnimatedCardPressable
      accessibilityRole="button"
      feedback="card"
      onPress={onPress}
      style={[styles.card, isGrid ? styles.cardGrid : isDetail ? styles.cardDetail : styles.cardList, style]}
    >
      {isDetail ? null : (
        <View style={styles.favoriteButton}>
          <FavoriteButton
            isFavorite={isFavorite}
            onPress={onToggleFavorite}
            size={isGrid ? "sm" : "md"}
            tone={isGrid ? "floating" : "minimal"}
          />
        </View>
      )}

      <View style={[styles.iconPanel, iconPanelStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: toneToken.iconBackground }]}>
          <MaterialIcons color={toneToken.iconColor} name={iconName} size={theme.sizes.iconXxl} />
        </View>
      </View>

      <View style={[styles.content, contentStyle]}>
        <Text numberOfLines={isGrid ? 2 : 1} style={isGrid ? styles.titleGrid : styles.titleList}>
          {displayName}
        </Text>

        {!isGrid ? (
          <>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <MaterialIcons color={theme.colors.textPrimary60} name="school" size={theme.sizes.iconXs} />
              </View>
              <Text numberOfLines={1} style={styles.metaText}>
                {displayUniversityName}
              </Text>
            </View>
            {displayDomain ? (
              <View style={styles.metaRow}>
                <View style={styles.metaIconOlive}>
                  <MaterialIcons color={theme.colors.olive} name="category" size={theme.sizes.iconXs} />
                </View>
                <Text numberOfLines={1} style={styles.domainText}>
                  {displayDomain}
                </Text>
              </View>
            ) : null}
            {isDetail && displayDescription ? (
              <Text numberOfLines={3} style={styles.descriptionText}>
                {displayDescription}
              </Text>
            ) : null}
          </>
        ) : (
          <Text numberOfLines={1} style={styles.universityGrid}>
            {displayUniversityName}
          </Text>
        )}

        {displayProgramCountLabel ? (
          <View style={styles.footerRow}>
            <PillBadge label={displayProgramCountLabel} size={isDetail ? "xs" : "sm"} tone="accentSoft" />
            {!isGrid ? (
              <View style={[styles.arrowButton, !isDetail ? styles.arrowButtonAligned : undefined, isDetail ? styles.arrowButtonSoft : undefined]}>
                <MaterialIcons
                  color={isDetail ? theme.colors.oliveDark : theme.colors.textOnAccent}
                  name="arrow-forward"
                  size={theme.sizes.iconSm}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </AnimatedCardPressable>
  );
}

export const CardFaculty = memo(CardFacultyBase);

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
  cardGrid: {
    padding: theme.spacing.md,
    flexDirection: "column",
  },
  cardDetail: {
    padding: theme.spacing.md,
    flexDirection: "column",
    gap: theme.spacing.md,
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 2,
  },
  iconPanel: {
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPanelList: {
    width: theme.layout.cardMediaColumnWidth,
    minHeight: theme.sizes.listCard - theme.spacing.xl,
  },
  iconPanelGrid: {
    width: "100%",
    aspectRatio: theme.ratios.square,
    marginBottom: theme.spacing.md,
  },
  iconPanelDetail: {
    width: theme.sizes.controlLg,
    height: theme.sizes.controlLg,
  },
  iconCircle: {
    width: theme.sizes.controlLg,
    height: theme.sizes.controlLg,
    borderRadius: theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentList: {
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  contentGrid: {
    justifyContent: "space-between",
  },
  contentDetail: {
    gap: theme.spacing.xs,
  },
  titleList: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    paddingRight: theme.sizes.controlMd,
  },
  titleGrid: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    paddingRight: theme.sizes.controlMd,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaIcon: {
    width: theme.sizes.controlSm - theme.spacing.md,
    height: theme.sizes.controlSm - theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  metaIconOlive: {
    width: theme.sizes.controlSm - theme.spacing.md,
    height: theme.sizes.controlSm - theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.olive10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    flex: 1,
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  domainText: {
    flex: 1,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  descriptionText: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  universityGrid: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
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
  },
  arrowButtonAligned: {
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

