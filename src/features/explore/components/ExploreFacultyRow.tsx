import { memo } from "react";

import { CardFaculty } from "../../../components/CardFaculty";
import type { Faculty } from "../../../data/mock/types";
import type { ExploreFacultyTone } from "../types";

type ExploreFacultyRowProps = {
  faculty: Faculty;
  tone: ExploreFacultyTone;
  isFavorite: boolean;
  onOpen: (facultyId: string) => void;
  onToggleFavorite: (facultyId: string) => void;
};

function ExploreFacultyRowBase({
  faculty,
  tone,
  isFavorite,
  onOpen,
  onToggleFavorite,
}: ExploreFacultyRowProps): React.JSX.Element {
  return (
    <CardFaculty
      domain={faculty.domain}
      icon={faculty.icon}
      isFavorite={isFavorite}
      name={faculty.name}
      onPress={() => onOpen(faculty.id)}
      onToggleFavorite={() => onToggleFavorite(faculty.id)}
      programCountLabel={faculty.programCountLabel}
      tone={tone}
      universityName={faculty.universityName}
    />
  );
}

export const ExploreFacultyRow = memo(ExploreFacultyRowBase);
