import { describe, expect, it } from "vitest";
import { CHART_MODULES, STABLE_CHARTS } from "./registry";
import type { ChartModule, KnobValue } from "./types";

/**
 * Phantom-variable gate: every `data={foo}` in displayed snippets must resolve
 * via the chart's `sampleData`.
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

/** Bare `attr={identifier}` bindings for ANY JSX prop — not just `data`.
 *  Inline literals (`markValue={5}`), member access (`data={s.x}`), and
 *  expressions (`format={(n) => …}`) never match; only a lone identifier does.
 *  Also covers object-shorthand bindings (`data={{ plan, actual }}`) — each
 *  shorthand property is itself a bare identifier reference. */
function attrVars(code: string): string[] {
  const single = [...code.matchAll(/\b[A-Za-z_$][\w$]*=\{([A-Za-z_$][\w$]*)\}/g)].map((m) => m[1]!);
  const shorthand = [...code.matchAll(/\b[A-Za-z_$][\w$]*=\{\{([^{}]*)\}\}/g)].flatMap((m) =>
    m[1]!
      .split(",")
      .map((part) => part.trim())
      .filter((part) => /^[A-Za-z_$][\w$]*$/.test(part)),
  );
  return [...single, ...shorthand].filter(
    (v) => !["true", "false", "null", "undefined"].includes(v),
  );
}

/** `const|let|var <name>` declarations inside a snippet. */
function declaredVars(code: string): string[] {
  return [...code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]!);
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
    // Broader than `dataVars`: a sampleData entry may back any prop, not just
    // `data` (e.g. `markValue`, `domain`, `benchmark`, `field`).
    const referenced = new Set(displayedSnippets(mod).flatMap(attrVars));
    for (const s of chart.sampleData!) {
      expect(referenced, `sampleData "${s.name}" is dead weight`).toContain(s.name);
    }
  });
});

/**
 * Hard gate: `example.code` references sampleData vars — no inline literals.
 */
describe("entry.example.code sample-data contract (hard gate)", () => {
  it.each(STABLE_CHARTS)(
    "$name — every bound identifier in example.code has exactly one sampleData entry",
    (chart) => {
      const mod = CHART_MODULES[chart.slug]!;
      const names = (chart.sampleData ?? []).map((s) => s.name);
      const referenced = attrVars(mod.entry.example.code);
      for (const v of referenced) {
        const count = names.filter((n) => n === v).length;
        expect(
          count,
          `example.code references {${v}} — expected exactly one sampleData entry, found ${count}`,
        ).toBe(1);
      }
    },
  );

  it.each(STABLE_CHARTS)(
    "$name — example.code never redeclares a sampleData name inline",
    (chart) => {
      const mod = CHART_MODULES[chart.slug]!;
      const names = new Set((chart.sampleData ?? []).map((s) => s.name));
      const declared = declaredVars(mod.entry.example.code);
      for (const d of declared) {
        expect(
          names.has(d),
          `example.code declares "const ${d}" but sampleData also defines "${d}" — the literal must live only in sampleData`,
        ).toBe(false);
      }
    },
  );
});
