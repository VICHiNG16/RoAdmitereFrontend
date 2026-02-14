import { FlashList } from "@shopify/flash-list";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FavoriteButton, PillBadge, PrimaryButton } from "../../../src/components";
import type { Program } from "../../../src/data/mock/types";
import { normalizeForSearch, sortByFixedOrder } from "../../../src/features/explore";
import { useAppState } from "../../../src/state/app-state";
import { shadows } from "../../../src/theme/shadows";
import { theme } from "../../../src/theme/theme";
import { typography } from "../../../src/theme/typography";
import type { AppIconName } from "../../../src/utils/icons";
import { openOfficialSiteWithFeedback } from "../../../src/utils/official-links";
import { normalizeRomanianText } from "../../../src/utils/text";

type StudyLevel = "licenta" | "master";
type ProgramTone = "olive" | "accent" | "amber";
type ProgramVisual = {
  icon: AppIconName;
  tone: ProgramTone;
};

const DEFAULT_FACULTY_ID = "faculty-facultatea-de-matematica-si-informatica";
const PROGRAM_ORDER = [
  "program-informatica-universitatea-babes-bolyai",
  "program-matematica-universitatea-babes-bolyai",
  "program-matematica-aplicata-universitatea-babes-bolyai",
] as const;

const PROGRAM_VISUAL_BY_ID: Record<string, ProgramVisual> = {
  "program-informatica-universitatea-babes-bolyai": { icon: "code", tone: "olive" },
  "program-matematica-universitatea-babes-bolyai": { icon: "calculate", tone: "accent" },
  "program-matematica-aplicata-universitatea-babes-bolyai": { icon: "functions", tone: "amber" },
};

const PROGRAM_TONE_COLORS: Record<ProgramTone, { iconBackground: string; iconColor: string; levelColor: string }> = {
  olive: {
    iconBackground: theme.colors.olive10,
    iconColor: theme.colors.olive,
    levelColor: theme.colors.olive,
  },
  accent: {
    iconBackground: theme.colors.accent10,
    iconColor: theme.colors.accent,
    levelColor: theme.colors.accent,
  },
  amber: {
    iconBackground: theme.colors.amberSoft,
    iconColor: theme.colors.amber,
    levelColor: theme.colors.amber,
  },
};

const PROGRAM_ESTIMATED_ITEM_SIZE = 150;

function getRouteParamId(idParam: string | string[] | undefined): string | undefined {
  if (Array.isArray(idParam)) {
    return idParam[0];
  }
  return idParam;
}

function orderedProgramsFromScreen(programs: Program[]): Program[] {
  return sortByFixedOrder(programs, PROGRAM_ORDER);
}

type ProgramRowProps = {
  program: Program;
  visual: ProgramVisual;
  onPress: () => void;
};

const ProgramRow = memo(function ProgramRow({ program, visual, onPress }: ProgramRowProps): React.JSX.Element {
  const toneTokens = PROGRAM_TONE_COLORS[visual.tone];
  const displayLevel = normalizeRomanianText(program.level);
  const displayName = normalizeRomanianText(program.name);
  const displayDuration = normalizeRomanianText(program.durationLabel);
  const displayStudyMode = program.studyMode ? normalizeRomanianText(program.studyMode) : undefined;
  const displayCreditsLabel = program.creditsLabel ? normalizeRomanianText(program.creditsLabel) : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.programRow,
        {
          transform: [{ scale: pressed ? theme.motion.pressScale.card : 1 }],
        },
      ]}
    >
      <View style={styles.programLeadingColumn}>
        <View style={[styles.programIconBox, { backgroundColor: toneTokens.iconBackground }]}>
          <MaterialIcons color={toneTokens.iconColor} name={visual.icon} size={theme.sizes.iconXl} />
        </View>
        <Text style={[styles.programLevel, { color: toneTokens.levelColor }]}>{displayLevel}</Text>
      </View>

      <View style={styles.programMainColumn}>
        <Text numberOfLines={1} style={styles.programName}>
          {displayName}
        </Text>
        <Text numberOfLines={1} style={styles.programDuration}>
          {displayDuration}
        </Text>

        <View style={styles.programChipRow}>
          {displayStudyMode ? <PillBadge label={displayStudyMode} size="xs" tone="neutral" /> : null}
          {displayCreditsLabel ? <PillBadge label={displayCreditsLabel} size="xs" tone="neutral" /> : null}
        </View>
      </View>

      <View style={styles.programArrow}>
        <MaterialIcons color={theme.colors.textPrimary30} name="arrow-forward" size={theme.sizes.iconMd} />
      </View>
    </Pressable>
  );
});

