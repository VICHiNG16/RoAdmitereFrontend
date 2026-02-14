import { Platform } from "react-native";
import type { ViewStyle } from "react-native";

import { theme } from "./theme";

type ShadowSpec = {
  color: string;
  opacity: number;
  radius: number;
  width: number;
  height: number;
  elevation: number;
};

function buildShadow(spec: ShadowSpec): ViewStyle {
  if (Platform.OS === "ios") {
    return {
      shadowColor: spec.color,
      shadowOpacity: spec.opacity,
      shadowRadius: spec.radius,
      shadowOffset: { width: spec.width, height: spec.height },
    };
  }
  return {
    elevation: spec.elevation,
    shadowColor: spec.color,
  };
}

export const shadows = {
  none: {} as ViewStyle,
  card: buildShadow({
    color: theme.colors.shadowBase,
    opacity: 0.04,
    radius: 4,
    width: 0,
    height: 2,
    elevation: 2,
  }),
  soft: buildShadow({
    color: theme.colors.shadowBase,
    opacity: 0.08,
    radius: 12,
    width: 0,
    height: 8,
    elevation: 5,
  }),
  sticker: buildShadow({
    color: theme.colors.shadowAccent,
    opacity: 0.3,
    radius: 8,
    width: 2,
    height: 4,
    elevation: 4,
  }),
  tab: buildShadow({
    color: theme.colors.shadowBase,
    opacity: 0.03,
    radius: 6,
    width: 0,
    height: -2,
    elevation: 2,
  }),
  nav: buildShadow({
    color: theme.colors.shadowBase,
    opacity: 0.08,
    radius: 10,
    width: 0,
    height: -5,
    elevation: 8,
  }),
  float: buildShadow({
    color: theme.colors.shadowDeepBlue,
    opacity: 0.15,
    radius: 10,
    width: 0,
    height: 8,
    elevation: 6,
  }),
} as const;
