import { FlashList } from "@shopify/flash-list";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveStitchAsset } from "../../../src/assets-map";
import { FavoriteButton, PillBadge, PrimaryButton } from "../../../src/components";
import type { Faculty } from "../../../src/data/mock/types";
import { normalizeForSearch, sortByFixedOrder } from "../../../src/features/explore";
import { useAppState } from "../../../src/state/app-state";
import { shadows } from "../../../src/theme/shadows";
import { theme } from "../../../src/theme/theme";
import { typography } from "../../../src/theme/typography";
import type { AppIconName } from "../../../src/utils/icons";
import { openOfficialSiteWithFeedback } from "../../../src/utils/official-links";
import { normalizeRomanianText } from "../../../src/utils/text";

type FacultyTileTone = "olive" | "accent" | "sky" | "amber" | "rose";
type FacultyTileVisual = {
  icon: AppIconName;
  tone: FacultyTileTone;
  fullWidth?: boolean;
};

type FacultyGridRow = {
  key: string;
  left: Faculty;
  right?: Faculty;
  fullWidth: boolean;
};

const DEFAULT_UNIVERSITY_ID = "university-universitatea-babes-bolyai";
const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAz3OkBv3tPs2WMWjJdPpp0uiljhSjtd-WPJ70EsGOBP49i87ePDb_fJT7c1Oe_dcqkqLHNQhWrikv6SCvj_9mpbagp2TUt1EYbckONUBGFzlbl03Hv3qP1Mtp-kFvBYo4TdMdbXzBKEs9AufzcZN8-fqn_jAnvYMw8WtiIIV1onf-V_JYDiOGZs3f9m6StF8Du5c78zbc7F682fO-39WvfjN4M3sUn32fuDreHKlhJH2VGd71hAPJ3gAFuVSSqxe3pfJvsMdvPOmk";

const UNIVERSITY_FACULTY_ORDER = [
  "faculty-matematica-si-informatica",
  "faculty-drept",
  "faculty-geografie",
  "faculty-teatru-si-film",
  "faculty-litere",
] as const;

const FACULTY_VISUAL_BY_ID: Record<string, FacultyTileVisual> = {
  "faculty-matematica-si-informatica": { icon: "psychology", tone: "olive" },
  "faculty-drept": { icon: "gavel", tone: "accent" },
  "faculty-geografie": { icon: "public", tone: "sky" },
  "faculty-teatru-si-film": { icon: "theater-comedy", tone: "amber" },
  "faculty-litere": { icon: "menu-book", tone: "rose", fullWidth: true },
};

const FACULTY_TONE_COLORS: Record<FacultyTileTone, { iconBackground: string; iconColor: string }> = {
  olive: { iconBackground: theme.colors.olive10, iconColor: theme.colors.olive },
  accent: { iconBackground: theme.colors.accent10, iconColor: theme.colors.accent },
  sky: { iconBackground: theme.colors.infoBlueSoft, iconColor: theme.colors.infoBlue },
  amber: { iconBackground: theme.colors.amberSoft, iconColor: theme.colors.amber },
  rose: { iconBackground: theme.colors.roseSoft, iconColor: theme.colors.rose },
};

const FACULTY_ROW_ESTIMATED_HEIGHT = 190;

function getRouteParamId(idParam: string | string[] | undefined): string | undefined {
  if (Array.isArray(idParam)) {
    return idParam[0];
  }
  return idParam;
}

function orderedFacultiesFromScreen(faculties: Faculty[]): Faculty[] {
  return sortByFixedOrder(faculties, UNIVERSITY_FACULTY_ORDER);
}

function getFacultyVisual(faculty: Faculty): FacultyTileVisual {
  return FACULTY_VISUAL_BY_ID[faculty.id] ?? {
    icon: (faculty.icon as AppIconName) || "school",
    tone: "accent",
  };
}

function buildFacultyRows(faculties: Faculty[]): FacultyGridRow[] {
  const rows: FacultyGridRow[] = [];
  let pendingHalf: Faculty | null = null;

  for (const faculty of faculties) {
    const visual = getFacultyVisual(faculty);
    if (visual.fullWidth) {
      if (pendingHalf) {
        rows.push({
          key: `row-${pendingHalf.id}`,
          left: pendingHalf,
          fullWidth: false,
        });
        pendingHalf = null;
      }

      rows.push({
        key: `row-${faculty.id}`,
        left: faculty,
        fullWidth: true,
      });
      continue;
    }

    if (!pendingHalf) {
      pendingHalf = faculty;
      continue;
    }

    rows.push({
      key: `row-${pendingHalf.id}-${faculty.id}`,
      left: pendingHalf,
      right: faculty,
      fullWidth: false,
    });
    pendingHalf = null;
  }

  if (pendingHalf) {
    rows.push({
      key: `row-${pendingHalf.id}`,
      left: pendingHalf,
      fullWidth: false,
    });
  }

  return rows;
}

