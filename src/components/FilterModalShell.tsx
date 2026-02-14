import { MaterialIcons } from "@expo/vector-icons";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { normalizeRomanianText } from "../utils/text";
import { PrimaryButton } from "./PrimaryButton";

const FOOTER_BASE_HEIGHT = 170;

type FilterModalShellProps = PropsWithChildren<{
  title: string;
  animatedStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  resetLabel: string;
  applyLabel: string;
  applyBadgeLabel?: string;
}>;

type FilterSectionCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function FilterModalShell({
  title,
  animatedStyle,
  contentContainerStyle,
  onClose,
  onReset,
  onApply,
  resetLabel,
  applyLabel,
  applyBadgeLabel,
  children,
}: FilterModalShellProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const showHomeIndicator = Platform.OS === "ios";
  const androidStatusBarHeight = StatusBar.currentHeight ?? 0;
  const headerTopInset =
    Platform.OS === "android"
      ? Math.max(insets.top, androidStatusBarHeight)
      : insets.top;
  const footerBottomInset = Math.max(insets.bottom, theme.spacing.lg);

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      <View style={[styles.header, { paddingTop: headerTopInset + theme.spacing.md }]}>
        <Pressable
          accessibilityLabel="Înapoi"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <MaterialIcons color={theme.colors.textPrimary80} name="arrow-back" size={theme.sizes.iconLg} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {normalizeRomanianText(title)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: FOOTER_BASE_HEIGHT + footerBottomInset,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomInset }]}>
        <View style={styles.footerRow}>
          <Pressable accessibilityRole="button" onPress={onReset} style={styles.resetButton}>
            <Text style={styles.resetText}>{normalizeRomanianText(resetLabel)}</Text>
          </Pressable>

          <PrimaryButton
            badgeLabel={applyBadgeLabel}
            label={normalizeRomanianText(applyLabel)}
            onPress={onApply}
            size="lg"
            style={styles.applyButton}
          />
        </View>
        {showHomeIndicator ? <View style={styles.homeIndicator} /> : null}
      </View>
    </Animated.View>
  );
}

export function FilterSectionCard({
  children,
  style,
}: FilterSectionCardProps): React.JSX.Element {
  return <View style={[styles.sectionCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.sand,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  backButton: {
    width: theme.sizes.controlMd,
    height: theme.sizes.controlMd,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  title: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.hero,
    lineHeight: typography.lineHeight.hero,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xxl,
    borderWidth: theme.borderWidths.regular,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.lg,
    ...shadows.card,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.sand,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  resetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  resetText: {
    color: theme.colors.textPrimary50,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  applyButton: {
    flex: 1,
    borderRadius: theme.radii.xl,
  },
  homeIndicator: {
    alignSelf: "center",
    marginTop: theme.spacing.xl,
    width: theme.sizes.homeIndicatorWidth,
    height: theme.sizes.homeIndicatorHeight,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.deepBlue10,
  },
});
