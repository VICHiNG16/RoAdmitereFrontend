import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { normalizeRomanianText } from "../utils/text";
import { AnimatedCardPressable } from "./AnimatedCardPressable";
import { FavoriteButton } from "./FavoriteButton";
import { PillBadge } from "./PillBadge";

export type CardUniversityVariant = "list" | "grid" | "add";
export type CardUniversityMediaTone = "accent" | "olive";

type CardUniversityBaseProps = {
  style?: StyleProp<ViewStyle>;
};

type CardUniversityDefaultProps = CardUniversityBaseProps & {
  variant?: "list" | "grid";
  name: string;
  city: string;
  facultyCountLabel?: string;
  logoSource?: ImageSourcePropType;
  logoAlt?: string;
  mediaTone?: CardUniversityMediaTone;
  isFavorite?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
  onPress?: () => void | Promise<void>;
};

type CardUniversityAddProps = CardUniversityBaseProps & {
  variant: "add";
  ctaLabel: string;
  onPress?: () => void | Promise<void>;
};

export type CardUniversityProps = CardUniversityDefaultProps | CardUniversityAddProps;

function CardUniversityBase(props: CardUniversityProps): React.JSX.Element {
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
    city,
    facultyCountLabel,
    logoSource,
    logoAlt,
    mediaTone = "accent",
    isFavorite = true,
    onToggleFavorite,
    onPress,
    style,
  } = props;
  const isGrid = variant === "grid";
  const displayName = normalizeRomanianText(name);
  const displayCity = normalizeRomanianText(city);
  const displayFacultyCountLabel = facultyCountLabel ? normalizeRomanianText(facultyCountLabel) : undefined;
  const mediaOverlayColor = mediaTone === "olive" ? theme.colors.olive10 : theme.colors.accent10;

  return (
    <AnimatedCardPressable
      accessibilityRole="button"
      feedback="card"
      onPress={onPress}
      style={[styles.card, isGrid ? styles.cardGrid : styles.cardList, style]}
    >
      <View style={styles.favoriteButton}>
        <FavoriteButton
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          size={isGrid ? "sm" : "md"}
          tone={isGrid ? "floating" : "minimal"}
        />
      </View>

      <View style={[styles.media, isGrid ? styles.mediaGrid : styles.mediaList]}>
        <View style={[styles.mediaOverlay, { backgroundColor: mediaOverlayColor }]} />
        {logoSource ? (
          <Image accessibilityLabel={logoAlt ?? `${displayName} logo`} source={logoSource} style={styles.logo} />
        ) : (
          <MaterialIcons color={theme.colors.oliveDark} name="school" size={theme.sizes.iconXxl} />
        )}
      </View>

      <View style={[styles.content, isGrid ? styles.contentGrid : styles.contentList]}>
        <Text numberOfLines={isGrid ? 2 : 2} style={isGrid ? styles.titleGrid : styles.titleList}>
          {displayName}
        </Text>

        {isGrid ? (
          <Text numberOfLines={1} style={styles.cityGrid}>
            {displayCity}
          </Text>
        ) : (
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrapper}>
              <MaterialIcons color={theme.colors.olive} name="location-on" size={theme.sizes.iconSm} />
            </View>
            <Text numberOfLines={1} style={styles.locationLabel}>
              {displayCity}
            </Text>
          </View>
        )}

        {!isGrid ? (
          <View style={styles.footerRow}>
            {displayFacultyCountLabel ? <PillBadge label={displayFacultyCountLabel} tone="sand" size="sm" /> : <View />}
            <View style={styles.arrowButton}>
              <MaterialIcons color={theme.colors.textOnAccent} name="arrow-forward" size={theme.sizes.iconSm} />
            </View>
          </View>
        ) : null}
      </View>
    </AnimatedCardPressable>
  );
}

export const CardUniversity = memo(CardUniversityBase);

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
    height: theme.sizes.listCard,
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  cardGrid: {
    padding: theme.spacing.md,
    flexDirection: "column",
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 2,
  },
  media: {
    borderRadius: theme.radii.lg,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  mediaList: {
    width: theme.layout.cardMediaColumnWidth,
    height: "100%",
    padding: theme.spacing.lg,
  },
  mediaGrid: {
    width: "100%",
    aspectRatio: theme.ratios.square,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  mediaOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  content: {
    flex: 1,
  },
  contentList: {
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
  },
  contentGrid: {
    justifyContent: "space-between",
  },
  titleList: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    paddingRight: theme.sizes.controlMd,
  },
  titleGrid: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    marginTop: theme.spacing.xs,
    paddingRight: theme.sizes.controlMd,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  locationIconWrapper: {
    width: theme.sizes.controlSm - theme.spacing.sm,
    height: theme.sizes.controlSm - theme.spacing.sm,
    borderRadius: theme.radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.olive10,
  },
  locationLabel: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    flex: 1,
  },
  cityGrid: {
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
    marginRight: -theme.spacing.sm,
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

