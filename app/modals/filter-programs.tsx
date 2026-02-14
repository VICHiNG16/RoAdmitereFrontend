import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FilterModalShell, FilterSectionCard } from "../../src/components";
import type { FilterOption } from "../../src/data/mock/types";
import { useAppState } from "../../src/state/app-state";
import { shadows } from "../../src/theme/shadows";
import { theme } from "../../src/theme/theme";
import { typography } from "../../src/theme/typography";
import { useBottomSheetMotion } from "../../src/utils/bottom-sheet-motion";
import { normalizeRomanianText } from "../../src/utils/text";

const FILTER_SCREEN_ID = "filter-programs";
const STUDY_FORM_CONTAINER_HEIGHT = 88;
const STUDY_FORM_CONTAINER_RADIUS = 40;
const STUDY_FORM_CONTAINER_INSET = 4;
const STUDY_FORM_OPTION_RADIUS = STUDY_FORM_CONTAINER_RADIUS - STUDY_FORM_CONTAINER_INSET;

function iconForLevelOption(optionId: string): keyof typeof MaterialIcons.glyphMap {
  if (optionId.includes("licenta")) {
    return "workspace-premium";
  }
  return "psychology";
}

function iconForStudyFormOption(optionId: string): keyof typeof MaterialIcons.glyphMap {
  if (optionId.includes("frecventa")) {
    return "school";
  }
  return "computer";
}

export default function FilterProgramsModal(): React.JSX.Element {
  const router = useRouter();
  const {
    filters,
    applyFilterDraft,
    beginFilterDraft,
    getFilterDraftSelectedCount,
    isFilterOptionSelected,
    resetFilterDraft,
    toggleFilterOption,
  } = useAppState();
  const { animatedStyle, closeWithMotion } = useBottomSheetMotion();

  const filterScreen = useMemo(
    () => filters.find((item) => item.id === FILTER_SCREEN_ID) ?? filters[0],
    [filters]
  );
  const languagesSection = filterScreen?.sections.find((section) => section.id === "languages");
  const levelsSection = filterScreen?.sections.find((section) => section.id === "levels");
  const studyFormsSection = filterScreen?.sections.find((section) => section.id === "study-forms");
  const durationsSection = filterScreen?.sections.find((section) => section.id === "durations");
  const languagesSectionId = languagesSection?.id ?? "languages";
  const levelsSectionId = levelsSection?.id ?? "levels";
  const studyFormsSectionId = studyFormsSection?.id ?? "study-forms";
  const durationsSectionId = durationsSection?.id ?? "durations";
  const selectedCount = getFilterDraftSelectedCount(FILTER_SCREEN_ID);
  const selectedCountLabel = selectedCount > 0 ? selectedCount.toString() : undefined;

  useEffect(() => {
    beginFilterDraft(FILTER_SCREEN_ID);
  }, [beginFilterDraft]);

  const handleClose = (): void => {
    closeWithMotion(() => {
      router.back();
    });
  };

  const handleApply = (): void => {
    applyFilterDraft(FILTER_SCREEN_ID);
    handleClose();
  };

  return (
    <FilterModalShell
      applyBadgeLabel={selectedCountLabel}
      applyLabel={filterScreen?.footer.applyLabel || "Aplica filtre"}
      animatedStyle={animatedStyle}
      contentContainerStyle={styles.scrollContent}
      onApply={handleApply}
      onClose={handleClose}
      onReset={() => resetFilterDraft(FILTER_SCREEN_ID)}
      resetLabel={filterScreen?.footer.resetLabel || "Reseteaza"}
      title={filterScreen?.title || "Filtreaza programe"}
    >
      <View style={styles.content}>
        <FilterSectionCard style={styles.sectionCardLarge}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconAccent]}>
              <MaterialIcons color={theme.colors.accent} name="language" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(languagesSection?.label || "Limba")}</Text>
          </View>

          <View style={styles.languageGrid}>
            {(languagesSection?.options ?? []).map((option) => (
              <LanguageCard
                isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, languagesSectionId, option.id)}
                key={option.id}
                onPress={() => toggleFilterOption(FILTER_SCREEN_ID, languagesSectionId, option.id)}
                option={option}
              />
            ))}
          </View>
        </FilterSectionCard>

        <FilterSectionCard>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconDeepBlue]}>
              <MaterialIcons color={theme.colors.textPrimary} name="auto-stories" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(levelsSection?.label || "Nivel")}</Text>
          </View>

          <View style={styles.levelGrid}>
            {(levelsSection?.options ?? []).map((option) => (
              <LevelCard
                isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, levelsSectionId, option.id)}
                key={option.id}
                onPress={() => toggleFilterOption(FILTER_SCREEN_ID, levelsSectionId, option.id)}
                option={option}
              />
            ))}
          </View>
        </FilterSectionCard>

        <FilterSectionCard>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconOlive]}>
              <MaterialIcons color={theme.colors.olive} name="schedule" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(studyFormsSection?.label || "Forma invatamant")}</Text>
          </View>

          <View style={styles.studyFormsWrap}>
            {(studyFormsSection?.options ?? []).map((option) => (
              <StudyFormOption
                isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, studyFormsSectionId, option.id)}
                key={option.id}
                onPress={() => toggleFilterOption(FILTER_SCREEN_ID, studyFormsSectionId, option.id)}
                option={option}
              />
            ))}
          </View>
        </FilterSectionCard>

        <FilterSectionCard style={styles.sectionCardLast}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconAccent]}>
              <MaterialIcons color={theme.colors.accent} name="timelapse" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(durationsSection?.label || "Durata studii")}</Text>
          </View>

          <View style={styles.durationWrap}>
            {(durationsSection?.options ?? []).map((option) => (
              <DurationChip
                isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, durationsSectionId, option.id)}
                key={option.id}
                onPress={() => toggleFilterOption(FILTER_SCREEN_ID, durationsSectionId, option.id)}
                option={option}
              />
            ))}
          </View>
        </FilterSectionCard>
      </View>
    </FilterModalShell>
  );
}

type LanguageCardProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const LanguageCard = memo(function LanguageCard({ isSelected, onPress, option }: LanguageCardProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.languageCard, isSelected ? styles.languageCardSelected : styles.languageCardIdle]}
    >
      <Text numberOfLines={1} style={isSelected ? styles.languageCardTextSelected : styles.languageCardTextIdle}>
        {normalizeRomanianText(option.label)}
      </Text>
      {option.count !== null && option.count !== undefined ? (
        <View style={[styles.languageCount, isSelected ? styles.languageCountSelected : styles.languageCountIdle]}>
          <Text style={isSelected ? styles.languageCountTextSelected : styles.languageCountTextIdle}>{option.count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

type LevelCardProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const LevelCard = memo(function LevelCard({ isSelected, onPress, option }: LevelCardProps): React.JSX.Element {
  const iconName = iconForLevelOption(option.id);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.levelCard, isSelected ? styles.levelCardSelected : styles.levelCardIdle]}
    >
      <View style={styles.levelCheckWrap}>
        {isSelected ? (
          <View style={styles.levelCheckSelected}>
            <MaterialIcons color={theme.colors.textOnAccent} name="check" size={theme.sizes.iconSm} />
          </View>
        ) : (
          <View style={styles.levelCheckIdle} />
        )}
      </View>

      <View style={[styles.levelGlow, isSelected ? styles.levelGlowStrong : styles.levelGlowSoft]} />
      <View style={styles.levelIconWrap}>
        <MaterialIcons color={isSelected ? theme.colors.textPrimary : theme.colors.textPrimary70} name={iconName} size={theme.sizes.iconXl} />
      </View>
      <Text style={isSelected ? styles.levelTextSelected : styles.levelTextIdle}>
        {normalizeRomanianText(option.label)}
      </Text>
    </Pressable>
  );
});

type StudyFormOptionProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const StudyFormOption = memo(function StudyFormOption({ isSelected, onPress, option }: StudyFormOptionProps): React.JSX.Element {
  const iconName = iconForStudyFormOption(option.id);
  const label = normalizeRomanianText(option.label);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.studyFormOption, isSelected ? styles.studyFormOptionSelected : styles.studyFormOptionIdle]}
    >
      <MaterialIcons
        color={isSelected ? theme.colors.textOnAccent : theme.colors.textPrimary70}
        name={iconName}
        size={theme.sizes.iconMd}
      />
      <Text numberOfLines={2} style={isSelected ? styles.studyFormTextSelected : styles.studyFormTextIdle}>
        {label}
      </Text>
    </Pressable>
  );
});

type DurationChipProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const DurationChip = memo(function DurationChip({ isSelected, onPress, option }: DurationChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.durationChip, isSelected ? styles.durationChipSelected : styles.durationChipIdle]}
    >
      {isSelected ? (
        <View style={styles.durationCheckWrap}>
          <MaterialIcons color={theme.colors.textOnAccent} name="check" size={theme.sizes.iconXs} />
        </View>
      ) : null}
      <Text style={isSelected ? styles.durationTextSelected : styles.durationTextIdle}>
        {normalizeRomanianText(option.label)}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.sm,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.layout.sectionGap,
  },
  sectionCardLarge: {
    paddingTop: theme.spacing.xl,
  },
  sectionCardLast: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionIconWrap: {
    width: theme.sizes.controlSm,
    height: theme.sizes.controlSm,
    borderRadius: theme.radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconAccent: {
    backgroundColor: theme.colors.accent10,
  },
  sectionIconDeepBlue: {
    backgroundColor: theme.colors.deepBlue10,
  },
  sectionIconOlive: {
    backgroundColor: theme.colors.olive10,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.spacing.md,
  },
  languageCard: {
    width: "48.5%",
    minHeight: 68,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.regular,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: theme.spacing.sm,
    overflow: "hidden",
  },
  languageCardSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    ...shadows.sticker,
  },
  languageCardIdle: {
    backgroundColor: theme.colors.sandSoft,
    borderColor: "transparent",
  },
  languageCardTextSelected: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  languageCardTextIdle: {
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  languageCount: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 26,
    height: 18,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  languageCountSelected: {
    backgroundColor: theme.colors.white20,
  },
  languageCountIdle: {
    backgroundColor: theme.colors.white60,
  },
  languageCountTextSelected: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
    textAlign: "center",
  },
  languageCountTextIdle: {
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xxs,
    lineHeight: typography.lineHeight.xxs,
    textAlign: "center",
  },
  levelGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  levelCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.strong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    position: "relative",
    overflow: "hidden",
  },
  levelCardSelected: {
    backgroundColor: theme.colors.deepBlue10,
    borderColor: theme.colors.textPrimary,
  },
  levelCardIdle: {
    backgroundColor: theme.colors.sand60,
    borderColor: "transparent",
  },
  levelCheckWrap: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 4,
  },
  levelCheckSelected: {
    width: 24,
    height: 24,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCheckIdle: {
    width: 24,
    height: 24,
    borderRadius: theme.radii.full,
    borderWidth: theme.borderWidths.strong,
    borderColor: theme.colors.deepBlue10,
  },
  levelGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: theme.radii.full,
  },
  levelGlowStrong: {
    top: -30,
    left: -26,
    backgroundColor: theme.colors.deepBlue10,
  },
  levelGlowSoft: {
    bottom: -30,
    right: -26,
    backgroundColor: theme.colors.deepBlue05,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
    ...shadows.card,
  },
  levelTextSelected: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  levelTextIdle: {
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  studyFormsWrap: {
    height: STUDY_FORM_CONTAINER_HEIGHT,
    borderRadius: STUDY_FORM_CONTAINER_RADIUS,
    backgroundColor: theme.colors.sand,
    padding: STUDY_FORM_CONTAINER_INSET,
    flexDirection: "row",
    gap: STUDY_FORM_CONTAINER_INSET,
    overflow: "hidden",
  },
  studyFormOption: {
    flex: 1,
    height: "100%",
    borderRadius: STUDY_FORM_OPTION_RADIUS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  studyFormOptionSelected: {
    backgroundColor: theme.colors.olive,
  },
  studyFormOptionIdle: {
    backgroundColor: "transparent",
  },
  studyFormTextSelected: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
    flexShrink: 1,
  },
  studyFormTextIdle: {
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
    flexShrink: 1,
  },
  durationWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  durationChip: {
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: theme.borderWidths.regular,
  },
  durationChipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    ...shadows.card,
  },
  durationChipIdle: {
    backgroundColor: theme.colors.sandSoft,
    borderColor: "transparent",
  },
  durationCheckWrap: {
    width: 16,
    height: 16,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white20,
    alignItems: "center",
    justifyContent: "center",
  },
  durationTextSelected: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  durationTextIdle: {
    color: theme.colors.textPrimary70,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});


