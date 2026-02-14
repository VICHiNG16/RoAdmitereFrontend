import { memo } from "react";

import { resolveStitchAsset } from "../../../assets-map";
import type { University } from "../../../data/mock/types";
import type { CardUniversityMediaTone } from "../../../components/CardUniversity";
import { CardUniversity } from "../../../components/CardUniversity";

type ExploreUniversityRowProps = {
  university: University;
  mediaTone: CardUniversityMediaTone;
  isFavorite: boolean;
  onOpen: (universityId: string) => void;
  onToggleFavorite: (universityId: string) => void;
};

function ExploreUniversityRowBase({
  university,
  mediaTone,
  isFavorite,
  onOpen,
  onToggleFavorite,
}: ExploreUniversityRowProps): React.JSX.Element {
  return (
    <CardUniversity
      city={university.city}
      facultyCountLabel={university.facultyCountLabel}
      isFavorite={isFavorite}
      logoAlt={university.logoAlt}
      logoSource={resolveStitchAsset(university.logoUrl)}
      mediaTone={mediaTone}
      name={university.name}
      onPress={() => onOpen(university.id)}
      onToggleFavorite={() => onToggleFavorite(university.id)}
    />
  );
}

export const ExploreUniversityRow = memo(ExploreUniversityRowBase);
