import type { Href } from "expo-router";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import { Screen } from "./Screen";

type PlaceholderLink = {
  href: Href;
  label: string;
};

type PhasePlaceholderProps = {
  title: string;
  subtitle: string;
  links?: PlaceholderLink[];
};

export function PhasePlaceholder({
  title,
  subtitle,
  links = [],
}: PhasePlaceholderProps): React.JSX.Element {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {links.map((link) => (
          <Link key={link.label} href={link.href} style={styles.link}>
            {link.label}
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  link: {
    color: theme.colors.accent,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    paddingVertical: theme.spacing.xs,
  },
});

