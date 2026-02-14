import { memo } from "react";

import { CardProgram } from "../../../components/CardProgram";
import type { Program } from "../../../data/mock/types";
import type { ExploreProgramPresentation } from "../types";

type ExploreProgramRowProps = {
  program: Program;
  presentation: ExploreProgramPresentation;
  isFavorite: boolean;
  onOpen: (programId: string) => void;
  onToggleFavorite: (programId: string) => void;
};

function ExploreProgramRowBase({
  program,
  presentation,
  isFavorite,
  onOpen,
  onToggleFavorite,
}: ExploreProgramRowProps): React.JSX.Element {
  return (
    <CardProgram
      durationLabel={program.durationLabel}
      facultyName={program.facultyName}
      icon={presentation.icon}
      isFavorite={isFavorite}
      level={program.level}
      name={program.name}
      onPress={() => onOpen(program.id)}
      onToggleFavorite={() => onToggleFavorite(program.id)}
      tone={presentation.tone}
      universityName={program.universityName}
    />
  );
}

export const ExploreProgramRow = memo(ExploreProgramRowBase);
