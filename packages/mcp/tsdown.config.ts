import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

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
  define: { __MCP_VERSION__: JSON.stringify(version) },
});
