import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../theme/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  scrollable?: boolean;
  backgroundColor?: keyof typeof theme.colors;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  padded = true,
  scrollable = true,
  backgroundColor = "background",
  style,
  contentContainerStyle,
}: ScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const androidStatusBarHeight = StatusBar.currentHeight ?? 0;
  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, androidStatusBarHeight)
      : insets.top;
  const baseContentSpacing: StyleProp<ViewStyle> = {
    paddingTop: topInset + theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  };

  if (!scrollable) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors[backgroundColor] }, style]}>
        <View style={[styles.contentView, padded && styles.padded, baseContentSpacing, contentContainerStyle]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors[backgroundColor] }, style]}>
      <ScrollView
        contentContainerStyle={[styles.contentScroll, padded && styles.padded, baseContentSpacing, contentContainerStyle]}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentScroll: {
    flexGrow: 1,
  },
  contentView: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
  },
});

