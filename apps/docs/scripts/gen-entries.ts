/**
 * Emit a pure-data snapshot of every chart `entry` (no React components) to
 * `src/lib/charts/entries.generated.json`. The per-chart registry modules co-
 * locate metadata with heavy React previews / interactive entries, and Turbopack
 * won't tree-shake a `import { entry }` down to just the data — so any client
 * (or server) module that reads catalog metadata otherwise drags the whole
 * 106-chart component graph into the bundle. This snapshot breaks that edge:
 * `entries.ts` reads this JSON, so catalog consumers pull data only.
 *
 * Runs in prebuild; a Vitest guard (`entries-generated.test.ts`) fails if the
 * checked-in JSON drifts from the live registry, so it can never go stale.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CHARTS } from "../src/lib/charts/registry";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "lib", "charts", "entries.generated.json");

writeFileSync(out, `${JSON.stringify(CHARTS, null, 2)}\n`);
console.log(`gen-entries: wrote ${CHARTS.length} chart entries to ${out}`);
