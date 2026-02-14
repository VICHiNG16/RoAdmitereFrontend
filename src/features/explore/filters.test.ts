import type { Faculty, Program, University } from "../../data/mock/types";
import {
  buildExploreDerivedItems,
  filterFaculties,
  filterPrograms,
  filterUniversities,
  inferProgramDurationOptionId,
  normalizeForSearch,
  optionIdFromToken,
  sortByFixedOrder,
} from "./filters";
import type { ExploreFilterContext } from "./types";

const emptyFilterContext: ExploreFilterContext = {
  searchQuery: "",
  universityCityFilterIds: new Set(),
  universityTypeFilterIds: new Set(),
  facultyCityFilterIds: new Set(),
  facultyDomainFilterIds: new Set(),
  programLanguageFilterIds: new Set(),
  programLevelFilterIds: new Set(),
  programStudyFormFilterIds: new Set(),
  programDurationFilterIds: new Set(),
};

function createUniversity(partial: Partial<University>): University {
  return {
    id: "u-1",
    name: "Universitatea București",
    city: "București",
    facultyCountLabel: "10 Facultăți",
    facultyCount: 10,
    logoAlt: "",
    logoUrl: "",
    description: "",
    locationLabel: "",
    sourceScreens: [1],
    isFavorite: false,
    ...partial,
  };
}

function createFaculty(partial: Partial<Faculty>): Faculty {
  return {
    id: "f-1",
    name: "Facultatea de Informatică",
    universityName: "Universitatea București",
    domain: "IT",
    programCountLabel: "2 Programe",
    programCount: 2,
    icon: "code",
    description: "",
    locationLabel: "",
    sourceScreens: [3],
    isFavorite: false,
    ...partial,
  };
}

function createProgram(partial: Partial<Program>): Program {
  return {
    id: "p-1",
    name: "Informatică",
    level: "Licență",
    durationLabel: "3 Ani",
    durationYears: 3,
    studyMode: "Cu frecvență",
    universityName: "Universitatea București",
    facultyName: "Facultatea de Informatică",
    language: "Română",
    creditsLabel: "180 ECTS",
    admissionAverage: null,
    descriptionParagraphs: [],
    careerOpportunities: [],
    sourceScreens: [6],
    isFavorite: false,
    ...partial,
  };
}

describe("explore filter utilities", () => {
  it("normalizes diacritics for search", () => {
    expect(normalizeForSearch("Facultăți")).toBe("facultati");
    expect(normalizeForSearch("UniversitÄƒÈ›i")).toBe("universitati");
  });

  it("derives duration option from explicit numeric duration", () => {
    const program = createProgram({ durationYears: 4, durationLabel: "" });
    expect(inferProgramDurationOptionId(program)).toBe(optionIdFromToken("4-ani"));
  });

  it("filters universities by city and type", () => {
    const universities = [
      createUniversity({ id: "u-1", city: "București" }),
      createUniversity({ id: "u-2", city: "Cluj-Napoca" }),
    ];
    const context: ExploreFilterContext = {
      ...emptyFilterContext,
      universityCityFilterIds: new Set([optionIdFromToken("bucuresti")]),
      universityTypeFilterIds: new Set(["option-publica"]),
    };

    const filtered = filterUniversities(universities, context, (id) => (id === "u-1" ? "option-publica" : "option-privata"));
    expect(filtered.map((item) => item.id)).toEqual(["u-1"]);
  });

  it("filters faculties by domain", () => {
    const faculties = [
      createFaculty({ id: "f-1", domain: "IT și calculatoare" }),
      createFaculty({ id: "f-2", name: "Facultatea de Drept", domain: "Drept" }),
    ];
    const context: ExploreFilterContext = {
      ...emptyFilterContext,
      facultyDomainFilterIds: new Set(["option-it-calculatoare"]),
    };

    const filtered = filterFaculties(faculties, context);
    expect(filtered.map((item) => item.id)).toEqual(["f-1"]);
  });

  it("filters faculties by city from location labels", () => {
    const faculties = [
      createFaculty({
        id: "f-1",
        locationLabel: "Oradea, Romania",
        universityName: "Universitatea din Oradea",
      }),
      createFaculty({
        id: "f-2",
        locationLabel: "Galati, Romania",
        universityName: "Universitatea Dunarea de Jos din Galati",
      }),
    ];
    const context: ExploreFilterContext = {
      ...emptyFilterContext,
      facultyCityFilterIds: new Set([optionIdFromToken("oradea")]),
    };

    const filtered = filterFaculties(faculties, context);
    expect(filtered.map((item) => item.id)).toEqual(["f-1"]);
  });

  it("filters programs by language and level", () => {
    const programs = [
      createProgram({ id: "p-1", language: "Română", level: "Licență" }),
      createProgram({ id: "p-2", language: "Engleză", level: "Master" }),
    ];
    const context: ExploreFilterContext = {
      ...emptyFilterContext,
      programLanguageFilterIds: new Set(["option-engleza"]),
      programLevelFilterIds: new Set(["option-master"]),
    };

    const filtered = filterPrograms(programs, context);
    expect(filtered.map((item) => item.id)).toEqual(["p-2"]);
  });

  it("builds derived item catalog for review diagnostics", () => {
    const derived = buildExploreDerivedItems({
      universities: [createUniversity({ id: "u-1" })],
      faculties: [createFaculty({ id: "f-1" })],
      programs: [createProgram({ id: "p-1" })],
    });
    expect(derived).toHaveLength(3);
    expect(derived.map((item) => item.kind)).toEqual(["university", "faculty", "program"]);
  });

  it("keeps unknown items when applying fixed order", () => {
    const sorted = sortByFixedOrder(
      [{ id: "known-2" }, { id: "extra-b" }, { id: "known-1" }, { id: "extra-a" }],
      ["known-1", "known-2"]
    );
    expect(sorted.map((item) => item.id)).toEqual(["known-1", "known-2", "extra-a", "extra-b"]);
  });
});
