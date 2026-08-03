import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import committed from "../src/catalog.generated.json";
import { catalog, LIBRARY_VERSION } from "../src/catalog";
import { AGENT_SETUP, STYLES } from "../src/assets.generated";
import { SHARED_PROPS } from "../../../apps/docs/src/lib/charts/shared-props";
import { extractAgentSetupPrompt } from "../../../apps/docs/src/lib/agent-setup";
import { projectCatalog, type RegistryEntry } from "../scripts/project";

/**
 * Drift guard. The committed snapshots (`catalog.generated.json`,
 * `assets.generated.ts`) are produced by `scripts/gen.ts` from the docs
 * registry + the built library. This re-reads those live sources and asserts the
 * snapshots still match — so a chart added to the registry, or a stylesheet
 * change, that wasn't followed by `pnpm gen` fails here, not silently in a
 * shipped-stale MCP catalog.
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const docs = resolve(root, "apps/docs");
const read = (p: string): string => readFileSync(p, "utf8");

describe("catalog snapshot is in sync with the source of truth", () => {
  it("is exactly the projection of the live registry (run `pnpm gen` if this fails)", () => {
    // The shipped catalog is a *projection* of the docs registry, not a copy —
    // `scripts/project.ts` documents the three differences. Re-running that one
    // function is the whole guard, so "in sync" can only ever mean one thing.
    const liveEntries = JSON.parse(
      read(resolve(docs, "src/lib/charts/entries.generated.json")),
    ) as RegistryEntry[];
    expect(committed).toEqual(projectCatalog(liveEntries, SHARED_PROPS));
  });

  it("holds no version stamp — the library version is a build-time define", () => {
    // A committed stamp is what forced a second, post-release PR: `changeset
    // version` bumps the root one commit after every PR that re-gens this file,
    // so the snapshot went stale on main the moment a release landed and
    // `gen:check` went red. The stamp now comes from `version.ts` at build time.
    expect(committed).not.toHaveProperty("library");
  });

  it("stamps the library version the repo is currently at", () => {
    const { version } = JSON.parse(read(resolve(root, "package.json"))) as { version: string };
    expect(LIBRARY_VERSION).toBe(version);
    // The served catalog still carries it, so consumers see no shape change.
    expect(catalog.library).toBe(version);
  });

  it("embedded stylesheet matches the built styles.css", () => {
    // Requires `pnpm build` at the repo root (produces dist/styles.css).
    expect(STYLES).toBe(read(resolve(root, "dist/styles.css")));
  });

  it("agent-setup prompt matches quickstart.mdx", () => {
    const live = extractAgentSetupPrompt(read(resolve(docs, "content/docs/quickstart.mdx")));
    expect(AGENT_SETUP).toBe(live.trim() + "\n");
  });
});
