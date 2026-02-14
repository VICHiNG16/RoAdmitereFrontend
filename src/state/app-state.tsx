import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type {
  ExplorePresentationMetadata,
  FavoriteCollection,
  FavoritesPayload,
  Faculty,
  FilterScreen,
  Program,
  ScreenCopySnapshot,
  University,
} from "../data/mock/types";
import mockFacultiesData from "../data/mock/generated/faculties.json";
import mockFavoritesData from "../data/mock/generated/favorites.json";
import mockFiltersData from "../data/mock/generated/filters.json";
import mockPresentationData from "../data/mock/generated/presentation.json";
import mockProgramsData from "../data/mock/generated/programs.json";
import mockScreenCopyData from "../data/mock/generated/screen-copy.json";
import mockUniversitiesData from "../data/mock/generated/universities.json";
import realFacultiesData from "../data/real/generated/faculties.json";
import realFavoritesData from "../data/real/generated/favorites.json";
import realFiltersData from "../data/real/generated/filters.json";
import realPresentationData from "../data/real/generated/presentation.json";
import realProgramsData from "../data/real/generated/programs.json";
import realScreenCopyData from "../data/real/generated/screen-copy.json";
import realUniversitiesData from "../data/real/generated/universities.json";

export type DataSource = "mock" | "real";

type FavoriteKind = "universities" | "faculties" | "programs";
type FavoriteIdsByKind = Record<FavoriteKind, string[]>;
type FilterSelectionBySection = Record<string, string[]>;
type FilterSelectionByScreen = Record<string, FilterSelectionBySection>;
type FilterAppliedFlags = Record<string, boolean>;

type DataBundle = {
  universities: University[];
  faculties: Faculty[];
  programs: Program[];
  filters: FilterScreen[];
  favoritesPayload: FavoritesPayload;
  screenCopy: ScreenCopySnapshot[];
  presentation: ExplorePresentationMetadata;
};

export type AppStateContextValue = {
  dataSource: DataSource;
  setDataSource: (next: DataSource) => void;
  toggleDataSource: () => void;
  universities: University[];
  faculties: Faculty[];
  programs: Program[];
  filters: FilterScreen[];
  favoritesPayload: FavoritesPayload;
  screenCopy: ScreenCopySnapshot[];
  presentation: ExplorePresentationMetadata;
  favoriteIdsByKind: FavoriteIdsByKind;
  isFavorite: (entityId: string) => boolean;
  toggleFavorite: (entityId: string) => void;
  setFavorite: (entityId: string, nextValue: boolean) => void;
  beginFilterDraft: (screenId: string) => void;
  isFilterOptionSelected: (screenId: string, sectionId: string, optionId: string) => boolean;
  toggleFilterOption: (screenId: string, sectionId: string, optionId: string) => void;
  resetFilterDraft: (screenId: string) => void;
  applyFilterDraft: (screenId: string) => void;
  getFilterDraftSelectedCount: (screenId: string) => number;
  getAppliedFilterOptionIds: (screenId: string, sectionId: string) => string[];
};

const mockBundle: DataBundle = {
  universities: mockUniversitiesData.universities as University[],
  faculties: mockFacultiesData.faculties as Faculty[],
  programs: mockProgramsData.programs as Program[],
  filters: mockFiltersData.filters as FilterScreen[],
  favoritesPayload: mockFavoritesData.favorites as FavoritesPayload,
  screenCopy: mockScreenCopyData.screenCopy as ScreenCopySnapshot[],
  presentation: mockPresentationData as ExplorePresentationMetadata,
};

const realBundle: DataBundle = {
  universities: realUniversitiesData.universities as University[],
  faculties: realFacultiesData.faculties as Faculty[],
  programs: realProgramsData.programs as Program[],
  filters: realFiltersData.filters as FilterScreen[],
  favoritesPayload: realFavoritesData.favorites as FavoritesPayload,
  screenCopy: realScreenCopyData.screenCopy as ScreenCopySnapshot[],
  presentation: realPresentationData as ExplorePresentationMetadata,
};

