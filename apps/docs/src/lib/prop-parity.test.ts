import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";
import { SHARED_PROP_NAMES, SHARED_INTERACTIVE_NAMES } from "./charts/shared-props";

// Each chart's prop table (hand-authored in lib/charts/<slug>.tsx) must document
// every chart-SPECIFIC prop the component actually accepts — on BOTH the static
// default (index.tsx) and the interactive twin (client.tsx). Without this guard a
// component can grow a public knob that no doc page ever mentions — exactly the
// drift found in the pre-launch audit (unit, curve, variant, bins, steps, …) and,
// later, the interactive-only props (onPointFocus, dateFormat, announceEvery, …)
// that lived entirely outside the static-only guard.
//
// Shared props are documented once — the static grammar in quickstart#the-shared-
// grammar + the PropTable footer (SHARED_PROP_NAMES), and the shared interactive
// props animate/live (SHARED_INTERACTIVE_NAMES). Per-chart tables omit both.
const SHARED = SHARED_PROP_NAMES;
const SHARED_INTERACTIVE = new Set([...SHARED_PROP_NAMES, ...SHARED_INTERACTIVE_NAMES]);

// Escape hatch for props that are public but intentionally undocumented. Keep it
// empty; add "<slug>:<prop>" entries only with a written reason.
const INTENTIONAL = new Set<string>([]);

const chartsDir = resolve(process.cwd(), "../../src/charts");

/**
 * Top-level member names of the FIRST `*Props` interface in a chart entry file.
 * When the interface `extends` a base (e.g. the client extends the static props),
 * only the members declared in this interface's own `{ … }` body are returned —
 * inherited props are covered by the base file's own check.
 */
function interfaceProps(file: string): string[] {
  if (!existsSync(file)) return [];
  const src = readFileSync(file, "utf8");
  const body = src.match(/(?:export )?interface \w*Props\b[^{]*\{([\s\S]*?)\n\}/);
  if (!body) return [];
  return [...body[1]!.matchAll(/^\s*(?:readonly\s+)?([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1]!);
}

describe("chart prop tables cover the component's public props", () => {
  for (const chart of STABLE_CHARTS) {
    // Some rows document a pair under one name, e.g. "xLabel / yLabel" — split
    // on "/" so each covered prop counts.
    const documented = new Set(chart.props.flatMap((p) => p.name.split("/").map((s) => s.trim())));

    it(`${chart.slug} (static)`, () => {
      const missing = interfaceProps(resolve(chartsDir, chart.slug, "index.tsx")).filter(
        (p) => !SHARED.has(p) && !documented.has(p) && !INTENTIONAL.has(`${chart.slug}:${p}`),
      );
      expect(missing, `${chart.slug} accepts undocumented props: ${missing.join(", ")}`).toEqual(
        [],
      );
    });

    if (chart.interactiveImport) {
      it(`${chart.slug} (interactive)`, () => {
        // client.tsx extends the static props, so its interface body holds only
        // the interactive-only additions — each must be documented or shared.
        const missing = interfaceProps(resolve(chartsDir, chart.slug, "client.tsx")).filter(
          (p) =>
            !SHARED_INTERACTIVE.has(p) &&
            !documented.has(p) &&
            !INTENTIONAL.has(`${chart.slug}:${p}`),
        );
        expect(
          missing,
          `${chart.slug} interactive entry accepts undocumented props: ${missing.join(", ")}`,
        ).toEqual([]);
      });
    }
  }
});

// A prop flagged `interactive: true` in the registry must genuinely live on the
// client entry only — accepted by client.tsx, absent from the static index.tsx —
// or the "interactive" badge in the docs (and catalog.json) is a lie.
describe("interactive-flagged props are interactive-only", () => {
  for (const chart of STABLE_CHARTS) {
    const flagged = chart.props.filter((p) => p.interactive).map((p) => p.name);
    if (!flagged.length) continue;
    it(`${chart.slug}`, () => {
      const staticProps = new Set(interfaceProps(resolve(chartsDir, chart.slug, "index.tsx")));
      const clientProps = new Set(interfaceProps(resolve(chartsDir, chart.slug, "client.tsx")));
      const onStatic = flagged.filter((p) => staticProps.has(p));
      const notOnClient = flagged.filter((p) => !clientProps.has(p));
      expect(onStatic, `${chart.slug}: flagged interactive but on static: ${onStatic}`).toEqual([]);
      expect(
        notOnClient,
        `${chart.slug}: flagged interactive but not on client: ${notOnClient}`,
      ).toEqual([]);
    });
  }
});
