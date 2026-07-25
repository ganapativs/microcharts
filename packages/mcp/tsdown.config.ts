import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

/**
 * Two entries: `cli.ts` (the stdio server `bin`) and `index.ts` (the importable
 * core + the Vercel AI-SDK tools). ESM only, Node platform.
 *
 * Everything heavy is EXTERNAL — `@microcharts/react` (the charts + summaries),
 * `react`/`react-dom` (rendering), the MCP SDK, and `ai`/`zod` — so the shipped
 * package stays tiny and resolves those from the consumer's install. Carry
 * model A: the library is a normal dependency, downloaded at install, never
 * bundled here. The JSON/CSS/text snapshots ARE bundled (they're the data).
 */
export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts", "src/ai-sdk.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  dts: true,
  clean: true,
  treeshake: true,
  define: { __MCP_VERSION__: JSON.stringify(version) },
  // All runtime deps (`@microcharts/react`, react, react-dom, the MCP SDK, ai,
  // zod) are in `dependencies`, so tsdown externalizes them automatically — only
  // the JSON/CSS/text snapshots get bundled. The chart component itself is a
  // runtime dynamic import, never bundled.
});
