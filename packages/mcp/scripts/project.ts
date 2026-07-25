/**
 * The registry → catalog projection, in one place so `gen.ts` writes it and
 * `catalog-sync.test.ts` re-derives it. The guard is then exactly "re-run the
 * projection and compare", with no chance of the two definitions of "in sync"
 * drifting apart.
 *
 * Three deliberate differences from the docs registry:
 *
 *  - **`demo` is dropped.** It is the gallery's preview series and is always
 *    `number[]` — *wrong data* for the 20 charts that take `{ label, value }[]`
 *    and friends. Shipping it invited a model to render a crash.
 *  - **`sample` is added:** the chart's own example evaluated into a JSON prop
 *    bag, which is what `render_microchart` actually takes. `render.test.ts`
 *    asserts every one of them renders.
 *  - **`example.code` is pre-resolved and `sampleData` dropped.** Resolution is
 *    deterministic, so doing it at generation time means the package ships one
 *    copy of the snippet instead of two and carries no resolver at runtime.
 */
import type { ChartEntry, ChartProp } from "../src/types";
import { extractSample } from "./sample-props";

/**
 * The registry entry as it exists in the docs app, before projection: it still
 * carries the two fields the package doesn't ship.
 */
export type RegistryEntry = ChartEntry & {
  demo?: number[];
  sampleData?: { name: string; code: string }[];
};

export interface Catalog {
  library: string;
  sharedProps: ChartProp[];
  charts: ChartEntry[];
}

export interface ProjectionReport {
  /** `slug: propA, propB` for example props that weren't JSON (formatters). */
  skippedProps: string[];
  /** `slug (reason)` for charts no sample could be derived for. */
  noSample: string[];
}

/**
 * Prepend the sample-data definitions a snippet references but doesn't define.
 * Mirrors the docs' `resolveRunnable` (apps/docs/src/lib/charts/runnable.ts) so
 * "runnable" means the same thing here as on the site.
 */
function resolveRunnable(code: string, sampleData: RegistryEntry["sampleData"]): string {
  const defs = (sampleData ?? [])
    .filter(
      (s) =>
        new RegExp(`\\b${s.name}\\b`).test(code) &&
        !new RegExp(`\\b(?:const|let|var)\\s+${s.name}\\b`).test(code),
    )
    .map((s) => s.code)
    .join("\n\n");
  return defs ? `${defs}\n\n${code}` : code;
}

function projectEntry(raw: RegistryEntry, report?: ProjectionReport): ChartEntry {
  const { demo: _demo, sampleData, ...entry } = raw;
  const { sample, skipped, reason } = extractSample(entry.example.code, sampleData);
  if (report) {
    if (skipped.length > 0) report.skippedProps.push(`${entry.slug}: ${skipped.join(", ")}`);
    if (!sample) report.noSample.push(`${entry.slug} (${reason ?? "unknown"})`);
  }
  const projected: ChartEntry = {
    ...entry,
    example: {
      title: entry.example.title,
      code: resolveRunnable(entry.example.code, sampleData),
    },
  };
  if (sample) projected.sample = sample;
  return projected;
}

export function projectCatalog(
  registry: RegistryEntry[],
  sharedProps: ChartProp[],
  library: string,
  report?: ProjectionReport,
): Catalog {
  return { library, sharedProps, charts: registry.map((e) => projectEntry(e, report)) };
}