type FacultyTileProps = {
  faculty: Faculty;
  visual: FacultyTileVisual;
  fullWidth: boolean;
  onPress: () => void;
};

const FacultyTile = memo(function FacultyTile({ faculty, visual, fullWidth, onPress }: FacultyTileProps): React.JSX.Element {
  const toneTokens = FACULTY_TONE_COLORS[visual.tone];
  const facultyName = normalizeRomanianText(faculty.name);
  const facultyDescription = faculty.description ? normalizeRomanianText(faculty.description) : undefined;
  const facultyProgramCountLabel = faculty.programCountLabel ? normalizeRomanianText(faculty.programCountLabel) : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.facultyTile,
        fullWidth ? styles.facultyTileFull : styles.facultyTileHalf,
        {
          transform: [{ scale: pressed ? theme.motion.pressScale.card : 1 }],
        },
      ]}
    >
      <View style={[styles.facultyIconWrapper, { backgroundColor: toneTokens.iconBackground }]}>
        <MaterialIcons color={toneTokens.iconColor} name={visual.icon} size={theme.sizes.iconXl} />
      </View>

      <View style={[styles.facultyBody, fullWidth ? styles.facultyBodyFull : undefined]}>
        <Text numberOfLines={fullWidth ? 1 : 2} style={styles.facultyTitle}>
          {facultyName}
        </Text>
        {facultyDescription ? (
          <Text numberOfLines={fullWidth ? 2 : 3} style={styles.facultyDescription}>
            {facultyDescription}
          </Text>
        ) : null}
        {facultyProgramCountLabel ? (
          <Text numberOfLines={1} style={styles.facultyCountLabel}>
            {facultyProgramCountLabel}
          </Text>
        ) : null}
      </View>

      {fullWidth ? (
        <View style={styles.facultyArrow}>
          <MaterialIcons color={theme.colors.textPrimary30} name="chevron-right" size={theme.sizes.iconLg} />
        </View>
      ) : null}
    </Pressable>
  );
});

export default function UniversityDetailRoute(): React.JSX.Element {
  const router = useRouter();
  const { universities: allUniversities, faculties: allFaculties, isFavorite, toggleFavorite } = useAppState();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = getRouteParamId(params.id);

  const university = useMemo(() => {
    const selected = allUniversities.find((item) => item.id === routeId);
    if (selected) {
      return selected;
    }
    return allUniversities.find((item) => item.id === DEFAULT_UNIVERSITY_ID) ?? allUniversities[0];
  }, [allUniversities, routeId]);

  const faculties = useMemo(() => {
    if (!university) {
      return [];
    }

    const universityName = normalizeForSearch(university.name);
    const facultiesForUniversity = allFaculties.filter(
      (faculty) => normalizeForSearch(faculty.universityName) === universityName
    );
    return orderedFacultiesFromScreen(facultiesForUniversity);
  }, [allFaculties, university]);

  const facultyRows = useMemo(() => buildFacultyRows(faculties), [faculties]);

  const title = normalizeRomanianText(university?.name ?? "Universitate");
  const universityId = university?.id ?? DEFAULT_UNIVERSITY_ID;
  const locationLabel = normalizeRomanianText(university?.locationLabel || [university?.city, "România"].filter(Boolean).join(", "));
  const description = normalizeRomanianText(university?.description || "Detalii disponibile în curând.");
  const facultyTotalBadge =
    university?.facultyCount !== null && university?.facultyCount !== undefined
      ? `${university.facultyCount} total`
      : faculties.length > 0
        ? `${faculties.length} total`
        : normalizeRomanianText(university?.facultyCountLabel ?? "");
  const logoSource = resolveStitchAsset(university?.logoUrl);
  const heroImageSource = resolveStitchAsset(HERO_IMAGE_URL);

  const renderFacultyRow = useCallback(
    ({ item }: { item: FacultyGridRow }): React.JSX.Element => {
      const leftVisual = getFacultyVisual(item.left);

      if (item.fullWidth) {
        return (
          <View style={styles.facultyRowFull}>
            <FacultyTile
              faculty={item.left}
              fullWidth
              onPress={() => {
                void router.push({
                  pathname: "/modals/faculty/[id]",
                  params: { id: item.left.id },
                });
              }}
              visual={leftVisual}
            />
          </View>
        );
      }

      return (
        <View style={styles.facultyRowHalf}>
          <View style={styles.halfCell}>
            <FacultyTile
              faculty={item.left}
              fullWidth={false}
              onPress={() => {
                void router.push({
                  pathname: "/modals/faculty/[id]",
                  params: { id: item.left.id },
                });
              }}
              visual={leftVisual}
            />
          </View>

          {item.right ? (
            <View style={styles.halfCell}>
              <FacultyTile
                faculty={item.right}
                fullWidth={false}
                onPress={() => {
                  void router.push({
                    pathname: "/modals/faculty/[id]",
                    params: { id: item.right!.id },
                  });
                }}
                visual={getFacultyVisual(item.right)}
              />
            </View>
          ) : (
            <View style={styles.halfCell} />
          )}
        </View>
      );
    },
    [router]
  );

  return (
    <View style={styles.root}>
      <FlashList
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.xl,
          },
        ]}
        data={facultyRows}
        drawDistance={FACULTY_ROW_ESTIMATED_HEIGHT * 3}
        getItemType={(item) => (item.fullWidth ? "full-width" : "half-width")}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        renderItem={renderFacultyRow}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={FacultyRowSeparator}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              {heroImageSource ? <Image source={heroImageSource} style={styles.heroImage} /> : <View style={styles.heroFallback} />}
              <View style={styles.heroOverlay} />

              <Pressable
                accessibilityLabel="Înapoi"
                accessibilityRole="button"
                onPress={() => router.back()}
                style={[styles.backButton, { top: insets.top + theme.spacing.xl }]}
              >
                <MaterialIcons color={theme.colors.textOnAccent} name="arrow-back" size={theme.sizes.iconLg} />
              </Pressable>

              <View style={styles.logoRing}>
                <View style={styles.logoCircle}>
                  {logoSource ? (
                    <Image
                      accessibilityLabel={normalizeRomanianText(university?.logoAlt ?? "Logo universitate")}
                      source={logoSource}
                      style={styles.logoImage}
                    />
                  ) : (
                    <MaterialIcons color={theme.colors.oliveDark} name="school" size={theme.sizes.iconXxl} />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>

              <View style={styles.locationRow}>
                <MaterialIcons color={theme.colors.olive} name="location-on" size={theme.sizes.iconSm} />
                <Text numberOfLines={1} style={styles.locationText}>
                  {locationLabel}
                </Text>
              </View>

              <Text style={styles.description}>{description}</Text>

              <View style={styles.actionRow}>
                <PrimaryButton
                  label="Site oficial"
                  onPress={() => {
                    void openOfficialSiteWithFeedback({
                      entityId: universityId,
                      entityLabel: title,
                      fallbackUrl: university?.officialUrl,
                    });
                  }}
                  rightIcon="open-in-new"
                  style={styles.siteButton}
                />
                <FavoriteButton
                  isFavorite={isFavorite(universityId)}
                  onPress={() => toggleFavorite(universityId)}
                  size="lg"
                  tone="floating"
                />
              </View>
            </View>

            <View style={styles.facultiesSectionHeader}>
              <Text style={styles.facultiesTitle}>Facultăți</Text>
              {facultyTotalBadge ? <PillBadge label={facultyTotalBadge} size="xs" textStyle={styles.totalBadgeText} tone="accentSoft" /> : null}
            </View>
          </>
        }
      />
    </View>
  );
}

