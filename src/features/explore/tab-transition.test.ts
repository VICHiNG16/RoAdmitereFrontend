import { exploreSwipeConfig } from "./constants";
import { computeSwipeShouldCommit } from "./tab-transition";

describe("computeSwipeShouldCommit", () => {
  it("commits when drag progress crosses the threshold", () => {
    expect(computeSwipeShouldCommit(exploreSwipeConfig.commitProgressThreshold, 0, 1)).toBe(true);
    expect(computeSwipeShouldCommit(exploreSwipeConfig.commitProgressThreshold, 0, -1)).toBe(true);
  });

  it("commits for a fling toward the target on the right", () => {
    expect(computeSwipeShouldCommit(0, -exploreSwipeConfig.commitVelocityThreshold, 1)).toBe(true);
  });

  it("commits for a fling toward the target on the left", () => {
    expect(computeSwipeShouldCommit(0, exploreSwipeConfig.commitVelocityThreshold, -1)).toBe(true);
  });

  it("does not commit for a fling in the opposite direction", () => {
    expect(computeSwipeShouldCommit(0, exploreSwipeConfig.commitVelocityThreshold, 1)).toBe(false);
    expect(computeSwipeShouldCommit(0, -exploreSwipeConfig.commitVelocityThreshold, -1)).toBe(false);
  });
});
