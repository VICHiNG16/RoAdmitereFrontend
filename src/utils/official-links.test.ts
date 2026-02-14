import { resolveOfficialSiteUrl } from "./official-links";

describe("resolveOfficialSiteUrl", () => {
  it("uses known entity mappings when available", () => {
    expect(resolveOfficialSiteUrl("university-universitatea-din-bucuresti")).toBe("https://unibuc.ro/");
  });

  it("falls back to provided URL for unknown entities", () => {
    expect(resolveOfficialSiteUrl("program-real-unknown", "https://example.com/program")).toBe(
      "https://example.com/program"
    );
  });
});
