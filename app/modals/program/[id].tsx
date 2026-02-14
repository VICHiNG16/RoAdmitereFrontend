import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolveStitchAsset } from "../../../src/assets-map";
import { FavoriteButton, PillBadge, PrimaryButton } from "../../../src/components";
import { useAppState } from "../../../src/state/app-state";
import { shadows } from "../../../src/theme/shadows";
import { theme } from "../../../src/theme/theme";
import { typography } from "../../../src/theme/typography";
import { openOfficialSiteWithFeedback } from "../../../src/utils/official-links";
import { normalizeRomanianText } from "../../../src/utils/text";

const DEFAULT_PROGRAM_ID = "program-cibernetica-economica-ase-bucuresti";
const PROGRAM_LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDii46KrLTCRA2N5ta9PX9NNHgtz7GnKvhVgW-0biKkI3zq6GMKBr-DIH-1XBARzgFTMFmc2g5TocxcaCv_YHyBAwaA4Mtp9fcLVLBQJms8TUGrpLO5XlDbhlf-ayE744DFlUkiV4mYWRUgyT_RTiYpVfzRaSzDG724svLmjbdgRO6RF3QdMb_GHgbRSWLEW-re-Ct19I0fKqa2WbPtCTTpllwGtK-FaWxHKG9mWMUm0gsXGKCOe7eI0LGcLLcmJbPVYsulldX4YXk";
const DEFAULT_FORM_LABEL = "Cu Frecvență (IF)";
const DEFAULT_FACULTY_LABEL = "Facultatea de Cibernetică";
const DEFAULT_DESCRIPTION_PARAGRAPHS = [
  "Programul de Cibernetică Economică pregătește specialiști capabili să modeleze procesele economice folosind instrumente matematice și tehnologii informatice moderne.",
  "Vei învăța să analizezi date complexe, să dezvolți algoritmi de optimizare și să utilizezi software avansat pentru decizii de business.",
];
const DEFAULT_CAREER_OPPORTUNITIES = [
  "Analist de date",
  "Data Scientist",
  "Specialist IT",
  "Consultant Business",
  "Manager Proiect",
];

function getRouteParamId(idParam: string | string[] | undefined): string | undefined {
  if (Array.isArray(idParam)) {
    return idParam[0];
  }
  return idParam;
}

type MetricCardTone = {
  accentBlob: string;
  iconBackground: string;
  iconColor: string;
};

const METRIC_TONES: MetricCardTone[] = [
  {
    accentBlob: theme.colors.metricBlueSoft,
    iconBackground: theme.colors.metricBlueSoft,
    iconColor: theme.colors.metricBlue,
  },
  {
    accentBlob: theme.colors.metricAmberSoft,
    iconBackground: theme.colors.metricAmberSoft,
    iconColor: theme.colors.metricAmber,
  },
  {
    accentBlob: theme.colors.metricRoseSoft,
    iconBackground: theme.colors.metricRoseSoft,
    iconColor: theme.colors.metricRose,
  },
  {
    accentBlob: theme.colors.metricVioletSoft,
    iconBackground: theme.colors.metricVioletSoft,
    iconColor: theme.colors.metricViolet,
  },
];

type MetricCardProps = {
  label: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tone: MetricCardTone;
};

function MetricCard({ label, value, icon, tone }: MetricCardProps): React.JSX.Element {
  const displayLabel = normalizeRomanianText(label);
  const displayValue = normalizeRomanianText(value);

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricAccentBlob, { backgroundColor: tone.accentBlob }]} />
      <View style={[styles.metricIconBox, { backgroundColor: tone.iconBackground }]}>
        <MaterialIcons color={tone.iconColor} name={icon} size={theme.sizes.iconLg} />
      </View>
      <View style={styles.metricTextWrap}>
        <Text style={styles.metricLabel}>{displayLabel}</Text>
        <Text numberOfLines={2} style={styles.metricValue}>
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