function FacultyRowSeparator(): React.JSX.Element {
  return <View style={styles.rowSeparator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.sand,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    height: 290,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.oliveSoft,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.black20,
  },
  backButton: {
    position: "absolute",
    left: theme.spacing.lg,
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white20,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
  },
  logoRing: {
    position: "absolute",
    left: theme.spacing.xl,
    bottom: -theme.spacing.xxl,
    width: 88,
    height: 88,
    borderRadius: theme.radii.full,
    borderWidth: 4,
    borderColor: theme.colors.sand,
    backgroundColor: theme.colors.surface,
    ...shadows.soft,
    padding: theme.spacing.sm,
    zIndex: 4,
  },
  logoCircle: {
    flex: 1,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  content: {
    paddingTop: 54,
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.extraBold,
    fontSize: 23,
    lineHeight: 27,
    maxWidth: 260,
    letterSpacing: typography.letterSpacing.tight,
  },
  locationRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  locationText: {
    flex: 1,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  description: {
    marginTop: theme.spacing.md,
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
  },
  actionRow: {
    marginTop: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.layout.sectionGap,
  },
  siteButton: {
    flex: 1,
    borderRadius: theme.radii.xl,
    ...shadows.sticker,
  },
  facultiesSectionHeader: {
    marginTop: theme.layout.sectionGapLg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  facultiesTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
  },
  totalBadgeText: {
    color: theme.colors.accent,
  },
  rowSeparator: {
    height: theme.layout.gridGap,
  },
  facultyRowHalf: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.layout.gridGap,
  },
  facultyRowFull: {
    paddingHorizontal: theme.spacing.lg,
  },
  halfCell: {
    flex: 1,
  },
  facultyTile: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.md,
    ...shadows.card,
  },
  facultyTileHalf: {
    minHeight: 180,
  },
  facultyTileFull: {
    minHeight: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  facultyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  facultyBody: {
    marginTop: theme.spacing.md,
    flexShrink: 1,
    gap: theme.spacing.xs,
  },
  facultyBodyFull: {
    marginTop: 0,
    flex: 1,
  },
  facultyTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  facultyDescription: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  facultyCountLabel: {
    marginTop: theme.spacing.xs,
    color: theme.colors.accent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  facultyArrow: {
    marginLeft: "auto",
    width: theme.sizes.controlSm,
    height: theme.sizes.controlSm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});