function buildOrderedEntityIdsByKind(
  universities: University[],
  faculties: Faculty[],
  programs: Program[]
): FavoriteIdsByKind {
  return {
    universities: universities.map((item) => item.id),
    faculties: faculties.map((item) => item.id),
    programs: programs.map((item) => item.id),
  };
}

function buildEntityKindById(
  universities: University[],
  faculties: Faculty[],
  programs: Program[]
): Map<string, FavoriteKind> {
  return new Map<string, FavoriteKind>([
    ...universities.map((item) => [item.id, "universities"] as const),
    ...faculties.map((item) => [item.id, "faculties"] as const),
    ...programs.map((item) => [item.id, "programs"] as const),
  ]);
}

function buildFilterOptionOrder(filters: FilterScreen[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const screen of filters) {
    for (const section of screen.sections) {
      map.set(`${screen.id}::${section.id}`, section.options.map((option) => option.id));
    }
  }
  return map;
}

function buildInitialFavoriteIds(
  orderedEntityIdsByKind: FavoriteIdsByKind,
  universities: University[],
  faculties: Faculty[],
  programs: Program[],
  collections: FavoriteCollection[]
): string[] {
  const ids = new Set<string>();

  for (const item of universities) {
    if (item.isFavorite) {
      ids.add(item.id);
    }
  }

  for (const item of faculties) {
    if (item.isFavorite) {
      ids.add(item.id);
    }
  }

  for (const item of programs) {
    if (item.isFavorite) {
      ids.add(item.id);
    }
  }

  for (const collection of collections) {
    for (const item of collection.items) {
      ids.add(item.entityId);
    }
  }

  const orderedIds: string[] = [];
  for (const kind of ["universities", "faculties", "programs"] as const) {
    for (const entityId of orderedEntityIdsByKind[kind]) {
      if (ids.has(entityId)) {
        orderedIds.push(entityId);
      }
    }
  }

  return orderedIds;
}

function buildDefaultFilterSelections(filters: FilterScreen[]): FilterSelectionByScreen {
  const selections: FilterSelectionByScreen = {};
  for (const screen of filters) {
    const sectionSelections: FilterSelectionBySection = {};
    for (const section of screen.sections) {
      sectionSelections[section.id] = section.options
        .filter((option) => option.selected)
        .map((option) => option.id);
    }
    selections[screen.id] = sectionSelections;
  }
  return selections;
}

function buildInitialFilterAppliedFlags(filters: FilterScreen[]): FilterAppliedFlags {
  return Object.fromEntries(filters.map((screen) => [screen.id, false])) as FilterAppliedFlags;
}

function cloneFilterSelectionBySection(selection: FilterSelectionBySection | undefined): FilterSelectionBySection {
  if (!selection) {
    return {};
  }

  const cloned: FilterSelectionBySection = {};
  for (const [sectionId, optionIds] of Object.entries(selection)) {
    cloned[sectionId] = [...optionIds];
  }
  return cloned;
}

function cloneFilterSelectionByScreen(selection: FilterSelectionByScreen): FilterSelectionByScreen {
  const cloned: FilterSelectionByScreen = {};
  for (const [screenId, sectionSelection] of Object.entries(selection)) {
    cloned[screenId] = cloneFilterSelectionBySection(sectionSelection);
  }
  return cloned;
}

function sortByKnownOrder(
  filterOptionOrder: Map<string, string[]>,
  screenId: string,
  sectionId: string,
  optionIds: string[]
): string[] {
  const order = filterOptionOrder.get(`${screenId}::${sectionId}`);
  if (!order || order.length === 0) {
    return optionIds;
  }

  const selectedIds = new Set(optionIds);
  return order.filter((optionId) => selectedIds.has(optionId));
}

