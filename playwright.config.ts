import { defineConfig, devices } from "@playwright/test";

// Visual-regression runner (separate from Vitest — see plan/09 §1).
// Baselines are generated inside the pinned Playwright Docker image so they
// match CI byte-for-byte; PR review + diffs go through Argos.
//
// Activates in Phase 2 when charts exist. Until then `tests/visual/` is empty
// and this config is inert (the visual workflow is manual-dispatch only).
export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__screenshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["@argos-ci/playwright/reporter"]] : "line",
  use: {
    ...devices["Desktop Chrome"],
    // deterministic captures: no motion, fixed color-scheme per project
    colorScheme: "light",
  },
  expect: {
    toHaveScreenshot: {
      // tolerate sub-pixel AA noise; tighten per-test as needed
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  projects: [
    { name: "light", use: { colorScheme: "light" } },
    { name: "dark", use: { colorScheme: "dark" } },
  ],
});
