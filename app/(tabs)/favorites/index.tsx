import { FlashList } from "@shopify/flash-list";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { Screen, SegmentedTabs } from "../../../src/components";
import {
  FacultyGridEntityCell,
  GridAddCell,
  ProgramAddFooter,
  ProgramFavoriteRow,
  UniversityGridEntityCell,
} from "../../../src/features/favorites/components/FavoriteListItems";
import {
  buildFavoriteGridCells,
  buildFavoriteLookups,
  buildToneByUniversityId,
  type FavoriteGridCell,
  type FavoriteTabKey,
} from "../../../src/features/favorites";
import { useAppState } from "../../../src/state/app-state";
import { shadows } from "../../../src/theme/shadows";
import { theme } from "../../../src/theme/theme";
import { typography } from "../../../src/theme/typography";
import { resolveOrderedTabTransitionMeta, useHorizontalTabSwipeGesture } from "../../../src/utils/horizontal-tab-swipe";
import { useReducedMotionEnabled } from "../../../src/utils/motion";
import { useTabContentMotion } from "../../../src/utils/tab-content-motion";
import { normalizeRomanianText } from "../../../src/utils/text";

const FAVORITE_TAB_KEYS: FavoriteTabKey[] = ["universities", "faculties", "programs"];
const FAVORITE_TAB_SET = new Set<FavoriteTabKey>(FAVORITE_TAB_KEYS);
const DEFAULT_TAB_LABELS: Record<FavoriteTabKey, string> = {
  universities: "Universitati",
  faculties: "Facultati",
  programs: "Programe",
};

const UNIVERSITY_MEDIA_TONES: ("accent" | "olive")[] = ["accent", "olive", "accent"];

const FAVORITES_TAB_PALETTE: Record<
  FavoriteTabKey,
  "favoritesUniversities" | "favoritesFaculties" | "favoritesPrograms"
> = {
  universities: "favoritesUniversities",
  faculties: "favoritesFaculties",
  programs: "favoritesPrograms",
};

const FAVORITES_BODY_COLOR: Record<FavoriteTabKey, keyof typeof theme.colors> = {
  universities: "accentMuted",
  faculties: "sageSoft",
  programs: "mutedSand",
};

const FACULTY_VISUAL_BY_ID: Record<string, { icon: string; tone: "accent" | "olive" | "neutral" }> = {
  "faculty-facultatea-de-matematica": { icon: "calculate", tone: "neutral" },
  "faculty-facultatea-de-drept": { icon: "gavel", tone: "olive" },
  "faculty-facultatea-de-psihologie": { icon: "psychology", tone: "accent" },
};
const DEFAULT_FACULTY_VISUAL = { icon: "school", tone: "neutral" as const };

const PROGRAM_VISUAL_BY_ID: Record<string, { icon: string; tone: "accent" | "olive" | "deepBlue" | "neutral" }> = {
  "program-informatica-economica-ubb-cluj-napoca": { icon: "analytics", tone: "olive" },
  "program-informatica-unibuc": { icon: "code", tone: "deepBlue" },
  "program-psihologie-clinica-uvt-timisoara": { icon: "psychology", tone: "neutral" },
  "program-arhitectura-uauim": { icon: "architecture", tone: "accent" },
  "program-drept-uaic-iasi": { icon: "gavel", tone: "olive" },
};
const DEFAULT_PROGRAM_VISUAL = { icon: "code", tone: "neutral" as const };

const TAB_BAR_SAFE_PADDING = theme.sizes.bottomNav + theme.spacing.xl;
const GRID_ESTIMATED_ITEM_SIZE = 280;
const PROGRAM_ESTIMATED_ITEM_SIZE = 180;

