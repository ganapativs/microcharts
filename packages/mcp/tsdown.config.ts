import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

// The library version this build snapshots, read from the root package.json at
// build time. `changeset publish` runs this build through `prepublishOnly`,
// AFTER `changeset version` bumped the root — so the stamp is always the version
// that is about to be on npm, and no committed file has to track it.
const { version: libraryVersion } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string };

/**
 * ESM build: cli + core + ai-sdk. Heavy deps external (carry model A); JSON/CSS
 * snapshots bundled. Chart components are runtime dynamic imports, never bundled.
 */
export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts", "src/ai-sdk.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  dts: true,
  clean: true,
  treeshake: true,
  define: {
    __MCP_VERSION__: JSON.stringify(version),
    __LIBRARY_VERSION__: JSON.stringify(libraryVersion),
  },
});
