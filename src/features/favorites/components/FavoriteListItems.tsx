import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { resolveStitchAsset } from "../../../assets-map";
import { CardFaculty, CardProgram, CardUniversity } from "../../../components";
import type { CardUniversityMediaTone } from "../../../components/CardUniversity";
import type { CardFacultyTone } from "../../../components/CardFaculty";
import type { CardProgramTone } from "../../../components/CardProgram";
import { theme } from "../../../theme/theme";

type ProgramFavoriteRowProps = {
  entityId: string;
  name: string;
  level: string;
  durationLabel?: string;
  subtitle?: string;
  icon: string;
  tone: CardProgramTone;
  onOpenProgram: (entityId: string) => void;
  onToggleFavorite: (entityId: string) => void;
};

export const ProgramFavoriteRow = memo(function ProgramFavoriteRow({
  entityId,
  name,
  level,
  durationLabel,
  subtitle,
  icon,
  tone,
  onOpenProgram,
  onToggleFavorite,
}: ProgramFavoriteRowProps): React.JSX.Element {
  return (
    <View style={styles.programItem}>
      <CardProgram
        durationLabel={durationLabel}
        icon={icon}
        isFavorite
        level={level}
        name={name}
        onPress={() => onOpenProgram(entityId)}
        onToggleFavorite={() => onToggleFavorite(entityId)}
        subtitle={subtitle}
        tone={tone}
        variant="favorite"
      />
    </View>
  );
});

type GridAddCellProps = {
  variant: "universities" | "faculties";
  label: string;
  onPress: () => void;
};

export const GridAddCell = memo(function GridAddCell({
  variant,
  label,
  onPress,
}: GridAddCellProps): React.JSX.Element {
  return (
    <View style={styles.gridCell}>
      {variant === "universities" ? (
        <CardUniversity ctaLabel={label} onPress={onPress} style={styles.gridCard} variant="add" />
      ) : (
        <CardFaculty ctaLabel={label} onPress={onPress} style={styles.gridCard} variant="add" />
      )}
    </View>
  );
});

type UniversityGridEntityCellProps = {
  entityId: string;
  name: string;
  city: string;
  logoAlt?: string;
  logoUrl?: string;
  mediaTone: CardUniversityMediaTone;
  onOpenUniversity: (entityId: string) => void;
  onToggleFavorite: (entityId: string) => void;
};

export const UniversityGridEntityCell = memo(function UniversityGridEntityCell({
  entityId,
  name,
  city,
  logoAlt,
  logoUrl,
  mediaTone,
  onOpenUniversity,
  onToggleFavorite,
}: UniversityGridEntityCellProps): React.JSX.Element {
  return (
    <View style={styles.gridCell}>
      <CardUniversity
        city={city}
        isFavorite
        logoAlt={logoAlt}
        logoSource={resolveStitchAsset(logoUrl)}
        mediaTone={mediaTone}
        name={name}
        onPress={() => onOpenUniversity(entityId)}
        onToggleFavorite={() => onToggleFavorite(entityId)}
        style={styles.gridCard}
        variant="grid"
      />
    </View>
  );
});

type FacultyGridEntityCellProps = {
  entityId: string;
  name: string;
  universityName: string;
  icon: string;
  tone: CardFacultyTone;
  onOpenFaculty: (entityId: string) => void;
  onToggleFavorite: (entityId: string) => void;
};

export const FacultyGridEntityCell = memo(function FacultyGridEntityCell({
  entityId,
  name,
  universityName,
  icon,
  tone,
  onOpenFaculty,
  onToggleFavorite,
}: FacultyGridEntityCellProps): React.JSX.Element {
  return (
    <View style={styles.gridCell}>
      <CardFaculty
        icon={icon}
        isFavorite
        name={name}
        onPress={() => onOpenFaculty(entityId)}
        onToggleFavorite={() => onToggleFavorite(entityId)}
        style={styles.gridCard}
        tone={tone}
        universityName={universityName}
        variant="grid"
      />
    </View>
  );
});

type ProgramAddFooterProps = {
  ctaLabel: string;
  onPress: () => void;
};

export const ProgramAddFooter = memo(function ProgramAddFooter({
  ctaLabel,
  onPress,
}: ProgramAddFooterProps): React.JSX.Element {
  return (
    <View style={styles.programAddCard}>
      <CardProgram ctaLabel={ctaLabel} onPress={onPress} variant="add" />
    </View>
  );
});

const styles = StyleSheet.create({
  gridCell: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.layout.gridGap,
  },
  gridCard: {
    width: "100%",
  },
  programItem: {
    paddingBottom: theme.spacing.sm,
  },
  programAddCard: {
    marginTop: theme.spacing.sm,
  },
});

