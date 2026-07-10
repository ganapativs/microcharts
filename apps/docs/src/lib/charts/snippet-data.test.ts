import { describe, expect, it } from "vitest";
import { CHART_MODULES, STABLE_CHARTS } from "./registry";
import type { ChartModule, KnobValue } from "./types";

/**
 * The phantom-variable gate. Every `data={foo}` shown on a doc page must resolve
 * to a `foo` defined in the chart's `sampleData`, so a reader who copies a
 * snippet gets running code — never a `ReferenceError`. Enforced for every chart
 * that has migrated to authored contexts; a second, non-failing check tracks how
 * many charts still need the treatment.
 */

/** Every code string a doc page actually renders for a chart. */
function displayedSnippets(mod: ChartModule): string[] {
  const out = [mod.entry.example.code];
  const p = mod.playground;
  const init = Object.fromEntries(p.knobs.map((k) => [k.key, k.init])) as Record<string, KnobValue>;
  out.push(p.code(init, p.data ?? []));
  for (const r of mod.recipes) out.push(r.code);
  if (mod.contexts) {
    for (const home of Object.values(mod.contexts)) out.push(home.code);
  }
  return out;
}

/** Bare `data={identifier}` bindings — the ones that need a definition. Inline
 *  data (`data={[…]}`), member access (`data={s.x}`), and literals never match. */
function dataVars(code: string): string[] {
  return [...code.matchAll(/\bdata=\{([A-Za-z_$][\w$]*)\}/g)]
    .map((m) => m[1]!)
    .filter((v) => !["true", "false", "null", "undefined"].includes(v));
}

const migrated = STABLE_CHARTS.filter((c) => c.sampleData?.length);

describe("snippet sample-data (no phantom variables)", () => {
  it.each(migrated)("$name — every data={var} is defined in sampleData", (chart) => {
    const mod = CHART_MODULES[chart.slug]!;
    const defined = new Set(chart.sampleData!.map((s) => s.name));
    const referenced = new Set(displayedSnippets(mod).flatMap(dataVars));
    for (const v of referenced) expect(defined, `data={${v}} must be defined`).toContain(v);
  });

  it.each(migrated)("$name — every sampleData def is actually used", (chart) => {
    const mod = CHART_MODULES[chart.slug]!;
    const referenced = new Set(displayedSnippets(mod).flatMap(dataVars));
    for (const s of chart.sampleData!) {
      expect(referenced, `sampleData "${s.name}" is dead weight`).toContain(s.name);
    }
  });

  // Migration tracker — not a failure. Lists charts whose snippets reference a
  // bare data var but haven't authored sampleData yet.
  it("reports charts still needing sample-data", () => {
    const pending = STABLE_CHARTS.filter((c) => !c.sampleData?.length).filter((c) =>
      displayedSnippets(CHART_MODULES[c.slug]!).some((s) => dataVars(s).length),
    );
    // eslint-disable-next-line no-console
    if (pending.length)
      console.info(`sample-data pending: ${pending.map((c) => c.slug).join(", ")}`);
    expect(Array.isArray(pending)).toBe(true);
  });
});
