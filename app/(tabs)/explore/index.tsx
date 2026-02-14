import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { Screen, SearchBar, SegmentedTabs } from "../../../src/components";
import type { Faculty, Program, University } from "../../../src/data/mock/types";
import {
  EXPLORE_TAB_ORDER,
  FACULTY_ORDER,
  PROGRAM_ORDER,
  TAB_BAR_SAFE_PADDING,
  TAB_CONFIGS,
  UNIVERSITY_ORDER,
  filterFaculties,
  filterPrograms,
  filterUniversities,
  getFacultyToneById,
  getProgramPresentationById,
  getUniversityMediaToneByIndex,
  getUniversityTypeOptionId,
  normalizeForSearch,
  sortByFixedOrder,
  type ExploreFilterContext,
  type ExploreTabKey,
} from "../../../src/features/explore";
import {
  ExploreFacultyRow,
  ExploreProgramRow,
  ExploreUniversityRow,
} from "../../../src/features/explore/components";
import { useAppState } from "../../../src/state/app-state";
import { theme } from "../../../src/theme/theme";
import { typography } from "../../../src/theme/typography";
import { resolveOrderedTabTransitionMeta, useHorizontalTabSwipeGesture } from "../../../src/utils/horizontal-tab-swipe";
import { useReducedMotionEnabled } from "../../../src/utils/motion";
import { normalizeRomanianText } from "../../../src/utils/text";
import { useTabContentMotion } from "../../../src/utils/tab-content-motion";

const ESTIMATED_EXPLORE_ROW_HEIGHT = theme.sizes.listCard + theme.layout.sectionGap;

type ExploreListItem = University | Faculty | Program;

function ListItemSeparator(): React.JSX.Element {
  return <View style={styles.listItemSeparator} />;
}

