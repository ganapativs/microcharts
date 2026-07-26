import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";
import {
  SHARED_PROP_NAMES,
  SHARED_INTERACTIVE_NAMES,
  SHARED_INTERACTIVE_PROPS,
  SHARED_PROPS,
} from "./charts/shared-props";

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

// Everything a per-chart table is excused from must be documented SOMEWHERE —
// the shared grammar / layout / i18n lists render into quickstart, the PropTable
// footer and catalog.json's `sharedProps`. The only legitimate extras are the
// structural React props, which are not part of the chart API at all.
//
// `size`, `fontSize`, `gap` and `cell` used to sit here undocumented: excused
// from every per-chart table AND absent from every shared list, so 31 charts had
// public knobs that appeared nowhere. Re-adding an undocumented name here is
// that same hole, so this test closes it.
describe("the shared-prop escape hatch documents what it excuses", () => {
  it("excuses only documented shared props plus the structural React props", () => {
    const documented = new Set(SHARED_PROPS.map((p) => p.name));
    const structural = new Set(["children", "ref", "key"]);
    const undocumented = [...SHARED_PROP_NAMES].filter(
      (n) => !documented.has(n) && !structural.has(n),
    );
    expect(
      undocumented,
      `SHARED_PROP_NAMES hides props no shared list documents: ${undocumented.join(", ")}`,
    ).toEqual([]);
  });
});

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

// The picker contract. `interfaceProps()` above reads only an interface's OWN
// body, so props inherited via `extends PickerProps` are invisible to it — the
// four picker props could vanish from the library, or appear on a chart that
// has no units to rove between, and nothing above would notice. These guards
// tie `entry.picker` (the registry's machine-readable split) to the library.
const PICKER_PROPS = ["onActive", "onSelect", "selectedIndex", "defaultSelectedIndex"] as const;
/**
 * The picker props that only make sense with more than one navigable unit.
 *
 * `onActive` used to be in here, and that was a category error: it reports that
 * the HOVERED / FOCUSED unit changed, which a chart with exactly one unit does
 * every time a pointer enters and leaves it. What is genuinely roving-only is an
 * INDEX into a unit list — there is nothing for `selectedIndex` to point at when
 * there is one unit and no cursor to move.
 *
 * The distinction is load-bearing for the readout contract: `readout={false}`
 * plus `datum.formatted` on `onActive` is how a consumer lifts the value out of
 * the chart into their own KPI card, and that pattern is exactly as useful on a
 * Progress or a Thermometer as on a Sparkline. Excluding the scalars made it work
 * on 84 charts and not on 19, for no reason a reader of the API could see.
 */
const ROVING_PROPS: ReadonlySet<string> = new Set(["selectedIndex", "defaultSelectedIndex"]);

/** Registry's claim: a multi-unit chart with the shared picker contract. */
const isPickerChart = (c: (typeof STABLE_CHARTS)[number]) =>
  Boolean(c.interactiveImport) && c.picker !== false;

describe("picker contract", () => {
  it("the four picker props are shared grammar, flagged interactive", () => {
    for (const n of PICKER_PROPS) {
      const p = SHARED_INTERACTIVE_PROPS.find((x) => x.name === n);
      expect(p, `SHARED_INTERACTIVE_PROPS missing picker prop ${n}`).toBeDefined();
      expect(p?.interactive, `${n} must be flagged interactive`).toBe(true);
      expect(p?.description.length, `${n} needs a description`).toBeGreaterThan(0);
    }
  });

  for (const chart of STABLE_CHARTS) {
    if (!chart.interactiveImport) continue;
    it(`${chart.slug}`, () => {
      const client = resolve(chartsDir, chart.slug, "client.tsx");
      const src = existsSync(client) ? readFileSync(client, "utf8") : "";
      // The contract is inherited via `extends … PickerProps`, never re-declared.
      const extendsPicker = /interface \w*Props\b[^{]*\bPickerProps\b/.test(src);
      expect(
        extendsPicker,
        extendsPicker
          ? `${chart.slug} extends PickerProps but the registry marks it picker: false`
          : `${chart.slug} is a picker chart in the registry but its client entry does not extend PickerProps`,
      ).toBe(isPickerChart(chart));

      // Picker props are documented ONCE in the shared grammar — a per-chart row
      // would drift from it, and on a lean chart it would be a lie.
      const redocumented = chart.props
        .map((p) => p.name)
        .filter((n) => (PICKER_PROPS as readonly string[]).includes(n));
      expect(
        redocumented,
        `${chart.slug} re-documents shared picker props: ${redocumented.join(", ")}`,
      ).toEqual([]);

      // A `picker: false` chart may still declare a whole-chart `onSelect` —
      // the lean scalar charts do, and it means the same thing (the one unit was
      // activated). What it must NOT have is the roving half of the contract:
      // there is nothing to move an active cursor between.
      if (!isPickerChart(chart)) {
        const roving = interfaceProps(client).filter((p) => ROVING_PROPS.has(p));
        expect(
          roving,
          `${chart.slug} is marked picker: false but declares roving props: ${roving.join(", ")}`,
        ).toEqual([]);
      }
    });
  }
});
