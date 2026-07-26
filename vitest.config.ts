import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { versionDefine } from "./scripts/pkg-version.mjs";

// Three projects:
//   core    — pure core math + geometry, React-free by architecture. Runs in the
//             `node` environment so it never pays jsdom's per-file DOM construction
//             (~4s wall + ~50s cumulative CPU across the 117 files vs jsdom). Only
//             provably-DOM-free buckets live here (src/core/** + every
//             geometry.test.ts); a pure test left in `dom` is merely slower, but a
//             DOM test misfiled here would throw, so the split stays conservative.
//   dom     — static SVG attribute assertions rendered through RTL — needs jsdom.
//   browser — interactive entries needing real SVG layout (getBBox/getScreenCTM
//             return 0 in jsdom), via Playwright provider + vitest-browser-react
const CORE_GLOBS = ["src/core/**/*.test.ts", "src/charts/*/geometry.test.ts"];
export default defineConfig({
  test: {
    // A path-filtered run (`vitest run --project browser src/charts/ohlc`)
    // matches nothing in the other project; that is not a failure.
    passWithNoTests: true,
    projects: [
      {
        // Mirrors the tsdown build so `__MC_VERSION__` resolves under test too.
        define: versionDefine,
        test: {
          name: "core",
          environment: "node",
          include: CORE_GLOBS,
        },
      },
      {
        define: versionDefine,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.browser.test.{ts,tsx}", ...CORE_GLOBS],
          // unmount rendered trees after each test so a reused worker fork does
          // not accumulate DOM across its files and OOM (see setup.ts)
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        define: versionDefine,
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          // parks the pointer off-chart before each test (see browser-setup.ts)
          setupFiles: ["./src/test/browser-setup.ts"],
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
