import presentationData from "../../data/mock/generated/presentation.json";
import type { ExplorePresentationMetadata } from "../../data/mock/types";
import type { AppIconName } from "../../utils/icons";
import type { ExploreFacultyTone, ExploreProgramPresentation, ExploreUniversityMediaTone, ExploreUniversityTypeOptionId } from "./types";

const presentation = presentationData as ExplorePresentationMetadata;

function resolvePresentationMetadata(metadata: ExplorePresentationMetadata | undefined): ExplorePresentationMetadata {
  return metadata ?? presentation;
}

export function getFacultyToneById(
  facultyId: string,
  metadata?: ExplorePresentationMetadata
): ExploreFacultyTone {
  const source = resolvePresentationMetadata(metadata);
  return source.faculties[facultyId]?.tone ?? "accent";
}

export function getProgramPresentationById(
  programId: string,
  metadata?: ExplorePresentationMetadata
): ExploreProgramPresentation {
  const source = resolvePresentationMetadata(metadata);
  const program = source.programs[programId];
  return {
    tone: program?.tone ?? "accent",
    icon: (program?.icon ?? "code") as AppIconName,
  };
}

export function getUniversityMediaToneByIndex(
  index: number,
  universityId?: string,
  metadata?: ExplorePresentationMetadata
): ExploreUniversityMediaTone {
  const source = resolvePresentationMetadata(metadata);
  if (universityId && source.universities[universityId]?.mediaTone) {
    return source.universities[universityId].mediaTone;
  }
  return index % 2 === 0 ? "accent" : "olive";
}

export function getUniversityTypeOptionId(
  universityId: string,
  metadata?: ExplorePresentationMetadata
): ExploreUniversityTypeOptionId | undefined {
  const source = resolvePresentationMetadata(metadata);
  return source.universities[universityId]?.typeOptionId;
}
