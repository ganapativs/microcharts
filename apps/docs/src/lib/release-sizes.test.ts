import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CEILINGS, CEILING_CLAIM, CURRENT_VERSION, RELEASE_SIZES } from "./release-sizes";
import { SIZE } from "./docs-facts";

/**
 * Release size history: newest point must be live data, version label must match
 * the workspace package, and the hero's "&lt; 7 kB" claim must stay above every
 * measured max.
 */
describe("release size history", () => {
  it("labels the current release as the version the workspace is on", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "../../package.json"), "utf8")) as {
      version: string;
    };
    expect(CURRENT_VERSION).toBe(pkg.version);
  });

  it("takes the newest point from live measured data, not a frozen copy", () => {
    const last = RELEASE_SIZES.at(-1)!;
    expect(last.version).toBe(CURRENT_VERSION);
    expect(last.max).toBe(SIZE.interactiveMax);
    expect(last.median).toBe(SIZE.interactiveMedian);
  });

  it("is one release per entry, in ascending order, with no gaps in the tail", () => {
    const versions = RELEASE_SIZES.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    const nums = versions.map((v) => v.split(".").map(Number));
    for (let i = 1; i < nums.length; i++) {
      const [, aMinor] = nums[i - 1]!;
      const [, bMinor] = nums[i]!;
      expect(bMinor!).toBeGreaterThan(aMinor!);
    }
  });

  it("keeps every ceiling under the kilobyte figure the hero sentence claims", () => {
    expect(CEILINGS.length).toBe(RELEASE_SIZES.length);
    for (const max of CEILINGS) expect(max).toBeLessThan(CEILING_CLAIM);
    // …and the claim is the tightest whole number that holds, so the sentence
    // never rounds up to a number nobody would have to argue with.
    expect(CEILING_CLAIM - 1).toBeLessThan(Math.max(...CEILINGS));
  });

  it("records the median rising, which is the trajectory the copy states", () => {
    const medians = RELEASE_SIZES.map((r) => r.median);
    expect(medians.at(-1)!).toBeGreaterThan(medians[0]!);
  });
});
