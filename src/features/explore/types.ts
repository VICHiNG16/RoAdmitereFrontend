import type { Faculty, Program, University } from "../../data/mock/types";
import type { AppIconName } from "../../utils/icons";

export type ExploreTabKey = "universities" | "faculties" | "programs";
export type ExploreTabTransitionSource = "tap" | "swipe";

export type ExploreFilterRoute = "/modals/filter-universities" | "/modals/filter-faculties" | "/modals/filter-programs";

export type ExploreTabConfig = {
  key: ExploreTabKey;
  label: string;
  screenId: number;
  filterRoute: ExploreFilterRoute;
};

export type ExploreTabTransitionState = {
  from: ExploreTabKey;
  to: ExploreTabKey;
  direction: -1 | 1;
  source: ExploreTabTransitionSource;
};

export type ExploreFilterContext = {
  searchQuery: string;
  universityCityFilterIds: Set<string>;
  universityTypeFilterIds: Set<string>;
  facultyCityFilterIds: Set<string>;
  facultyDomainFilterIds: Set<string>;
  programLanguageFilterIds: Set<string>;
  programLevelFilterIds: Set<string>;
  programStudyFormFilterIds: Set<string>;
  programDurationFilterIds: Set<string>;
};

export type ExploreDerivedItemKind = "university" | "faculty" | "program";

export type ExploreDerivedItem = {
  id: string;
  kind: ExploreDerivedItemKind;
  title: string;
  subtitle: string;
  searchableFields: string[];
  sourceScreens: number[];
};

export type ExploreProgramPresentation = {
  tone: "accent" | "olive" | "deepBlue";
  icon: AppIconName;
};

export type ExploreFacultyTone = "accent" | "olive";
export type ExploreUniversityMediaTone = "accent" | "olive";

export type ExploreUniversityTypeOptionId = "option-publica" | "option-privata";

export type ExploreDataBundle = {
  universities: University[];
  faculties: Faculty[];
  programs: Program[];
};