function orderFavoriteIds(ids: Set<string>, orderedEntityIdsByKind: FavoriteIdsByKind): string[] {
  const orderedIds: string[] = [];
  for (const kind of ["universities", "faculties", "programs"] as const) {
    for (const id of orderedEntityIdsByKind[kind]) {
      if (ids.has(id)) {
        orderedIds.push(id);
      }
    }
  }
  return orderedIds;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = {
  children: React.ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps): React.JSX.Element {
  const [dataSource, setDataSource] = useState<DataSource>("mock");

  const activeBundle = useMemo<DataBundle>(() => {
    return dataSource === "real" ? realBundle : mockBundle;
  }, [dataSource]);

  const universities = activeBundle.universities;
  const faculties = activeBundle.faculties;
  const programs = activeBundle.programs;
  const filters = activeBundle.filters;
  const favoritesPayload = activeBundle.favoritesPayload;
  const screenCopy = activeBundle.screenCopy;
  const presentation = activeBundle.presentation;

  const orderedEntityIdsByKind = useMemo(
    () => buildOrderedEntityIdsByKind(universities, faculties, programs),
    [faculties, programs, universities]
  );
  const entityKindById = useMemo(
    () => buildEntityKindById(universities, faculties, programs),
    [faculties, programs, universities]
  );
  const filterOptionOrder = useMemo(() => buildFilterOptionOrder(filters), [filters]);

  const initialFavoriteIds = useMemo(
    () =>
      buildInitialFavoriteIds(
        orderedEntityIdsByKind,
        universities,
        faculties,
        programs,
        favoritesPayload.collections
      ),
    [orderedEntityIdsByKind, universities, faculties, programs, favoritesPayload.collections]
  );
  const defaultFilterSelections = useMemo(() => buildDefaultFilterSelections(filters), [filters]);
  const initialFilterSelections = useMemo(
    () => cloneFilterSelectionByScreen(defaultFilterSelections),
    [defaultFilterSelections]
  );
  const initialFilterAppliedFlags = useMemo(
    () => buildInitialFilterAppliedFlags(filters),
    [filters]
  );

  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [appliedFilterSelections, setAppliedFilterSelections] = useState<FilterSelectionByScreen>(initialFilterSelections);
  const [draftFilterSelections, setDraftFilterSelections] = useState<FilterSelectionByScreen>(initialFilterSelections);
  const [hasAppliedFiltersByScreen, setHasAppliedFiltersByScreen] =
    useState<FilterAppliedFlags>(initialFilterAppliedFlags);

  useEffect(() => {
    setFavoriteIds(initialFavoriteIds);
    setAppliedFilterSelections(initialFilterSelections);
    setDraftFilterSelections(initialFilterSelections);
    setHasAppliedFiltersByScreen(initialFilterAppliedFlags);
  }, [dataSource, initialFavoriteIds, initialFilterSelections, initialFilterAppliedFlags]);

  const toggleDataSource = useCallback((): void => {
    setDataSource((current) => (current === "mock" ? "real" : "mock"));
  }, []);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const favoriteIdsByKind = useMemo<FavoriteIdsByKind>(() => {
    return {
      universities: orderedEntityIdsByKind.universities.filter((entityId) => favoriteIdSet.has(entityId)),
      faculties: orderedEntityIdsByKind.faculties.filter((entityId) => favoriteIdSet.has(entityId)),
      programs: orderedEntityIdsByKind.programs.filter((entityId) => favoriteIdSet.has(entityId)),
    };
  }, [favoriteIdSet, orderedEntityIdsByKind]);

  const setFavorite = useCallback((entityId: string, nextValue: boolean): void => {
    if (!entityKindById.has(entityId)) {
      return;
    }

    setFavoriteIds((current) => {
      const ids = new Set(current);
      if (nextValue) {
        ids.add(entityId);
      } else {
        ids.delete(entityId);
      }
      return orderFavoriteIds(ids, orderedEntityIdsByKind);
    });
  }, [entityKindById, orderedEntityIdsByKind]);

  const toggleFavorite = useCallback((entityId: string): void => {
    if (!entityKindById.has(entityId)) {
      return;
    }

    setFavoriteIds((current) => {
      const ids = new Set(current);
      if (ids.has(entityId)) {
        ids.delete(entityId);
      } else {
        ids.add(entityId);
      }
      return orderFavoriteIds(ids, orderedEntityIdsByKind);
    });
  }, [entityKindById, orderedEntityIdsByKind]);

  const isFavorite = useCallback((entityId: string): boolean => {
    return favoriteIdSet.has(entityId);
  }, [favoriteIdSet]);

  const beginFilterDraft = useCallback((screenId: string): void => {
    setDraftFilterSelections((current) => {
      const source = appliedFilterSelections[screenId] ?? defaultFilterSelections[screenId];
      return {
        ...current,
        [screenId]: cloneFilterSelectionBySection(source),
      };
    });
  }, [appliedFilterSelections, defaultFilterSelections]);

  const isFilterOptionSelected = useCallback((screenId: string, sectionId: string, optionId: string): boolean => {
    const selection = draftFilterSelections[screenId]?.[sectionId] ?? [];
    return selection.includes(optionId);
  }, [draftFilterSelections]);

  const toggleFilterOption = useCallback((screenId: string, sectionId: string, optionId: string): void => {
    setDraftFilterSelections((current) => {
      const currentScreenSelection = current[screenId] ?? {};
      const sectionSelection = new Set(currentScreenSelection[sectionId] ?? []);
      if (sectionSelection.has(optionId)) {
        sectionSelection.delete(optionId);
      } else {
        sectionSelection.add(optionId);
      }

      const orderedSelection = sortByKnownOrder(
        filterOptionOrder,
        screenId,
        sectionId,
        Array.from(sectionSelection)
      );
      return {
        ...current,
        [screenId]: {
          ...currentScreenSelection,
          [sectionId]: orderedSelection,
        },
      };
    });
  }, [filterOptionOrder]);

  const resetFilterDraft = useCallback((screenId: string): void => {
    setDraftFilterSelections((current) => {
      return {
        ...current,
        [screenId]: cloneFilterSelectionBySection(defaultFilterSelections[screenId]),
      };
    });
  }, [defaultFilterSelections]);

  const applyFilterDraft = useCallback((screenId: string): void => {
    setAppliedFilterSelections((current) => {
      const draft = draftFilterSelections[screenId] ?? defaultFilterSelections[screenId];
      return {
        ...current,
        [screenId]: cloneFilterSelectionBySection(draft),
      };
    });
    setHasAppliedFiltersByScreen((current) => ({ ...current, [screenId]: true }));
  }, [draftFilterSelections, defaultFilterSelections]);

  const getFilterDraftSelectedCount = useCallback((screenId: string): number => {
    const selection = draftFilterSelections[screenId];
    if (!selection) {
      return 0;
    }

    return Object.values(selection).reduce((total, optionIds) => total + optionIds.length, 0);
  }, [draftFilterSelections]);

  const getAppliedFilterOptionIds = useCallback((screenId: string, sectionId: string): string[] => {
    if (!hasAppliedFiltersByScreen[screenId]) {
      return [];
    }
    const optionIds = appliedFilterSelections[screenId]?.[sectionId] ?? [];
    return [...optionIds];
  }, [appliedFilterSelections, hasAppliedFiltersByScreen]);

  const value = useMemo<AppStateContextValue>(() => {
    return {
      dataSource,
      setDataSource,
      toggleDataSource,
      universities,
      faculties,
      programs,
      filters,
      favoritesPayload,
      screenCopy,
      presentation,
      favoriteIdsByKind,
      isFavorite,
      toggleFavorite,
      setFavorite,
      beginFilterDraft,
      isFilterOptionSelected,
      toggleFilterOption,
      resetFilterDraft,
      applyFilterDraft,
      getFilterDraftSelectedCount,
      getAppliedFilterOptionIds,
    };
  }, [
    dataSource,
    universities,
    faculties,
    programs,
    filters,
    favoritesPayload,
    screenCopy,
    presentation,
    toggleDataSource,
    favoriteIdsByKind,
    isFavorite,
    toggleFavorite,
    setFavorite,
    beginFilterDraft,
    isFilterOptionSelected,
    toggleFilterOption,
    resetFilterDraft,
    applyFilterDraft,
    getFilterDraftSelectedCount,
    getAppliedFilterOptionIds,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider.");
  }
  return context;
}
