import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { resolveStitchAsset } from "../../src/assets-map";
import {
  CardFaculty,
  CardProgram,
  CardUniversity,
  EmptyState,
  FavoriteButton,
  PillBadge,
  PrimaryButton,
  Screen,
  SearchBar,
  SegmentedTabs,
} from "../../src/components";
import type { Faculty, Program, University } from "../../src/data/mock/types";
import facultiesData from "../../src/data/mock/generated/faculties.json";
import favoritesData from "../../src/data/mock/generated/favorites.json";
import programsData from "../../src/data/mock/generated/programs.json";
import universitiesData from "../../src/data/mock/generated/universities.json";
import { theme } from "../../src/theme/theme";
import { typography } from "../../src/theme/typography";

type FolderTabKey = "universities" | "faculties" | "programs";

const universities = universitiesData.universities as University[];
const faculties = facultiesData.faculties as Faculty[];
const programs = programsData.programs as Program[];

export default function ComponentGalleryModal(): React.JSX.Element {
  const [searchValue, setSearchValue] = useState("");
  const [activeExploreKey, setActiveExploreKey] = useState("universities");
  const [activeFolderKey, setActiveFolderKey] = useState<FolderTabKey>("universities");

  const favoritesCollectionByKind = useMemo(() => {
    const collectionMap: Partial<Record<FolderTabKey, (typeof favoritesData.favorites.collections)[number]>> = {};
    for (const collection of favoritesData.favorites.collections) {
      if (collection.kind === "universities" || collection.kind === "faculties" || collection.kind === "programs") {
        collectionMap[collection.kind] = collection;
      }
    }
    return collectionMap;
  }, []);

  const featuredUniversity = universities[0];
  const secondaryUniversity = universities[1] ?? universities[0];
  const featuredFaculty = faculties.find((faculty) => faculty.domain.length > 0) ?? faculties[0];
  const detailFaculty = faculties.find((faculty) => faculty.description.length > 0) ?? faculties[0];
  const featuredProgram = programs.find((program) => program.universityName.length > 0) ?? programs[0];
  const compactProgram = programs.find((program) => program.studyMode.length > 0) ?? programs[0];
  const favoriteProgramItem = favoritesCollectionByKind.programs?.items[0];
  const favoriteProgramsSource = programs.find((program) => program.id === favoriteProgramItem?.entityId) ?? programs[0];
  const favoriteProgramLevel =
    favoriteProgramItem && "level" in favoriteProgramItem
      ? favoriteProgramItem.level
      : favoriteProgramsSource.level;
  const favoriteProgramDuration =
    favoriteProgramItem && "durationLabel" in favoriteProgramItem
      ? favoriteProgramItem.durationLabel
      : favoriteProgramsSource.durationLabel;
  const favoritesEmptyState = favoritesData.favorites.emptyState;

  return (
    <Screen backgroundColor="backgroundMuted" contentContainerStyle={styles.contentContainer}>
      <Text style={styles.pageTitle}>Phase 2 Component Gallery</Text>
      <Text style={styles.pageSubtitle}>Token-driven reusable components only. No assembled production screens.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Bars</Text>
        <SearchBar
          onChangeText={setSearchValue}
          onPressFilter={() => undefined}
          placeholder="Search universities..."
          value={searchValue}
          variant="explore"
        />
        <SearchBar onChangeText={setSearchValue} placeholder="Search city..." value={searchValue} variant="filter" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segmented Tabs</Text>
        <SegmentedTabs
          activeKey={activeExploreKey}
          items={[
            { key: "universities", label: "Universities" },
            { key: "faculties", label: "Faculties" },
            { key: "programs", label: "Programs" },
          ]}
          onChange={setActiveExploreKey}
        />
        <SegmentedTabs
          activeKey={activeFolderKey}
          items={[
            { key: "universities", label: "Universitati" },
            { key: "faculties", label: "Facultati" },
            { key: "programs", label: "Programe" },
          ]}
          onChange={(key) => setActiveFolderKey(key as FolderTabKey)}
          palette="favoritesUniversities"
          variant="folder"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>University Cards</Text>
        {featuredUniversity ? (
          <CardUniversity
            city={featuredUniversity.city}
            facultyCountLabel={featuredUniversity.facultyCountLabel}
            isFavorite={featuredUniversity.isFavorite}
            logoAlt={featuredUniversity.logoAlt}
            logoSource={resolveStitchAsset(featuredUniversity.logoUrl)}
            mediaTone="accent"
            name={featuredUniversity.name}
            onPress={() => undefined}
            onToggleFavorite={() => undefined}
          />
        ) : null}
        <View style={styles.gridRow}>
          {secondaryUniversity ? (
            <CardUniversity
              city={secondaryUniversity.city}
              facultyCountLabel={secondaryUniversity.facultyCountLabel}
              isFavorite={secondaryUniversity.isFavorite}
              logoAlt={secondaryUniversity.logoAlt}
              logoSource={resolveStitchAsset(secondaryUniversity.logoUrl)}
              mediaTone="olive"
              name={secondaryUniversity.name}
              onPress={() => undefined}
              onToggleFavorite={() => undefined}
              style={styles.gridCell}
              variant="grid"
            />
          ) : null}
          <CardUniversity ctaLabel="Discover more" onPress={() => undefined} style={styles.gridCell} variant="add" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faculty Cards</Text>
        {featuredFaculty ? (
          <CardFaculty
            domain={featuredFaculty.domain}
            icon={featuredFaculty.icon}
            isFavorite={featuredFaculty.isFavorite}
            name={featuredFaculty.name}
            onPress={() => undefined}
            onToggleFavorite={() => undefined}
            programCountLabel={featuredFaculty.programCountLabel}
            tone="olive"
            universityName={featuredFaculty.universityName}
          />
        ) : null}
        {detailFaculty ? (
          <CardFaculty
            description={detailFaculty.description}
            icon={detailFaculty.icon}
            name={detailFaculty.name}
            onPress={() => undefined}
            programCountLabel={detailFaculty.programCountLabel}
            tone="accent"
            universityName={detailFaculty.universityName}
            variant="detail"
          />
        ) : null}
        <View style={styles.gridRow}>
          {featuredFaculty ? (
            <CardFaculty
              icon={featuredFaculty.icon}
              isFavorite
              name={featuredFaculty.name}
              onPress={() => undefined}
              onToggleFavorite={() => undefined}
              universityName={featuredFaculty.universityName}
              variant="grid"
              style={styles.gridCell}
            />
          ) : null}
          <CardFaculty ctaLabel="Discover more" onPress={() => undefined} style={styles.gridCell} variant="add" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Program Cards</Text>
        {featuredProgram ? (
          <CardProgram
            durationLabel={featuredProgram.durationLabel}
            facultyName={featuredProgram.facultyName}
            isFavorite={featuredProgram.isFavorite}
            level={featuredProgram.level}
            name={featuredProgram.name}
            onPress={() => undefined}
            onToggleFavorite={() => undefined}
            tone="accent"
            universityName={featuredProgram.universityName}
          />
        ) : null}
        {compactProgram ? (
          <CardProgram
            creditsLabel={compactProgram.creditsLabel}
            durationLabel={compactProgram.durationLabel}
            facultyName={compactProgram.facultyName}
            isFavorite={compactProgram.isFavorite}
            level={compactProgram.level}
            name={compactProgram.name}
            onPress={() => undefined}
            onToggleFavorite={() => undefined}
            studyMode={compactProgram.studyMode}
            tone="olive"
            universityName={compactProgram.universityName}
            variant="compact"
          />
        ) : null}
        {favoriteProgramItem ? (
          <CardProgram
            durationLabel={favoriteProgramDuration}
            isFavorite
            level={favoriteProgramLevel}
            name={favoriteProgramItem.name}
            onPress={() => undefined}
            onToggleFavorite={() => undefined}
            subtitle={favoriteProgramItem.subtitle}
            tone="deepBlue"
            variant="favorite"
          />
        ) : null}
        <CardProgram ctaLabel="Descopera alte programe" onPress={() => undefined} variant="add" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buttons, Badges, and Empty State</Text>
        <View style={styles.inlineRow}>
          <FavoriteButton isFavorite onPress={() => undefined} />
          <FavoriteButton isFavorite={false} onPress={() => undefined} tone="soft" />
          <FavoriteButton isFavorite onPress={() => undefined} size="lg" tone="minimal" />
        </View>
        <View style={styles.inlineRow}>
          <PillBadge label="Selected" tone="accent" />
          <PillBadge label="Type" tone="oliveSoft" />
          <PillBadge label="12" size="xs" tone="neutral" />
        </View>
        <View style={styles.inlineStack}>
          <PrimaryButton badgeLabel={3} label="Apply Filters" rightIcon="arrow-forward" />
          <PrimaryButton label="Official Site" rightIcon="open-in-new" variant="secondary" />
          <PrimaryButton label="Reset" variant="ghost" />
        </View>
        <EmptyState
          ctaLabel={favoritesEmptyState.ctaLabel}
          description={favoritesEmptyState.description}
          title={favoritesEmptyState.title}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  pageTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
  },
  pageSubtitle: {
    color: theme.colors.textPrimary60,
    fontFamily: typography.family.regular,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  gridRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  gridCell: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  inlineStack: {
    gap: theme.spacing.sm,
  },
});

