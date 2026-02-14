import { resolveOrderedTabDirection, resolveOrderedTabTransitionMeta } from "./horizontal-tab-swipe";

describe("horizontal-tab-swipe utilities", () => {
  const ordered = ["universities", "faculties", "programs"] as const;

  it("resolves ordered tab direction", () => {
    expect(resolveOrderedTabDirection(ordered, "universities", "programs")).toBe(1);
    expect(resolveOrderedTabDirection(ordered, "programs", "faculties")).toBe(-1);
  });

  it("builds swipe transition metadata", () => {
    const meta = resolveOrderedTabTransitionMeta(ordered, "faculties", "programs", "swipe", {
      translationX: -120,
      velocityX: -900,
    });

    expect(meta).toEqual({
      source: "swipe",
      fromKey: "faculties",
      toKey: "programs",
      fromIndex: 1,
      toIndex: 2,
      direction: 1,
      translationX: -120,
      velocityX: -900,
    });
  });

  it("returns null when transition is invalid", () => {
    const meta = resolveOrderedTabTransitionMeta(ordered, "faculties", "faculties", "tap");
    expect(meta).toBeNull();
  });
});
