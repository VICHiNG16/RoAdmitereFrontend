import { MaterialIcons } from "@expo/vector-icons";

export type AppIconName = keyof typeof MaterialIcons.glyphMap;

const KNOWN_ICON_NAMES: Record<string, AppIconName> = {
  add: "add",
  analytics: "analytics",
  architecture: "architecture",
  arrow_back: "arrow-back",
  arrow_forward: "arrow-forward",
  backpack: "backpack",
  battery_full: "battery-full",
  biotech: "biotech",
  calculate: "calculate",
  category: "category",
  check: "check",
  class: "class",
  code: "code",
  computer: "computer",
  explore: "travel-explore",
  favorite: "favorite",
  favorite_border: "favorite-border",
  functions: "functions",
  gavel: "gavel",
  history_edu: "history-edu",
  info: "info",
  language: "language",
  location_on: "location-on",
  menu_book: "menu-book",
  notifications: "notifications",
  open_in_new: "open-in-new",
  palette: "palette",
  psychology: "psychology",
  school: "school",
  schedule: "schedule",
  search: "search",
  signal_cellular_alt: "signal-cellular-alt",
  stars: "stars",
  theater_comedy: "theater-comedy",
  timelapse: "timelapse",
  tune: "tune",
  wifi: "wifi",
  work: "work",
  workspace_premium: "workspace-premium",
};

export const tabIconByRoute: Record<string, AppIconName> = {
  explore: "explore",
  favorites: "favorite",
};

export function resolveIconName(raw: string | undefined, fallback: AppIconName): AppIconName {
  if (!raw) {
    return fallback;
  }
  return KNOWN_ICON_NAMES[raw] ?? fallback;
}
