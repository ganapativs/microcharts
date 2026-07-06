import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

// Two projects (see plan/09 §1, plan/18):
//   node    — pure core math + static SVG attribute assertions (fast, no browser)
//   browser — interactive entries needing real SVG layout (getBBox/getScreenCTM
//             return 0 in jsdom), via Playwright provider + vitest-browser-react
export default defineConfig({
  test: {
    // Scaffold has no tests yet; green pipeline until Phase 1/2 land suites.
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "node",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.browser.test.{ts,tsx}"],
        },
      },
      {
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