export default function FacultyDetailRoute(): React.JSX.Element {
  const router = useRouter();
  const { faculties: allFaculties, programs: allPrograms, isFavorite, toggleFavorite } = useAppState();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = getRouteParamId(params.id);
  const [activeLevel, setActiveLevel] = useState<StudyLevel>("licenta");

  const faculty = useMemo(() => {
    const selected = allFaculties.find((item) => item.id === routeId);
    if (selected) {
      return selected;
    }
    return allFaculties.find((item) => item.id === DEFAULT_FACULTY_ID) ?? allFaculties[0];
  }, [allFaculties, routeId]);

  const allScreenPrograms = useMemo(() => {
    if (!faculty) {
      return [];
    }

    const facultyName = normalizeForSearch(faculty.name);
    const facultyUniversity = normalizeForSearch(faculty.universityName);
    const programsForFaculty = allPrograms.filter(
      (program) =>
        normalizeForSearch(program.facultyName) === facultyName
        && normalizeForSearch(program.universityName) === facultyUniversity
    );

    if (programsForFaculty.length > 0) {
      return orderedProgramsFromScreen(programsForFaculty);
    }

    const fallbackPrograms = allPrograms.filter(
      (program) => normalizeForSearch(program.facultyName) === facultyName
    );
    return orderedProgramsFromScreen(fallbackPrograms);
  }, [allPrograms, faculty]);

  const visiblePrograms = useMemo(() => {
    const filtered = allScreenPrograms.filter((program) => {
      const level = program.level.toLowerCase();
      return activeLevel === "master" ? level.includes("master") : level.includes("licen");
    });

    if (filtered.length > 0) {
      return filtered;
    }
    return allScreenPrograms;
  }, [activeLevel, allScreenPrograms]);

  const title = normalizeRomanianText(faculty?.name ?? "Facultate");
  const facultyId = faculty?.id ?? DEFAULT_FACULTY_ID;
  const universityName = normalizeRomanianText(faculty?.universityName ?? "");
  const locationLabel = normalizeRomanianText(faculty?.locationLabel ?? "");
  const totalBadge =
    faculty?.programCount !== null && faculty?.programCount !== undefined
      ? `${faculty.programCount} total`
      : allScreenPrograms.length > 0
        ? `${allScreenPrograms.length} total`
        : normalizeRomanianText(faculty?.programCountLabel ?? "");

  const renderProgramItem = useCallback(
    ({ item }: { item: Program }): React.JSX.Element => {
      const visual = PROGRAM_VISUAL_BY_ID[item.id] ?? { icon: "school", tone: "olive" as const };
      return (
        <ProgramRow
          onPress={() => {
            void router.push({
              pathname: "/modals/program/[id]",
              params: { id: item.id },
            });
          }}
          program={item}
          visual={visual}
        />
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
        data={visiblePrograms}
        drawDistance={PROGRAM_ESTIMATED_ITEM_SIZE * 3}
        getItemType={() => "program-row"}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        renderItem={renderProgramItem}
        ItemSeparatorComponent={ProgramSeparator}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <View style={styles.headerBlob} />
              <Pressable
                accessibilityLabel="Înapoi"
                accessibilityRole="button"
                onPress={() => router.back()}
                style={[styles.backButton, { top: insets.top + theme.spacing.xxl }]}
              >
                <MaterialIcons color={theme.colors.textPrimary} name="arrow-back" size={theme.sizes.iconLg} />
              </Pressable>

              <View style={styles.headerBody}>
                <View style={styles.headerIconOuter}>
                  <View style={styles.headerIconInner}>
                    <MaterialIcons color={theme.colors.olive} name="school" size={48} />
                  </View>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.universityLabel}>{universityName}</Text>

                {locationLabel ? (
                  <View style={styles.locationRow}>
                    <MaterialIcons color={theme.colors.accent} name="location-on" size={theme.sizes.iconSm} />
                    <Text numberOfLines={1} style={styles.locationText}>
                      {locationLabel}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <PrimaryButton
                    label="Site oficial"
                    onPress={() => {
                      void openOfficialSiteWithFeedback({
                        entityId: facultyId,
                        entityLabel: title,
                        fallbackUrl: faculty?.officialUrl,
                      });
                    }}
                    rightIcon="open-in-new"
                    style={styles.siteButton}
                  />
                  <FavoriteButton
                    isFavorite={isFavorite(facultyId)}
                    onPress={() => toggleFavorite(facultyId)}
                    size="lg"
                    tone="floating"
                  />
                </View>
              </View>
            </View>

            <View style={styles.programsSection}>
              <View style={styles.programsHeader}>
                <Text style={styles.programsTitle}>Programe de studiu</Text>
                {totalBadge ? <PillBadge label={totalBadge} size="xs" textStyle={styles.totalBadgeText} tone="oliveSoft" /> : null}
              </View>

              <View style={styles.levelTabs}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveLevel("licenta")}
                  style={[styles.levelTab, activeLevel === "licenta" ? styles.levelTabActive : styles.levelTabInactive]}
                >
                  <Text style={activeLevel === "licenta" ? styles.levelTabTextActive : styles.levelTabTextInactive}>Licență</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveLevel("master")}
                  style={[styles.levelTab, activeLevel === "master" ? styles.levelTabActive : styles.levelTabInactive]}
                >
                  <Text style={activeLevel === "master" ? styles.levelTabTextActive : styles.levelTabTextInactive}>Master</Text>
                </Pressable>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyProgramsText}>Nu am găsit programe pentru această selecție.</Text>}
      />
    </View>
  );
}

