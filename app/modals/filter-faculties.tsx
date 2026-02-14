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

const FILTER_SCREEN_ID = "filter-faculties";
const CITY_LIST_VIRTUALIZATION_THRESHOLD = 24;
const CITY_LIST_MAX_HEIGHT = 320;

function chunkDomainRows(options: FilterOption[]): FilterOption[][] {
  const pattern = [4, 4, 3];
  const rows: FilterOption[][] = [];
  let cursor = 0;

  for (const length of pattern) {
    if (cursor >= options.length) {
      break;
    }
    rows.push(options.slice(cursor, cursor + length));
    cursor += length;
  }

  if (cursor < options.length) {
    rows.push(options.slice(cursor));
  }

  return rows;
}

export default function FilterFacultiesModal(): React.JSX.Element {
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
  const domainsSection = filterScreen?.sections.find((section) => section.id === "domains");
  const citiesSectionId = citiesSection?.id ?? "cities";
  const domainsSectionId = domainsSection?.id ?? "domains";
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

  const domainRows = useMemo(() => chunkDomainRows(domainsSection?.options ?? []), [domainsSection?.options]);

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
      title={filterScreen?.title || "Filtreaza facultati"}
    >
      <View style={styles.content}>
        <FilterSectionCard>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconWrap, styles.sectionIconAccent]}>
              <MaterialIcons color={theme.colors.accent} name="location-on" size={theme.sizes.iconLg} />
            </View>
            <Text style={styles.sectionTitle}>{normalizeRomanianText(citiesSection?.label || "Cauta oras")}</Text>
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
          <View style={styles.domainsHeader}>
            <View style={styles.sectionTitleRowCompact}>
              <View style={[styles.sectionIconWrap, styles.sectionIconOlive]}>
                <MaterialIcons color={theme.colors.olive} name="category" size={theme.sizes.iconLg} />
              </View>
              <Text style={styles.sectionTitle}>{normalizeRomanianText(domainsSection?.label || "Domenii")}</Text>
            </View>
            <View style={styles.pageDots}>
              <View style={[styles.pageDot, styles.pageDotActive]} />
              <View style={styles.pageDot} />
              <View style={styles.pageDot} />
            </View>
          </View>

          <View style={styles.domainRows}>
            {domainRows.map((row, rowIndex) => (
              <View key={`${rowIndex.toString()}-row`} style={styles.domainRow}>
                {row.map((option) => (
                  <DomainChip
                    isSelected={isFilterOptionSelected(FILTER_SCREEN_ID, domainsSectionId, option.id)}
                    key={option.id}
                    onPress={() => toggleFilterOption(FILTER_SCREEN_ID, domainsSectionId, option.id)}
                    option={option}
                  />
                ))}
              </View>
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

type DomainChipProps = {
  isSelected: boolean;
  onPress: () => void;
  option: FilterOption;
};

const DomainChip = memo(function DomainChip({ isSelected, onPress, option }: DomainChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.domainChip, isSelected ? styles.domainChipSelected : styles.domainChipIdle]}
    >
      <Text style={isSelected ? styles.domainChipTextSelected : styles.domainChipTextIdle}>
        {normalizeRomanianText(option.label)}
      </Text>
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
  sectionTitleRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
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
  domainsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  pageDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border,
  },
  pageDotActive: {
    backgroundColor: theme.colors.olive,
  },
  domainRows: {
    gap: theme.spacing.sm,
  },
  domainRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  domainChip: {
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  domainChipSelected: {
    backgroundColor: theme.colors.accent,
    ...shadows.sticker,
  },
  domainChipIdle: {
    backgroundColor: theme.colors.sand,
  },
  domainChipTextSelected: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  domainChipTextIdle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});

