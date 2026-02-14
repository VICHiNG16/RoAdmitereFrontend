import { FlashList } from "@shopify/flash-list";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FilterModalShell, FilterSectionCard, SearchBar } from "../../src/components";
import type { FilterOption } from "../../src/data/mock/types";
import { useAppState } from "../../src/state/app-state";
import { shadows } from "../../src/theme/shadows";
import { theme } from "../../src/theme/theme";
import { typography } from "../../src/theme/typography";
import { useBottomSheetMotion } from "../../src/utils/bottom-sheet-motion";
import { normalizeRomanianText, normalizeTextForSearch } from "../../src/utils/text";

const FILTER_SCREEN_ID = "filter-universities";
const CITY_LIST_VIRTUALIZATION_THRESHOLD = 24;
const CITY_LIST_MAX_HEIGHT = 320;

function iconForUniversityType(optionId: string): keyof typeof MaterialIcons.glyphMap {
  if (optionId.includes("publica")) {
    return "account-balance";
  }
  return "school";
}

export default function FilterUniversitiesModal(): React.JSX.Element {
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
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const { animatedStyle, closeWithMotion } = useBottomSheetMotion();

  const filterScreen = useMemo(
    () => filters.find((item) => item.id === FILTER_SCREEN_ID) ?? filters[0],
    [filters]
  );
  const citiesSection = filterScreen?.sections.find((section) => section.id === "cities");
  const typeSection = filterScreen?.sections.find((section) => section.id === "university-types");
  const citiesSectionId = citiesSection?.id ?? "cities";
  const typeSectionId = typeSection?.id ?? "university-types";
  const selectedCount = getFilterDraftSelectedCount(FILTER_SCREEN_ID);
  const selectedCountLabel = selectedCount > 0 ? selectedCount.toString() : undefined;
  const searchQuery = useMemo(() => normalizeTextForSearch(deferredSearchText), [deferredSearchText]);

  const visibleCityOptions = useMemo(() => {
    const options = citiesSection?.options ?? [];
    if (!searchQuery) {
      return options;
    }
    return options.filter((option) => normalizeTextForSearch(option.label).includes(searchQuery));
  }, [citiesSection?.options, searchQuery]);

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

  const handleUniversityTypeSelect = (optionId: string): void => {
    const options = typeSection?.options ?? [];
    for (const option of options) {
      const selected = isFilterOptionSelected(FILTER_SCREEN_ID, typeSectionId, option.id);
      if (option.id === optionId) {
        if (!selected) {
          toggleFilterOption(FILTER_SCREEN_ID, typeSectionId, option.id);
        }
      } else if (selected) {
        toggleFilterOption(FILTER_SCREEN_ID, typeSectionId, option.id);
      }
    }
  };

  const renderCityOption = useCallback(
    ({ item }: { item: FilterOption }): React.JSX.Element => (
      <CityOptionRow
        isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, citiesSectionId, item.id)}
        onPress={() => toggleFilterOption(FILTER_SCREEN_ID, citiesSectionId, item.id)}
        option={item}
      />
    ),
    [citiesSectionId, isFilterOptionSelected, toggleFilterOption]
  );

  const shouldVirtualizeCityList = visibleCityOptions.length > CITY_LIST_VIRTUALIZATION_THRESHOLD;

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
      title={filterScreen?.title || "Filtreaza universitati"}
    >
      <View style={styles.content}>
        <FilterSectionCard>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconAccent]}>
              <MaterialIcons color={theme.colors.accent} name="location-on" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(citiesSection?.label || "Oras")}</Text>
          </View>

          <SearchBar
            editable
            onChangeText={setSearchText}
            placeholder="Cauta un oras..."
            value={searchText}
            variant="filter"
          />

          {shouldVirtualizeCityList ? (
            <View style={styles.virtualizedOptionListWrap}>
              <FlashList
                data={visibleCityOptions}
                keyExtractor={(item) => item.id}
                nestedScrollEnabled
                removeClippedSubviews
                renderItem={renderCityOption}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={CityOptionSeparator}
              />
            </View>
          ) : (
            <View style={styles.optionList}>
              {visibleCityOptions.map((option) => (
                <CityOptionRow
                  isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, citiesSectionId, option.id)}
                  key={option.id}
                  onPress={() => toggleFilterOption(FILTER_SCREEN_ID, citiesSectionId, option.id)}
                  option={option}
                />
              ))}
            </View>
          )}

          {visibleCityOptions.length === 0 ? (
            <Text style={styles.emptyFilterText}>Nicio optiune pentru cautarea curenta.</Text>
          ) : null}
        </FilterSectionCard>

        <FilterSectionCard>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconOlive]}>
              <MaterialIcons color={theme.colors.olive} name="school" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(typeSection?.label || "Tip universitate")}</Text>
          </View>

          <View style={styles.typeGrid}>
            {(typeSection?.options ?? []).map((option) => (
              <UniversityTypeCard
                isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, typeSectionId, option.id)}
                key={option.id}
                onPress={() => handleUniversityTypeSelect(option.id)}
                option={option}
              />
            ))}
          </View>
        </FilterSectionCard>
      </View>
    </FilterModalShell>
  );
}

type CityOptionRowProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const CityOptionRow = memo(function CityOptionRow({ isSelected, onPress, option }: CityOptionRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.cityRow, isSelected ? styles.cityRowSelected : styles.cityRowIdle]}
    >
      <View style={styles.cityLeft}>
        <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxIdle]}>
          {isSelected ? <MaterialIcons color={theme.colors.textOnAccent} name="check" size={theme.sizes.iconSm} /> : null}
        </View>
        <Text style={styles.cityLabel}>{normalizeRomanianText(option.label)}</Text>
      </View>

      {option.count !== null && option.count !== undefined ? (
        <View style={[styles.countBadge, isSelected ? styles.countBadgeSelected : styles.countBadgeIdle]}>
          <Text style={isSelected ? styles.countLabelSelected : styles.countLabelIdle}>{option.count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

type UniversityTypeCardProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const UniversityTypeCard = memo(function UniversityTypeCard({ isSelected, onPress, option }: UniversityTypeCardProps): React.JSX.Element {
  const iconName = iconForUniversityType(option.id);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.typeCard, isSelected ? styles.typeCardSelected : styles.typeCardIdle]}
    >
      <View style={styles.typeCardCheckWrap}>
        {isSelected ? (
          <View style={styles.typeCheckSelected}>
            <MaterialIcons color={theme.colors.textOnAccent} name="check" size={theme.sizes.iconXs} />
          </View>
        ) : (
          <View style={styles.typeCheckIdle} />
        )}
      </View>

      <View style={styles.typeIconWrap}>
        <MaterialIcons
          color={isSelected ? theme.colors.olive : theme.colors.textPrimary}
          name={iconName}
          size={theme.sizes.iconLg}
        />
      </View>

      <Text style={styles.typeTitle}>{normalizeRomanianText(option.label)}</Text>
      {option.description ? <Text style={styles.typeSubtitle}>{normalizeRomanianText(option.description)}</Text> : null}
    </Pressable>
  );
});

function CityOptionSeparator(): React.JSX.Element {
  return <View style={styles.cityOptionSeparator} />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.sm,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.layout.sectionGap,
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
  sectionIconOlive: {
    backgroundColor: theme.colors.olive10,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  optionList: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  virtualizedOptionListWrap: {
    marginTop: theme.spacing.md,
    maxHeight: CITY_LIST_MAX_HEIGHT,
  },
  cityOptionSeparator: {
    height: theme.spacing.xs,
  },
  emptyFilterText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  cityRow: {
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cityRowSelected: {
    backgroundColor: theme.colors.accent10,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.accent20,
  },
  cityRowIdle: {
    backgroundColor: "transparent",
  },
  cityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: theme.borderWidths.strong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  checkboxIdle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  cityLabel: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  countBadge: {
    minWidth: 30,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
  },
  countBadgeSelected: {
    backgroundColor: theme.colors.accent10,
  },
  countBadgeIdle: {
    backgroundColor: theme.colors.sand,
  },
  countLabelSelected: {
    color: theme.colors.accent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  countLabelIdle: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  typeGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  typeCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: theme.radii.xl,
    borderWidth: theme.borderWidths.strong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    position: "relative",
    overflow: "hidden",
  },
  typeCardSelected: {
    backgroundColor: theme.colors.olive10,
    borderColor: theme.colors.olive,
    ...shadows.card,
  },
  typeCardIdle: {
    backgroundColor: theme.colors.sandSoft,
    borderColor: "transparent",
  },
  typeCardCheckWrap: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  typeCheckSelected: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.olive,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCheckIdle: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    borderWidth: theme.borderWidths.strong,
    borderColor: theme.colors.deepBlue10,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    ...shadows.card,
  },
  typeTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  typeSubtitle: {
    marginTop: theme.spacing.xxs,
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
});