export default function FavoritesTabScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    universities: allUniversities,
    faculties: allFaculties,
    programs: allPrograms,
    screenCopy: allScreenCopy,
    favoritesPayload,
    favoriteIdsByKind,
    toggleFavorite,
  } = useAppState();
  const reducedMotionEnabled = useReducedMotionEnabled();
  const [activeTab, setActiveTab] = useState<FavoriteTabKey>("universities");
  const [tabMotionSource, setTabMotionSource] = useState<"tap" | "swipe">("tap");
  const { contentAnimatedStyle, transitionTo } = useTabContentMotion<FavoriteTabKey>({
    activeKey: activeTab,
    onChangeActive: setActiveTab,
    reducedMotionEnabled,
  });
  const tabSwipeGesture = useHorizontalTabSwipeGesture<FavoriteTabKey>({
    orderedKeys: FAVORITE_TAB_KEYS,
    activeKey: activeTab,
    onChange: (nextKey, meta) => {
      setTabMotionSource("swipe");
      transitionTo(nextKey, {
        source: "swipe",
        direction: meta.direction,
      });
    },
  });

  const { universityById, facultyById, programById, collectionByKind, favoriteItemByEntityId } = useMemo(
    () =>
      buildFavoriteLookups(
        allUniversities,
        allFaculties,
        allPrograms,
        favoritesPayload.collections
      ),
    [allFaculties, allPrograms, allUniversities, favoritesPayload.collections]
  );

  const shellCopy = useMemo(
    () => allScreenCopy.find((snapshot) => snapshot.screenId === 9),
    [allScreenCopy]
  );
  const headerTitle = normalizeRomanianText(shellCopy?.headings[0] ?? "Favorite");
  const headerSubtitle = normalizeRomanianText(shellCopy?.paragraphs[0] ?? "Colectia ta");

  const tabLabels = useMemo(() => {
    return FAVORITE_TAB_KEYS.map((key, index) => {
      return normalizeRomanianText(collectionByKind.get(key)?.tabs[index] ?? DEFAULT_TAB_LABELS[key]);
    });
  }, [collectionByKind]);

  const addLabelByTab: Record<FavoriteTabKey, string> = useMemo(() => {
    return {
      universities: normalizeRomanianText(collectionByKind.get("universities")?.addCardLabel ?? "Descopera mai multe"),
      faculties: normalizeRomanianText(collectionByKind.get("faculties")?.addCardLabel ?? "Descopera mai multe"),
      programs: normalizeRomanianText(collectionByKind.get("programs")?.addCardLabel ?? "Descopera alte programe"),
    };
  }, [collectionByKind]);

  const allCollectionsEmpty = FAVORITE_TAB_KEYS.every((key) => favoriteIdsByKind[key].length === 0);
  const activeEntityIds = favoriteIdsByKind[activeTab];
  const showEmptyState = activeEntityIds.length === 0;

  const toneByUniversityId = useMemo(
    () => buildToneByUniversityId(activeEntityIds, UNIVERSITY_MEDIA_TONES),
    [activeEntityIds]
  );

  const segmentedItems = useMemo(
    () =>
      FAVORITE_TAB_KEYS.map((key, index) => ({
        key,
        label: tabLabels[index] ?? DEFAULT_TAB_LABELS[key],
      })),
    [tabLabels]
  );

  const segmentedActiveKey = allCollectionsEmpty ? "__none__" : activeTab;
  const segmentedPalette = allCollectionsEmpty ? "default" : FAVORITES_TAB_PALETTE[activeTab];
  const shellBackgroundKey: keyof typeof theme.colors = "sand";
  const bodyBackgroundKey: keyof typeof theme.colors = allCollectionsEmpty ? "sand" : FAVORITES_BODY_COLOR[activeTab];
  const bodyBackground = theme.colors[bodyBackgroundKey];

  const gridData = useMemo(() => buildFavoriteGridCells(activeEntityIds), [activeEntityIds]);
  const openExplore = useCallback((): void => {
    void router.push("/(tabs)/explore");
  }, [router]);

  const openProgram = useCallback(
    (entityId: string): void => {
      void router.push({
        pathname: "/modals/program/[id]",
        params: { id: entityId },
      });
    },
    [router]
  );

  const openUniversity = useCallback(
    (entityId: string): void => {
      void router.push({
        pathname: "/modals/university/[id]",
        params: { id: entityId },
      });
    },
    [router]
  );

  const openFaculty = useCallback(
    (entityId: string): void => {
      void router.push({
        pathname: "/modals/faculty/[id]",
        params: { id: entityId },
      });
    },
    [router]
  );

  const renderProgramItem = useCallback(
    ({ item: entityId }: { item: string }): React.JSX.Element | null => {
      const program = programById.get(entityId);
      if (!program) {
        return null;
      }

      const favoriteItem = favoriteItemByEntityId.get(entityId);
      const visual = PROGRAM_VISUAL_BY_ID[entityId] ?? DEFAULT_PROGRAM_VISUAL;

      return (
        <ProgramFavoriteRow
          durationLabel={favoriteItem?.durationLabel ?? program.durationLabel}
          entityId={entityId}
          icon={visual.icon}
          level={favoriteItem?.level ?? program.level}
          name={favoriteItem?.name ?? program.name}
          onOpenProgram={openProgram}
          onToggleFavorite={toggleFavorite}
          subtitle={favoriteItem?.subtitle ?? [program.facultyName, program.universityName].filter(Boolean).join(" - ")}
          tone={visual.tone}
        />
      );
    },
    [favoriteItemByEntityId, openProgram, programById, toggleFavorite]
  );

  const programFooter = useMemo(
    () => <ProgramAddFooter ctaLabel={addLabelByTab.programs} onPress={openExplore} />,
    [addLabelByTab.programs, openExplore]
  );

  const gridItemType = useCallback(
    (item: FavoriteGridCell): string => (item.type === "add" ? "add" : activeTab),
    [activeTab]
  );

  const renderGridItem = useCallback(
    ({ item }: { item: FavoriteGridCell }): React.JSX.Element | null => {
      if (item.type === "add") {
        return (
          <GridAddCell
            label={activeTab === "universities" ? addLabelByTab.universities : addLabelByTab.faculties}
            onPress={openExplore}
            variant={activeTab === "universities" ? "universities" : "faculties"}
          />
        );
      }

      if (activeTab === "universities") {
        const university = universityById.get(item.entityId);
        if (!university) {
          return null;
        }

        return (
          <UniversityGridEntityCell
            city={favoriteItemByEntityId.get(item.entityId)?.subtitle ?? university.city}
            entityId={item.entityId}
            logoAlt={university.logoAlt}
            logoUrl={university.logoUrl}
            mediaTone={toneByUniversityId.get(item.entityId) ?? "accent"}
            name={favoriteItemByEntityId.get(item.entityId)?.name ?? university.name}
            onOpenUniversity={openUniversity}
            onToggleFavorite={toggleFavorite}
          />
        );
      }

      const faculty = facultyById.get(item.entityId);
      if (!faculty) {
        return null;
      }

      return (
        <FacultyGridEntityCell
          entityId={item.entityId}
          icon={(FACULTY_VISUAL_BY_ID[item.entityId]?.icon ?? faculty.icon ?? DEFAULT_FACULTY_VISUAL.icon)}
          name={favoriteItemByEntityId.get(item.entityId)?.name ?? faculty.name}
          onOpenFaculty={openFaculty}
          onToggleFavorite={toggleFavorite}
          tone={(FACULTY_VISUAL_BY_ID[item.entityId]?.tone ?? DEFAULT_FACULTY_VISUAL.tone)}
          universityName={favoriteItemByEntityId.get(item.entityId)?.subtitle ?? faculty.universityName}
        />
      );
    },
    [
      activeTab,
      addLabelByTab,
      facultyById,
      favoriteItemByEntityId,
      openExplore,
      openFaculty,
      openUniversity,
      toggleFavorite,
      toneByUniversityId,
      universityById,
    ]
  );

  const handleSegmentedChange = useCallback(
    (key: string): void => {
      if (!FAVORITE_TAB_SET.has(key as FavoriteTabKey)) {
        return;
      }

      const nextKey = key as FavoriteTabKey;
      const meta = resolveOrderedTabTransitionMeta(FAVORITE_TAB_KEYS, activeTab, nextKey, "tap");
      if (!meta) {
        return;
      }

      setTabMotionSource("tap");
      transitionTo(nextKey, {
        source: "swipe",
        direction: meta.direction,
      });
    },
    [activeTab, transitionTo]
  );

  return (
    <Screen backgroundColor={shellBackgroundKey} contentContainerStyle={styles.screenContent} padded={false} scrollable={false}>
      <View style={styles.swipeRegion}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>

        <SegmentedTabs
          activeKey={segmentedActiveKey}
          folderWidthRatio={0.9}
          items={segmentedItems}
          motionSource={tabMotionSource}
          onChange={handleSegmentedChange}
          palette={segmentedPalette}
          style={styles.segmentedTabs}
          variant="folder"
        />

        <GestureDetector gesture={tabSwipeGesture}>
          <View style={[styles.collectionSurface, { backgroundColor: bodyBackground }]}>
            <Animated.View style={[styles.collectionContent, contentAnimatedStyle]}>
              {showEmptyState ? (
                <View style={styles.emptyStateWrapper}>
                  <View style={styles.emptyVisualWrap}>
                    <View style={styles.emptyVisualBackdrop} />
                    <View style={styles.emptyVisualCard}>
                      <MaterialIcons color={theme.colors.accent20} name="backpack" size={theme.sizes.iconHero} style={styles.emptyMainIcon} />
                      <View style={styles.emptyBadgeBottomRight}>
                        <MaterialIcons color={theme.colors.accent} name="search" size={theme.sizes.iconXl} />
                      </View>
                      <View style={styles.emptyBadgeTopLeft}>
                        <MaterialIcons color={theme.colors.olive} name="menu-book" size={theme.sizes.iconLg} />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.emptyTitle}>{normalizeRomanianText(favoritesPayload.emptyState.title)}</Text>
                  <Text style={styles.emptyDescription}>{normalizeRomanianText(favoritesPayload.emptyState.description)}</Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={openExplore}
                    style={({ pressed }) => [styles.emptyCtaButton, pressed ? styles.emptyCtaButtonPressed : null]}
                  >
                    <Text style={styles.emptyCtaText}>{normalizeRomanianText(favoritesPayload.emptyState.ctaLabel)}</Text>
                    <MaterialIcons color={theme.colors.textOnAccent} name="arrow-forward" size={theme.sizes.iconMd} />
                  </Pressable>
                </View>
              ) : activeTab === "programs" ? (
                <FlashList
                  data={activeEntityIds}
                  drawDistance={PROGRAM_ESTIMATED_ITEM_SIZE * 3}
                  key="favorites-programs"
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews
                  renderItem={renderProgramItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.programsContent}
                  ListFooterComponent={programFooter}
                />
              ) : (
                <FlashList
                  data={gridData}
                  drawDistance={GRID_ESTIMATED_ITEM_SIZE * 2.5}
                  key={`favorites-grid-${activeTab}`}
                  keyExtractor={(item) => item.key}
                  keyboardShouldPersistTaps="handled"
                  numColumns={2}
                  removeClippedSubviews
                  renderItem={renderGridItem}
                  getItemType={gridItemType}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.gridContent}
                />
              )}
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 0,
  },
  swipeRegion: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: theme.layout.sectionGapLg,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.sm,
  },
  title: {
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
    marginTop: 0,
    marginHorizontal: -theme.spacing.lg,
  },
  collectionSurface: {
    flex: 1,
    marginHorizontal: -theme.spacing.lg,
    marginTop: -theme.spacing.xxs,
  },
  collectionContent: {
    flex: 1,
  },
  gridContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: TAB_BAR_SAFE_PADDING,
    paddingHorizontal: theme.spacing.lg,
  },
  programsContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: TAB_BAR_SAFE_PADDING,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
    paddingTop: theme.spacing.xl,
  },
  emptyVisualWrap: {
    width: "100%",
    maxWidth: theme.sizes.emptyStateMax,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: theme.spacing.xxl,
  },
  emptyVisualBackdrop: {
    position: "absolute",
    width: "90%",
    height: "90%",
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white60,
    opacity: 0.65,
  },
  emptyVisualCard: {
    width: "84%",
    height: "74%",
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.white60,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.white80,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "2deg" }],
    ...shadows.soft,
  },
  emptyMainIcon: {
    opacity: theme.opacity.muted,
  },
  emptyBadgeTopLeft: {
    position: "absolute",
    left: -theme.spacing.xs,
    top: -theme.spacing.sm,
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.sandSoft,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    ...shadows.card,
  },
  emptyBadgeBottomRight: {
    position: "absolute",
    right: -theme.spacing.sm,
    bottom: -theme.spacing.xs,
    width: theme.sizes.controlLg,
    height: theme.sizes.controlLg,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "12deg" }],
    ...shadows.card,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: theme.spacing.xxl,
  },
  emptyCtaButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.xl,
    minHeight: theme.sizes.controlXl,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    ...shadows.sticker,
  },
  emptyCtaButtonPressed: {
    opacity: 0.9,
  },
  emptyCtaText: {
    color: theme.colors.textOnAccent,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
});




