import type {
  FavoriteCollection,
  FavoriteCollectionItem,
  Faculty,
  Program,
  University,
} from "../../data/mock/types";

export type FavoriteTabKey = "universities" | "faculties" | "programs";

export type FavoriteLookups = {
  universityById: Map<string, University>;
  facultyById: Map<string, Faculty>;
  programById: Map<string, Program>;
  collectionByKind: Map<FavoriteTabKey, FavoriteCollection>;
  favoriteItemByEntityId: Map<string, FavoriteCollectionItem>;
};

export type FavoriteGridCell =
  | {
    key: string;
    type: "entity";
    entityId: string;
  }
  | {
    key: "__add__";
    type: "add";
  };

export function buildFavoriteLookups(
  universities: University[],
  faculties: Faculty[],
  programs: Program[],
  collections: FavoriteCollection[]
): FavoriteLookups {
  const typedCollections = collections.filter((collection): collection is FavoriteCollection => {
    return collection.kind === "universities" || collection.kind === "faculties" || collection.kind === "programs";
  });

  return {
    universityById: new Map(universities.map((university) => [university.id, university])),
    facultyById: new Map(faculties.map((faculty) => [faculty.id, faculty])),
    programById: new Map(programs.map((program) => [program.id, program])),
    collectionByKind: new Map(typedCollections.map((collection) => [collection.kind, collection])),
    favoriteItemByEntityId: new Map(
      typedCollections.flatMap((collection) =>
        collection.items.map((item) => [item.entityId, item] as const)
      )
    ),
  };
}

export function buildFavoriteGridCells(entityIds: string[]): FavoriteGridCell[] {
  const entityCells = entityIds.map((entityId) => ({
    key: entityId,
    type: "entity" as const,
    entityId,
  }));

  return [...entityCells, { key: "__add__", type: "add" }];
}

export function buildToneByUniversityId(
  entityIds: string[],
  tones: readonly ("accent" | "olive")[]
): Map<string, "accent" | "olive"> {
  return new Map(
    entityIds.map((entityId, index) => [entityId, tones[index % tones.length]])
  );
}
