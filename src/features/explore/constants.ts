import { theme } from "../../theme/theme";
import type { ExploreTabConfig, ExploreTabKey } from "./types";

export const TAB_CONFIGS: ExploreTabConfig[] = [
  { key: "universities", label: "Universități", screenId: 1, filterRoute: "/modals/filter-universities" },
  { key: "faculties", label: "Facultăți", screenId: 3, filterRoute: "/modals/filter-faculties" },
  { key: "programs", label: "Programe", screenId: 6, filterRoute: "/modals/filter-programs" },
];

export const EXPLORE_TAB_ORDER = TAB_CONFIGS.map((config) => config.key) as readonly ExploreTabKey[];

export const UNIVERSITY_ORDER = [
  "university-universitatea-babes-bolyai",
  "university-universitatea-din-bucuresti",
  "university-universitatea-de-vest",
] as const;

export const FACULTY_ORDER = [
  "faculty-facultatea-de-istorie",
  "faculty-facultatea-de-biologie",
  "faculty-facultatea-de-drept",
  "faculty-arte-si-design",
] as const;

export const PROGRAM_ORDER = [
  "program-cibernetica-economica-ase-bucuresti",
  "program-drept-ubb-cluj",
  "program-psihologie-clinica-univ-din-bucuresti",
  "program-informatica-uvt-timisoara",
] as const;

export const TAB_BAR_SAFE_PADDING = theme.sizes.bottomNav + theme.spacing.xl;

export const OPTION_PREFIX = "option-";

export const exploreSwipeConfig = {
  activationOffset: 12,
  verticalFailOffset: 20,
  commitProgressThreshold: 0.3,
  commitVelocityThreshold: 760,
  maxSettleDuration: 280,
  minSettleDuration: 130,
  dragFriction: 0.98,
} as const;

export const exploreTapTransitionConfig = {
  durationScale: 1.22,
  distanceDurationScale: 0.55,
} as const;