function ProgramSeparator(): React.JSX.Element {
  return <View style={styles.programSeparator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMuted,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: theme.colors.sand,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: theme.spacing.xxxl + theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    overflow: "hidden",
    position: "relative",
    ...shadows.soft,
  },
  headerBlob: {
    position: "absolute",
    right: -52,
    top: -30,
    width: 210,
    height: 170,
    borderRadius: 70,
    backgroundColor: theme.colors.accent10,
    transform: [{ rotate: "8deg" }],
  },
  backButton: {
    position: "absolute",
    left: theme.spacing.lg,
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
    zIndex: 10,
  },
  headerBody: {
    alignItems: "center",
  },
  headerIconOuter: {
    width: 110,
    height: 110,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.white60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
  headerIconInner: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
    ...shadows.card,
  },
  title: {
    color: theme.colors.textPrimary,
    textAlign: "center",
    fontFamily: typography.family.extraBold,
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    maxWidth: 290,
  },
  universityLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  locationRow: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  locationText: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    maxWidth: 260,
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
  programsSection: {
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.layout.sectionGapLg,
    marginBottom: theme.layout.sectionGap,
  },
  programsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  programsTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
  },
  totalBadgeText: {
    color: theme.colors.olive,
  },
  levelTabs: {
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.tabInactive,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.xs,
    flexDirection: "row",
  },
  levelTab: {
    flex: 1,
    minHeight: theme.sizes.controlMd,
    borderRadius: theme.radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTabActive: {
    backgroundColor: theme.colors.surface,
    ...shadows.card,
  },
  levelTabInactive: {
    backgroundColor: "transparent",
  },
  levelTabTextActive: {
    color: theme.colors.accentDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  levelTabTextInactive: {
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  programSeparator: {
    height: theme.layout.sectionGap,
  },
  programRow: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    ...shadows.card,
  },
  programLeadingColumn: {
    alignItems: "center",
    width: 60,
    gap: theme.spacing.xxs,
  },
  programIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  programLevel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: "uppercase",
    textAlign: "center",
  },
  programMainColumn: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xxs,
  },
  programName: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  programDuration: {
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  programChipRow: {
    marginTop: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  programArrow: {
    width: theme.sizes.controlSm,
    height: theme.sizes.controlSm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyProgramsText: {
    marginHorizontal: theme.spacing.xl,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});

