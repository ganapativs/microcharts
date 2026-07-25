import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

/**
 * Standalone config so `vitest` run in this package doesn't inherit the root's
 * project matrix (core/dom/browser scoped to the library's `src/`). These are
 * plain Node tests — the tools are pure, and render uses `react-dom/server`.
 */
export default defineConfig({
  define: { __MCP_VERSION__: JSON.stringify(version) },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