export default function ProgramDetailRoute(): React.JSX.Element {
  const router = useRouter();
  const { programs: allPrograms, isFavorite: isEntityFavorite, toggleFavorite } = useAppState();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = getRouteParamId(params.id);

  const program = useMemo(() => {
    const selected = allPrograms.find((item) => item.id === routeId);
    if (selected) {
      return selected;
    }
    return allPrograms.find((item) => item.id === DEFAULT_PROGRAM_ID) ?? allPrograms[0];
  }, [allPrograms, routeId]);

  const isDefaultProgram = program?.id === DEFAULT_PROGRAM_ID;
  const programId = program?.id ?? DEFAULT_PROGRAM_ID;
  const logoSource = resolveStitchAsset(PROGRAM_LOGO_URL);
  const levelLabel = normalizeRomanianText(program?.level ? program.level.toUpperCase() : "LICENȚĂ");
  const facultyLabel = normalizeRomanianText(isDefaultProgram ? DEFAULT_FACULTY_LABEL : program?.facultyName || "");
  const durationValue =
    program?.durationYears !== null && program?.durationYears !== undefined
      ? `${program.durationYears} Ani`
      : normalizeRomanianText(program?.durationLabel || "-");
  const formValue = normalizeRomanianText(isDefaultProgram ? DEFAULT_FORM_LABEL : program?.studyMode || "-");
  const admissionValue =
    program?.admissionAverage !== null && program?.admissionAverage !== undefined ? program.admissionAverage.toFixed(2) : "-";
  const creditsValue = normalizeRomanianText(program?.creditsLabel || "-");
  const descriptionParagraphs =
    program?.descriptionParagraphs && program.descriptionParagraphs.length > 0
      ? program.descriptionParagraphs.map((paragraph) => normalizeRomanianText(paragraph))
      : DEFAULT_DESCRIPTION_PARAGRAPHS;
  const careerOpportunities =
    program?.careerOpportunities && program.careerOpportunities.length > 0
      ? program.careerOpportunities.map((career) => normalizeRomanianText(career))
      : DEFAULT_CAREER_OPPORTUNITIES;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.md) + theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <View style={styles.headerBlob} />

          <View style={[styles.headerTopRow, { marginTop: insets.top + theme.spacing.xxl }]}>
            <Pressable
              accessibilityLabel="Inapoi"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <MaterialIcons color={theme.colors.textPrimary} name="arrow-back" size={theme.sizes.iconLg} />
            </Pressable>

            <View style={styles.programMetaPill}>
              <View style={styles.programLogoWrap}>
                {logoSource ? (
                  <Image accessibilityLabel="ASE Logo" source={logoSource} style={styles.programLogo} />
                ) : (
                  <MaterialIcons color={theme.colors.oliveDark} name="school" size={theme.sizes.iconLg} />
                )}
              </View>
              <View style={styles.programMetaText}>
                <Text numberOfLines={1} style={styles.programUniversity}>
                  {normalizeRomanianText(program?.universityName || "ASE București")}
                </Text>
                <Text numberOfLines={1} style={styles.programFaculty}>
                  {facultyLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerBody}>
            <PillBadge label={levelLabel} leftIcon="school" size="sm" style={styles.levelBadge} textStyle={styles.levelBadgeText} tone="accentSoft" uppercase />
            <Text style={styles.title}>{normalizeRomanianText(program?.name || "Program")}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metricGrid}>
            <MetricCard icon="schedule" label="Durată" tone={METRIC_TONES[0]} value={durationValue} />
            <MetricCard icon="class" label="Formă" tone={METRIC_TONES[1]} value={formValue} />
            <MetricCard icon="analytics" label="Media Admitere" tone={METRIC_TONES[2]} value={admissionValue} />
            <MetricCard icon="stars" label="Credite" tone={METRIC_TONES[3]} value={creditsValue} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons color={theme.colors.accent} name="info" size={theme.sizes.iconLg} />
              <Text style={styles.sectionTitle}>Despre program</Text>
            </View>
            {descriptionParagraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.sectionParagraph}>
                {paragraph}
              </Text>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons color={theme.colors.oliveDark} name="work" size={theme.sizes.iconLg} />
              <Text style={styles.sectionTitle}>Oportunități carieră</Text>
            </View>
            <View style={styles.tagWrap}>
              {careerOpportunities.map((item) => (
                <PillBadge key={item} label={item} size="sm" style={styles.careerTag} textStyle={styles.careerTagText} tone="oliveSoft" />
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <PrimaryButton
              label="Site oficial"
              onPress={() => {
                void openOfficialSiteWithFeedback({
                  entityId: programId,
                  entityLabel: normalizeRomanianText(program?.name ?? "Program"),
                  fallbackUrl: program?.officialUrl,
                });
              }}
              rightIcon="open-in-new"
              size="lg"
              style={styles.siteButton}
            />
            <FavoriteButton
              isFavorite={isEntityFavorite(programId)}
              onPress={() => toggleFavorite(programId)}
              size="lg"
              tone="floating"
            />
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.sand,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    position: "relative",
    overflow: "hidden",
  },
  headerBlob: {
    position: "absolute",
    right: -56,
    top: -26,
    width: 250,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.surface,
    opacity: 0.42,
    transform: [{ rotate: "8deg" }],
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.layout.sectionGap,
    marginBottom: theme.layout.sectionGap,
  },
  backButton: {
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white60,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white60,
    alignItems: "center",
    justifyContent: "center",
  },
  programMetaPill: {
    flex: 1,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white60,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white60,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  programLogoWrap: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
  },
  programLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  programMetaText: {
    flex: 1,
    minWidth: 0,
  },
  programUniversity: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  programFaculty: {
    marginTop: 1,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
  },
  headerBody: {
    alignItems: "flex-start",
  },
  levelBadge: {
    borderColor: theme.colors.accent20,
  },
  levelBadgeText: {
    color: theme.colors.accentDark,
    letterSpacing: typography.letterSpacing.wider,
  },
  title: {
    marginTop: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.hero,
    lineHeight: typography.lineHeight.hero,
    letterSpacing: typography.letterSpacing.tight,
    maxWidth: 280,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.layout.gridGap,
    marginBottom: theme.layout.sectionGap,
  },
  metricCard: {
    width: "48.5%",
    minHeight: 124,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    overflow: "hidden",
    position: "relative",
    ...shadows.card,
  },
  metricAccentBlob: {
    position: "absolute",
    right: -10,
    top: -10,
    width: 62,
    height: 62,
    borderBottomLeftRadius: theme.radii.xl,
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTextWrap: {
    gap: theme.spacing.xxs,
  },
  metricLabel: {
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    ...shadows.soft,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  sectionParagraph: {
    color: theme.colors.textPrimary80,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
    marginBottom: theme.spacing.md,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  careerTag: {
    borderColor: theme.colors.olive20,
    backgroundColor: theme.colors.olive10,
  },
  careerTagText: {
    color: theme.colors.oliveDark,
    letterSpacing: typography.letterSpacing.normal,
  },
  actionRow: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.layout.sectionGap,
  },
  siteButton: {
    flex: 1,
    borderRadius: theme.radii.xl,
  },
});
