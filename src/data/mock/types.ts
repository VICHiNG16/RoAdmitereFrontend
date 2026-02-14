export interface ExtractionMeta {
  sourceRoot: string;
  screenCount: number;
  deterministicOrder: string;
  counts?: {
    universities: number;
    faculties: number;
    programs: number;
    filterScreens: number;
    favoriteCollections: number;
  };
}

export interface StitchManifestScreen {
  screenId: number;
  role: string;
  folder: string;
  title: string;
  codePath: string;
  screenshotPath: string;
  htmlSha256: string;
}

export interface StitchManifest {
  meta: ExtractionMeta;
  screens: StitchManifestScreen[];
}

export interface SourceTrackedEntity {
  id: string;
  name: string;
  sourceScreens: number[];
  isFavorite: boolean;
}

export interface University extends SourceTrackedEntity {
  city: string;
  facultyCountLabel: string;
  facultyCount: number | null;
  logoAlt: string;
  logoUrl: string;
  description: string;
  locationLabel: string;
  officialUrl?: string;
}

export interface Faculty extends SourceTrackedEntity {
  universityName: string;
  domain: string;
  programCountLabel: string;
  programCount: number | null;
  icon: string;
  description: string;
  locationLabel: string;
  officialUrl?: string;
}

export interface Program extends SourceTrackedEntity {
  level: string;
  durationLabel: string;
  durationYears: number | null;
  studyMode: string;
  universityName: string;
  facultyName: string;
  language: string;
  creditsLabel: string;
  admissionAverage: number | null;
  descriptionParagraphs: string[];
  careerOpportunities: string[];
  officialUrl?: string;
}

export interface UniversityPresentationMetadata {
  mediaTone: "accent" | "olive";
  typeOptionId?: "option-publica" | "option-privata";
}

export interface FacultyPresentationMetadata {
  tone: "accent" | "olive";
}

export interface ProgramPresentationMetadata {
  tone: "accent" | "olive" | "deepBlue";
  icon: string;
}

export interface ExplorePresentationMetadata {
  meta: ExtractionMeta;
  universities: Record<string, UniversityPresentationMetadata>;
  faculties: Record<string, FacultyPresentationMetadata>;
  programs: Record<string, ProgramPresentationMetadata>;
}

export interface FilterOption {
  id: string;
  label: string;
  count: number | null;
  selected: boolean;
  description: string;
}

export interface FilterSection {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface FilterFooter {
  resetLabel: string;
  applyLabel: string;
  selectedCount: number | null;
}

export interface FilterScreen {
  id: string;
  screenId: number;
  title: string;
  sections: FilterSection[];
  footer: FilterFooter;
}

export interface FavoriteCollectionItem {
  entityId: string;
  name: string;
  subtitle: string;
  level?: string;
  durationLabel?: string;
}

export interface FavoriteCollection {
  kind: "universities" | "faculties" | "programs";
  screenId: number;
  tabs: string[];
  activeTab: string;
  items: FavoriteCollectionItem[];
  addCardLabel: string;
}

export interface FavoritesEmptyState {
  screenId: number;
  title: string;
  description: string;
  ctaLabel: string;
}

export interface FavoritesPayload {
  collections: FavoriteCollection[];
  emptyState: FavoritesEmptyState;
}

export interface ScreenCopySnapshot {
  screenId: number;
  title: string;
  headings: string[];
  paragraphs: string[];
  inputPlaceholders: string[];
  buttonLabels: string[];
  badgeTexts: string[];
  imageAlts: string[];
}

export interface MockDataBundle {
  meta: ExtractionMeta;
  universities: University[];
  faculties: Faculty[];
  programs: Program[];
  filters: FilterScreen[];
  favorites: FavoritesPayload;
  screenCopy: ScreenCopySnapshot[];
  presentation: ExplorePresentationMetadata;
}

export interface TailwindTokenEntry {
  name: string;
  value: string;
  sourceScreens: number[];
}

export interface TailwindFontFamilyEntry {
  name: string;
  values: string[];
  sourceScreens: number[];
}

export interface RawTokens {
  meta: ExtractionMeta;
  tailwind: {
    colors: TailwindTokenEntry[];
    fontFamilies: TailwindFontFamilyEntry[];
    borderRadius: TailwindTokenEntry[];
    boxShadows: TailwindTokenEntry[];
  };
  css: {
    hexColors: string[];
    rgbaColors: string[];
    fontVariationSettings: string[];
    minHeightRules: string[];
    dataImageRefs: string[];
  };
  classArbitraryValues: Record<string, string[]>;
}