export default function ExploreTabScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    dataSource,
    toggleDataSource,
    universities: allUniversities,
    faculties: allFaculties,
    programs: allPrograms,
    screenCopy: allScreenCopy,
    presentation,
    favoriteIdsByKind,
    getAppliedFilterOptionIds,
    toggleFavorite,
  } = useAppState();
  const reducedMotionEnabled = useReducedMotionEnabled();
  const [activeTab, setActiveTab] = useState<ExploreTabKey>("universities");
  const [tabMotionSource, setTabMotionSource] = useState<"tap" | "swipe">("tap");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);

  const { contentAnimatedStyle, transitionTo } = useTabContentMotion<ExploreTabKey>({
    activeKey: activeTab,
    onChangeActive: setActiveTab,
    reducedMotionEnabled,
    tapTransitionStyle: "slide-horizontal",
  });

  const tabSwipeGesture = useHorizontalTabSwipeGesture<ExploreTabKey>({
    orderedKeys: EXPLORE_TAB_ORDER,
    activeKey: activeTab,
    onChange: (nextKey, meta) => {
      setTabMotionSource("swipe");
      transitionTo(nextKey, {
        source: "swipe",
        direction: meta.direction,
      });
    },
  });

  const activeConfig = TAB_CONFIGS.find((config) => config.key === activeTab) ?? TAB_CONFIGS[0];

  const screenCopyById = useMemo(() => {
    return new Map(allScreenCopy.map((entry) => [entry.screenId, entry]));
  }, [allScreenCopy]);

  const activeCopy = screenCopyById.get(activeConfig.screenId);
  const subtitle = normalizeRomanianText(activeCopy?.paragraphs[0] ?? "Ce descoperim azi?");
  const searchPlaceholder = normalizeRomanianText(activeCopy?.inputPlaceholders[0] ?? "Caută...");

  const universities = useMemo(() => {
    const sourceItems = allUniversities.filter((item) => item.sourceScreens.includes(1));
    return sortByFixedOrder(sourceItems, UNIVERSITY_ORDER);
  }, [allUniversities]);

  const faculties = useMemo(() => {
    const sourceItems = allFaculties.filter((item) => item.sourceScreens.includes(3));
    return sortByFixedOrder(sourceItems, FACULTY_ORDER);
  }, [allFaculties]);

  const programs = useMemo(() => {
    const sourceItems = allPrograms.filter((item) => item.sourceScreens.includes(6));
    return sortByFixedOrder(sourceItems, PROGRAM_ORDER);
  }, [allPrograms]);

  const searchQuery = useMemo(() => normalizeForSearch(deferredSearchValue), [deferredSearchValue]);

  const filterContext = useMemo<ExploreFilterContext>(() => {
    return {
      searchQuery,
      universityCityFilterIds: new Set(getAppliedFilterOptionIds("filter-universities", "cities")),
      universityTypeFilterIds: new Set(getAppliedFilterOptionIds("filter-universities", "university-types")),
      facultyCityFilterIds: new Set(getAppliedFilterOptionIds("filter-faculties", "cities")),
      facultyDomainFilterIds: new Set(getAppliedFilterOptionIds("filter-faculties", "domains")),
      programLanguageFilterIds: new Set(getAppliedFilterOptionIds("filter-programs", "languages")),
      programLevelFilterIds: new Set(getAppliedFilterOptionIds("filter-programs", "levels")),
      programStudyFormFilterIds: new Set(getAppliedFilterOptionIds("filter-programs", "study-forms")),
      programDurationFilterIds: new Set(getAppliedFilterOptionIds("filter-programs", "durations")),
    };
  }, [getAppliedFilterOptionIds, searchQuery]);

  const filteredUniversities = useMemo(
    () =>
      filterUniversities(universities, filterContext, (universityId) =>
        getUniversityTypeOptionId(universityId, presentation)
      ),
    [filterContext, presentation, universities]
  );
  const filteredFaculties = useMemo(() => filterFaculties(faculties, filterContext), [faculties, filterContext]);
  const filteredPrograms = useMemo(() => filterPrograms(programs, filterContext), [filterContext, programs]);

  const favoriteIdSet = useMemo(() => {
    return new Set([
      ...favoriteIdsByKind.universities,
      ...favoriteIdsByKind.faculties,
      ...favoriteIdsByKind.programs,
    ]);
  }, [favoriteIdsByKind.faculties, favoriteIdsByKind.programs, favoriteIdsByKind.universities]);

  const openUniversity = useCallback(
    (universityId: string): void => {
      void router.push({
        pathname: "/modals/university/[id]",
        params: { id: universityId },
      });
    },
    [router]
  );

  const openFaculty = useCallback(
    (facultyId: string): void => {
      void router.push({
        pathname: "/modals/faculty/[id]",
        params: { id: facultyId },
      });
    },
    [router]
  );

  const openProgram = useCallback(
    (programId: string): void => {
      void router.push({
        pathname: "/modals/program/[id]",
        params: { id: programId },
      });
    },
    [router]
  );

  const activeData = useMemo<ExploreListItem[]>(() => {
    if (activeTab === "universities") {
      return filteredUniversities;
    }
    if (activeTab === "faculties") {
      return filteredFaculties;
    }
    return filteredPrograms;
  }, [activeTab, filteredFaculties, filteredPrograms, filteredUniversities]);

  const renderExploreItem = useCallback(
    ({ item, index }: { item: ExploreListItem; index: number }): React.JSX.Element => {
      if (activeTab === "universities") {
        const university = item as University;
        return (
          <ExploreUniversityRow
            isFavorite={favoriteIdSet.has(university.id)}
            mediaTone={getUniversityMediaToneByIndex(index, university.id, presentation)}
            onOpen={openUniversity}
            onToggleFavorite={toggleFavorite}
            university={university}
          />
        );
      }

      if (activeTab === "faculties") {
        const faculty = item as Faculty;
        return (
          <ExploreFacultyRow
            faculty={faculty}
            isFavorite={favoriteIdSet.has(faculty.id)}
            onOpen={openFaculty}
            onToggleFavorite={toggleFavorite}
            tone={getFacultyToneById(faculty.id, presentation)}
          />
        );
      }

      const program = item as Program;
      return (
        <ExploreProgramRow
          isFavorite={favoriteIdSet.has(program.id)}
          onOpen={openProgram}
          onToggleFavorite={toggleFavorite}
          presentation={getProgramPresentationById(program.id, presentation)}
          program={program}
        />
      );
    },
    [
      activeTab,
      favoriteIdSet,
      openFaculty,
      openProgram,
      openUniversity,
      presentation,
      toggleFavorite,
    ]
  );

  return (
    <Screen backgroundColor="sand" padded={false} scrollable={false} style={styles.root}>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.greeting}>Bună!</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: dataSource === "real" }}
            onPress={toggleDataSource}
            style={({ pressed }) => [
              styles.sourceToggle,
              dataSource === "real" ? styles.sourceToggleReal : styles.sourceToggleMock,
              pressed ? styles.sourceTogglePressed : null,
            ]}
          >
            <Text style={[styles.sourceToggleText, dataSource === "real" ? styles.sourceToggleTextReal : null]}>
              {dataSource === "real" ? "Real" : "Mock"}
            </Text>
          </Pressable>
        </View>

        <SearchBar
          onChangeText={setSearchValue}
          onPressFilter={() => {
            void router.push(activeConfig.filterRoute);
          }}
          placeholder={searchPlaceholder}
          value={searchValue}
          variant="explore"
        />

        <SegmentedTabs
          activeKey={activeTab}
          items={TAB_CONFIGS.map((config) => ({ key: config.key, label: config.label }))}
          motionSource={tabMotionSource}
          onChange={(key) => {
            const nextKey = key as ExploreTabKey;
            const transitionMeta = resolveOrderedTabTransitionMeta(
              EXPLORE_TAB_ORDER,
              activeTab,
              nextKey,
              "tap"
            );
            if (!transitionMeta) {
              return;
            }

            setTabMotionSource("tap");
            transitionTo(nextKey, {
              source: "tap",
              direction: transitionMeta.direction,
            });
          }}
          style={styles.segmentedTabs}
        />

        <GestureDetector gesture={tabSwipeGesture}>
          <Animated.View style={[styles.listContainer, contentAnimatedStyle]}>
            <FlashList
              data={activeData}
              drawDistance={ESTIMATED_EXPLORE_ROW_HEIGHT * 3}
              key={activeTab}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews
              renderItem={renderExploreItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContentContainer}
              ItemSeparatorComponent={ListItemSeparator}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.sand,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.layout.sectionGap,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.sm,
  },
  sourceToggle: {
    minWidth: 70,
    height: theme.sizes.controlSm,
    borderRadius: theme.radii.full,
    borderWidth: theme.borderWidths.regular,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  sourceToggleMock: {
    backgroundColor: theme.colors.sandSoft,
    borderColor: theme.colors.border,
  },
  sourceToggleReal: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  sourceTogglePressed: {
    opacity: 0.85,
  },
  sourceToggleText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    color: theme.colors.textPrimary,
  },
  sourceToggleTextReal: {
    color: theme.colors.textOnAccent,
  },
  greeting: {
    color: theme.colors.accent,
    fontFamily: typography.family.hand,
    fontSize: typography.size.hero,
    lineHeight: typography.lineHeight.hero,
    transform: [{ rotate: "-1deg" }],
  },
  subtitle: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  segmentedTabs: {
    marginTop: theme.spacing.xs,
  },
  listContainer: {
    flex: 1,
    overflow: "hidden",
  },
  listContentContainer: {
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  listItemSeparator: {
    height: theme.layout.sectionGap,
  },
});

