import type { Faculty, Program, University } from "../../data/mock/types";
import { normalizeTextForSearch } from "../../utils/text";
import { OPTION_PREFIX } from "./constants";
import type { ExploreDataBundle, ExploreDerivedItem, ExploreFilterContext } from "./types";

const universityCityOptionCache = new Map<string, string>();
const facultyCityOptionCache = new Map<string, string>();
const facultyDomainOptionCache = new Map<string, string[]>();
const programLanguageOptionCache = new Map<string, string[]>();
const programLevelOptionCache = new Map<string, string>();
const programStudyFormOptionCache = new Map<string, string>();
const programDurationOptionCache = new Map<string, string>();

export function normalizeForSearch(value: string): string {
  return normalizeTextForSearch(value);
}

export function slugifyToken(value: string): string {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function optionIdFromToken(token: string): string {
  return `${OPTION_PREFIX}${token}`;
}

export function passesOptionFilter(selectedOptionIds: Set<string>, candidateOptionIds: string[]): boolean {
  if (selectedOptionIds.size === 0) {
    return true;
  }

  for (const optionId of candidateOptionIds) {
    if (selectedOptionIds.has(optionId)) {
      return true;
    }
  }
  return false;
}

export function matchesSearchQuery(searchQuery: string, searchableFields: string[]): boolean {
  if (!searchQuery) {
    return true;
  }

  return searchableFields.some((field) => normalizeForSearch(field).includes(searchQuery));
}

export function inferFacultyCityOptionId(faculty: Faculty): string {
  const cacheKey = `${faculty.id}::${faculty.locationLabel}::${faculty.universityName}`;
  const cachedValue = facultyCityOptionCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const locationCity = faculty.locationLabel.split(",")[0]?.trim();
  if (locationCity) {
    const optionId = optionIdFromToken(slugifyToken(locationCity));
    facultyCityOptionCache.set(cacheKey, optionId);
    return optionId;
  }

  const normalizedUniversityName = normalizeForSearch(faculty.universityName);
  const universityNameCityTokens: Array<[needle: string, cityToken: string]> = [
    ["babes bolyai", "cluj-napoca"],
    ["cluj napoca", "cluj-napoca"],
    ["timisoara", "timisoara"],
    ["iasi", "iasi"],
    ["oradea", "oradea"],
    ["galati", "galati"],
    ["bucuresti", "bucuresti"],
    ["unibuc", "bucuresti"],
    ["unarte", "bucuresti"],
  ];

  for (const [needle, cityToken] of universityNameCityTokens) {
    if (normalizedUniversityName.includes(needle)) {
      const optionId = optionIdFromToken(cityToken);
      facultyCityOptionCache.set(cacheKey, optionId);
      return optionId;
    }
  }

  const cityFromUniversityNameMatch = normalizedUniversityName.match(/\bdin ([a-z0-9 ]+)$/);
  if (cityFromUniversityNameMatch) {
    const cityToken = slugifyToken(cityFromUniversityNameMatch[1]);
    const optionId = optionIdFromToken(cityToken);
    facultyCityOptionCache.set(cacheKey, optionId);
    return optionId;
  }

  facultyCityOptionCache.set(cacheKey, "");
  return "";
}

export function inferFacultyDomainOptionIds(faculty: Faculty): string[] {
  const cacheKey = `${faculty.id}::${faculty.name}::${faculty.domain}`;
  const cachedValue = facultyDomainOptionCache.get(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const normalizedDetails = normalizeForSearch(`${faculty.name} ${faculty.domain}`);
  const optionIds: string[] = [];

  if (normalizedDetails.includes("it") || normalizedDetails.includes("calcul") || normalizedDetails.includes("informatic")) {
    optionIds.push("option-it-calculatoare");
  }
  if (normalizedDetails.includes("medicin") || normalizedDetails.includes("biolog") || normalizedDetails.includes("natur")) {
    optionIds.push("option-medicina");
  }
  if (normalizedDetails.includes("drept") || normalizedDetails.includes("juridic")) {
    optionIds.push("option-drept");
  }
  if (normalizedDetails.includes("economie")) {
    optionIds.push("option-economie");
  }
  if (normalizedDetails.includes("arte") || normalizedDetails.includes("design")) {
    optionIds.push("option-arte");
  }
  if (normalizedDetails.includes("inginer")) {
    optionIds.push("option-inginerie");
  }
  if (normalizedDetails.includes("litere") || normalizedDetails.includes("istorie") || normalizedDetails.includes("uman")) {
    optionIds.push("option-litere");
  }
  if (normalizedDetails.includes("psiholog")) {
    optionIds.push("option-psihologie");
  }
  if (normalizedDetails.includes("politic")) {
    optionIds.push("option-stiinte-politice");
  }
  if (normalizedDetails.includes("jurnal")) {
    optionIds.push("option-jurnalism");
  }
  if (normalizedDetails.includes("arhitect")) {
    optionIds.push("option-arhitectura");
  }

  const resolvedOptionIds = Array.from(new Set(optionIds));
  facultyDomainOptionCache.set(cacheKey, resolvedOptionIds);
  return resolvedOptionIds;
}

export function inferProgramLanguageOptionIds(program: Program): string[] {
  const cacheKey = `${program.id}::${program.language}`;
  const cachedValue = programLanguageOptionCache.get(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const normalizedLanguage = normalizeForSearch(program.language);
  const optionIds: string[] = [];

  if (!normalizedLanguage || normalizedLanguage.includes("romana")) {
    optionIds.push("option-romana");
  }
  if (normalizedLanguage.includes("englez")) {
    optionIds.push("option-engleza");
  }
  if (normalizedLanguage.includes("francez")) {
    optionIds.push("option-franceza");
  }
  if (normalizedLanguage.includes("german")) {
    optionIds.push("option-germana");
  }

  const resolvedOptionIds = Array.from(new Set(optionIds));
  programLanguageOptionCache.set(cacheKey, resolvedOptionIds);
  return resolvedOptionIds;
}

export function inferProgramLevelOptionId(program: Program): string {
  const cacheKey = `${program.id}::${program.level}`;
  const cachedValue = programLevelOptionCache.get(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const normalizedLevel = normalizeForSearch(program.level);
  const optionId = normalizedLevel.includes("master") ? "option-master" : "option-licenta";
  programLevelOptionCache.set(cacheKey, optionId);
  return optionId;
}

export function inferProgramStudyFormOptionId(program: Program): string {
  const cacheKey = `${program.id}::${program.studyMode}`;
  const cachedValue = programStudyFormOptionCache.get(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const normalizedStudyMode = normalizeForSearch(program.studyMode);
  const optionId =
    normalizedStudyMode.includes("id") || normalizedStudyMode.includes("distanta")
      ? "option-la-distanta-id"
      : "option-cu-frecventa-if";

  programStudyFormOptionCache.set(cacheKey, optionId);
  return optionId;
}

export function inferProgramDurationOptionId(program: Program): string {
  const cacheKey = `${program.id}::${program.durationYears?.toString() ?? ""}::${program.durationLabel}`;
  const cachedValue = programDurationOptionCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  if (program.durationYears) {
    const optionId = optionIdFromToken(`${program.durationYears.toString()}-ani`);
    programDurationOptionCache.set(cacheKey, optionId);
    return optionId;
  }

  const normalizedDuration = normalizeForSearch(program.durationLabel);
  const matchedYears = normalizedDuration.match(/\d+/);
  if (!matchedYears) {
    programDurationOptionCache.set(cacheKey, "");
    return "";
  }

  const optionId = optionIdFromToken(`${matchedYears[0]}-ani`);
  programDurationOptionCache.set(cacheKey, optionId);
  return optionId;
}

function getUniversityCityOptionId(city: string): string {
  const cachedOptionId = universityCityOptionCache.get(city);
  if (cachedOptionId !== undefined) {
    return cachedOptionId;
  }

  const optionId = optionIdFromToken(slugifyToken(city));
  universityCityOptionCache.set(city, optionId);
  return optionId;
}

export function sortByFixedOrder<T extends { id: string }>(items: T[], order: readonly string[]): T[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const orderedItems = order.flatMap((id) => {
    const item = itemById.get(id);
    return item ? [item] : [];
  });
  const knownIds = new Set(orderedItems.map((item) => item.id));
  const unknownItems = items.filter((item) => !knownIds.has(item.id)).sort((left, right) => left.id.localeCompare(right.id));
  return [...orderedItems, ...unknownItems];
}

export function buildExploreDerivedItems(data: ExploreDataBundle): ExploreDerivedItem[] {
  const universities = data.universities.map((item) => ({
    id: item.id,
    kind: "university" as const,
    title: item.name,
    subtitle: item.city,
    searchableFields: [item.name, item.city, item.facultyCountLabel],
    sourceScreens: item.sourceScreens,
  }));
  const faculties = data.faculties.map((item) => ({
    id: item.id,
    kind: "faculty" as const,
    title: item.name,
    subtitle: item.universityName,
    searchableFields: [item.name, item.universityName, item.domain],
    sourceScreens: item.sourceScreens,
  }));
  const programs = data.programs.map((item) => ({
    id: item.id,
    kind: "program" as const,
    title: item.name,
    subtitle: item.universityName,
    searchableFields: [item.name, item.universityName, item.facultyName, item.level],
    sourceScreens: item.sourceScreens,
  }));
  return [...universities, ...faculties, ...programs];
}

export function filterUniversities(
  universities: University[],
  context: ExploreFilterContext,
  getUniversityTypeOptionId: (universityId: string) => string | undefined
): University[] {
  return universities.filter((university) => {
    const matchesCity = passesOptionFilter(
      context.universityCityFilterIds,
      [getUniversityCityOptionId(university.city)]
    );
    const mappedUniversityType = getUniversityTypeOptionId(university.id);
    const matchesType = passesOptionFilter(
      context.universityTypeFilterIds,
      mappedUniversityType ? [mappedUniversityType] : []
    );
    const matchesSearch = matchesSearchQuery(context.searchQuery, [
      university.name,
      university.city,
      university.facultyCountLabel,
    ]);

    return matchesCity && matchesType && matchesSearch;
  });
}

export function filterFaculties(faculties: Faculty[], context: ExploreFilterContext): Faculty[] {
  return faculties.filter((faculty) => {
    const cityOptionId = inferFacultyCityOptionId(faculty);
    const matchesCity = passesOptionFilter(
      context.facultyCityFilterIds,
      cityOptionId ? [cityOptionId] : []
    );
    const matchesDomain = passesOptionFilter(
      context.facultyDomainFilterIds,
      inferFacultyDomainOptionIds(faculty)
    );
    const matchesSearch = matchesSearchQuery(context.searchQuery, [
      faculty.name,
      faculty.universityName,
      faculty.domain,
    ]);

    return matchesCity && matchesDomain && matchesSearch;
  });
}

export function filterPrograms(programs: Program[], context: ExploreFilterContext): Program[] {
  return programs.filter((program) => {
    const languageOptionIds = inferProgramLanguageOptionIds(program);
    const levelOptionId = inferProgramLevelOptionId(program);
    const studyFormOptionId = inferProgramStudyFormOptionId(program);
    const durationOptionId = inferProgramDurationOptionId(program);

    const matchesLanguage = passesOptionFilter(context.programLanguageFilterIds, languageOptionIds);
    const matchesLevel = passesOptionFilter(context.programLevelFilterIds, [levelOptionId]);
    const matchesStudyForm = passesOptionFilter(
      context.programStudyFormFilterIds,
      studyFormOptionId ? [studyFormOptionId] : []
    );
    const matchesDuration = passesOptionFilter(
      context.programDurationFilterIds,
      durationOptionId ? [durationOptionId] : []
    );
    const matchesSearch = matchesSearchQuery(context.searchQuery, [
      program.name,
      program.universityName,
      program.facultyName,
      program.level,
    ]);

    return matchesLanguage && matchesLevel && matchesStudyForm && matchesDuration && matchesSearch;
  });
}
