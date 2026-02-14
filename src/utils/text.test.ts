import { __normalizedTextForTests, normalizeRomanianText, normalizeTextForSearch } from "./text";

describe("normalizeRomanianText", () => {
  beforeEach(() => {
    __normalizedTextForTests.resetCache();
  });

  it("keeps clean strings unchanged", () => {
    expect(normalizeRomanianText("Facultati si programe")).toBe("Facultati si programe");
  });

  it("normalizes mojibake strings", () => {
    expect(normalizeRomanianText("UniversitÄƒÈ›i")).toBe("Universități");
  });

  it("caches repeated values", () => {
    expect(__normalizedTextForTests.getCacheSize()).toBe(0);

    normalizeRomanianText("Test simplu");
    expect(__normalizedTextForTests.getCacheSize()).toBe(1);

    normalizeRomanianText("Test simplu");
    expect(__normalizedTextForTests.getCacheSize()).toBe(1);
  });

  it("keeps cache bounded", () => {
    const maxSize = __normalizedTextForTests.getCacheMaxSize();
    for (let index = 0; index < maxSize + 20; index += 1) {
      normalizeRomanianText(`entry-${index.toString()}`);
    }

    expect(__normalizedTextForTests.getCacheSize()).toBeLessThanOrEqual(maxSize);
  });
});

describe("normalizeTextForSearch", () => {
  beforeEach(() => {
    __normalizedTextForTests.resetCache();
  });

  it("folds accents and casing for search", () => {
    expect(normalizeTextForSearch("Facultăți ȘI Programe")).toBe("facultati si programe");
  });

  it("normalizes mojibake before search folding", () => {
    const mojibakeValue = "UniversitÃ„Æ’Ãˆâ€ºi";
    const expectedSearchValue = normalizeRomanianText(mojibakeValue)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("ro-RO")
      .trim();

    expect(normalizeTextForSearch(mojibakeValue)).toBe(expectedSearchValue);
  });

  it("caches repeated values", () => {
    expect(__normalizedTextForTests.getSearchCacheSize()).toBe(0);

    normalizeTextForSearch("Test simplu");
    expect(__normalizedTextForTests.getSearchCacheSize()).toBe(1);

    normalizeTextForSearch("Test simplu");
    expect(__normalizedTextForTests.getSearchCacheSize()).toBe(1);
  });

  it("keeps search cache bounded", () => {
    const maxSize = __normalizedTextForTests.getSearchCacheMaxSize();
    for (let index = 0; index < maxSize + 20; index += 1) {
      normalizeTextForSearch(`search-entry-${index.toString()}`);
    }

    expect(__normalizedTextForTests.getSearchCacheSize()).toBeLessThanOrEqual(maxSize);
  });
});
