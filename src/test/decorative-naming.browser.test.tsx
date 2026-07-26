// `summary={false}` is the documented decorative opt-out, and it must resolve
// to the SAME accessibility surface on both entries of a chart.
//
// Two halves, both of which shipped broken:
//
//   1. On an interactive entry it used to leave `tabIndex={0}` and `role="img"`
//      in place while `aria-label` resolved to `undefined` — a focusable,
//      unnamed image that assistive tech stops on and reads nothing (WCAG
//      4.1.2). Every client entry shipped that except `Delta`, which gated the
//      tab stop by hand; `named()` now does it for all of them.
//   2. With a `title` the two entries told DIFFERENT stories: the static
//      returned `aria-hidden` unconditionally (dropping the author's name on the
//      floor) while the interactive wrapper stayed a named `role="img"`. The
//      rule is now one rule, in `shared/a11y.ts` and `named()` alike —
//      `summary={false}` drops the SENTENCE, and the chart leaves the
//      accessibility tree only when that leaves it with no name at all.
//
// So this file is the matrix: for every combination of `summary={false}` and
// `title`, the static and interactive entries must agree on role, aria-hidden
// and accessible name.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ReactElement } from "react";

import { Sparkline } from "../charts/sparkline/client.js";
import { ActivityGrid } from "../charts/activity-grid/client.js";
import { SegmentedBar } from "../charts/segmented-bar/client.js";
import { BalanceBeam } from "../charts/balance-beam/client.js";
import { DicePips } from "../charts/dice-pips/client.js";
import { FatDigits } from "../charts/fat-digits/client.js";
import { FillWord } from "../charts/fill-word/client.js";
import { MoonPhase } from "../charts/moon-phase/client.js";
import { PictogramRow } from "../charts/pictogram-row/client.js";
import { TallyMarks } from "../charts/tally-marks/client.js";
import { Thermometer } from "../charts/thermometer/client.js";
import { SpreadBand } from "../charts/spread-band/client.js";
import { StationGlyph } from "../charts/station-glyph/client.js";
import { Delta } from "../charts/delta/client.js";
import { TokenConfidence } from "../charts/token-confidence/client.js";

import { Sparkline as StaticSparkline } from "../charts/sparkline/index.js";
import { ActivityGrid as StaticActivityGrid } from "../charts/activity-grid/index.js";
import { SegmentedBar as StaticSegmentedBar } from "../charts/segmented-bar/index.js";
import { BalanceBeam as StaticBalanceBeam } from "../charts/balance-beam/index.js";
import { DicePips as StaticDicePips } from "../charts/dice-pips/index.js";
import { FatDigits as StaticFatDigits } from "../charts/fat-digits/index.js";
import { FillWord as StaticFillWord } from "../charts/fill-word/index.js";
import { MoonPhase as StaticMoonPhase } from "../charts/moon-phase/index.js";
import { PictogramRow as StaticPictogramRow } from "../charts/pictogram-row/index.js";
import { TallyMarks as StaticTallyMarks } from "../charts/tally-marks/index.js";
import { Thermometer as StaticThermometer } from "../charts/thermometer/index.js";
import { SpreadBand as StaticSpreadBand } from "../charts/spread-band/index.js";
import { StationGlyph as StaticStationGlyph } from "../charts/station-glyph/index.js";
import { Delta as StaticDelta } from "../charts/delta/index.js";
import { TokenConfidence as StaticTokenConfidence } from "../charts/token-confidence/index.js";

const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const PARTS = [
  { label: "A", value: 5 },
  { label: "B", value: 3 },
];
const BEAM = [
  { label: "A", value: 8 },
  { label: "B", value: 5 },
] as const;
const PAIRS = WAVE.map((a, i) => ({ a, b: WAVE[(i + 3) % WAVE.length] as number }));
const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
} as const;
const SENT = [
  { token: "The", confidence: 0.98 },
  { token: " capital", confidence: 0.62 },
  { token: " is", confidence: 0.35 },
];

type Props = { summary?: string | false; title?: string };
type Make = (p: Props) => ReactElement;

interface Case {
  live: Make;
  fixed: Make;
  /**
   * `false` for the two charts that render inline HTML rather than `<Chart>`:
   * Delta's decorative form is readable prose with no `role`, not ornament
   * hidden from the tree. Both entries still have to agree on that.
   */
  hides?: boolean;
  /**
   * Where the naming lives in the INTERACTIVE render, when it isn't the wrapper.
   * Delta's wrapper adds only the tab stop; the composed static span is named.
   */
  host?: string;
  /**
   * `false` when the wrapper is not itself the tab stop: Delta focuses only once
   * a callback is passed, TokenConfidence roves across its flagged tokens.
   */
  focusable?: boolean;
}

// The eight glyph charts below shadowed the `summary` PROP with the generated
// sentence (`const summary = fooSummary(…)`), so `summary={false}` named the
// wrapper anyway — the decorative opt-out reached the static child and stopped
// there — and a caller's `summary="…"` string was dropped on the floor. They
// read `props.summary` now; these cases are what keeps that true.
const CASES: Record<string, Case> = {
  sparkline: {
    live: (p) => <Sparkline data={WAVE} {...p} />,
    fixed: (p) => <StaticSparkline data={WAVE} {...p} />,
  },
  "activity-grid": {
    live: (p) => <ActivityGrid data={WAVE} {...p} />,
    fixed: (p) => <StaticActivityGrid data={WAVE} {...p} />,
  },
  "segmented-bar": {
    live: (p) => <SegmentedBar data={PARTS} {...p} />,
    fixed: (p) => <StaticSegmentedBar data={PARTS} {...p} />,
  },
  "balance-beam": {
    live: (p) => <BalanceBeam data={BEAM} {...p} />,
    fixed: (p) => <StaticBalanceBeam data={BEAM} {...p} />,
  },
  "dice-pips": {
    live: (p) => <DicePips value={4} {...p} />,
    fixed: (p) => <StaticDicePips value={4} {...p} />,
  },
  "fat-digits": {
    live: (p) => <FatDigits value={42} {...p} />,
    fixed: (p) => <StaticFatDigits value={42} {...p} />,
  },
  "fill-word": {
    live: (p) => <FillWord value={0.62} word="LOAD" {...p} />,
    fixed: (p) => <StaticFillWord value={0.62} word="LOAD" {...p} />,
  },
  "moon-phase": {
    live: (p) => <MoonPhase value={0.25} {...p} />,
    fixed: (p) => <StaticMoonPhase value={0.25} {...p} />,
  },
  "pictogram-row": {
    live: (p) => <PictogramRow value={5} total={8} {...p} />,
    fixed: (p) => <StaticPictogramRow value={5} total={8} {...p} />,
  },
  "tally-marks": {
    live: (p) => <TallyMarks value={7} {...p} />,
    fixed: (p) => <StaticTallyMarks value={7} {...p} />,
  },
  thermometer: {
    live: (p) => <Thermometer value={21} domain={[0, 40]} {...p} />,
    fixed: (p) => <StaticThermometer value={21} domain={[0, 40]} {...p} />,
  },
  // The two entries that forwarded `title` INTO the static child alongside
  // `summary={false}`: once a titled static is named, that child became a second
  // named image inside the named wrapper.
  "spread-band": {
    live: (p) => <SpreadBand data={PAIRS} {...p} />,
    fixed: (p) => <StaticSpreadBand data={PAIRS} {...p} />,
  },
  "station-glyph": {
    live: (p) => <StationGlyph {...OBS} size={34} {...p} />,
    fixed: (p) => <StaticStationGlyph {...OBS} size={34} {...p} />,
  },
  // Inline HTML, not <Chart> — each hand-rolls the rule, so each can drift.
  delta: {
    live: (p) => <Delta value={0.12} {...p} />,
    fixed: (p) => <StaticDelta value={0.12} {...p} />,
    hides: false,
    host: ".mc-delta",
    focusable: false,
  },
  "token-confidence": {
    live: (p) => <TokenConfidence data={SENT} {...p} />,
    fixed: (p) => <StaticTokenConfidence data={SENT} {...p} />,
    focusable: false,
  },
};

interface Surface {
  role: string | null;
  hidden: string | null;
  name: string | null;
}

/**
 * The chart's accessibility surface: role, aria-hidden and accessible name of
 * the element that carries the naming — the root for every chart drawn through
 * `<Chart>`, and the composed static span for `Delta`, whose interactive
 * wrapper adds only the tab stop.
 */
async function surface(
  ui: ReactElement,
  hostSel?: string,
): Promise<{ surface: Surface; root: HTMLElement }> {
  const screen = await render(ui);
  const root = screen.container.firstElementChild as HTMLElement;
  const host = hostSel
    ? ((root.closest(hostSel) ?? root.querySelector(hostSel)) as HTMLElement)
    : root;
  return {
    surface: {
      role: host.getAttribute("role"),
      hidden: host.getAttribute("aria-hidden"),
      name: host.getAttribute("aria-label"),
    },
    root,
  };
}

describe("summary={false} resolves the same on both entries", () => {
  for (const [name, c] of Object.entries(CASES)) {
    const hides = c.hides !== false;
    // The wrapper is the tab stop everywhere except the two charts that rove
    // inside themselves or focus only once a callback is passed.
    const focusable = c.focusable !== false;

    it(`${name}: decorative (no title) is hidden on both, focusable on neither`, async () => {
      const s = await surface(c.fixed({ summary: false }));
      const l = await surface(c.live({ summary: false }), c.host);
      expect(l.surface).toEqual(s.surface);
      expect(s.surface.name).toBeNull();
      expect(s.surface.role).toBeNull();
      if (hides) expect(s.surface.hidden).toBe("true");
      expect(l.root.hasAttribute("tabindex")).toBe(false);
      // Nothing to read out means nothing to hover-name either.
      expect(s.root.querySelector("title")).toBeNull();
    });

    it(`${name}: a title survives the opt-out and names both`, async () => {
      // `summary={false}` drops the generated SENTENCE. An explicit title is
      // still a name, so neither entry may hide the chart — the static used to,
      // silently discarding the only name the author wrote.
      const s = await surface(c.fixed({ summary: false, title: "Latency" }));
      const l = await surface(c.live({ summary: false, title: "Latency" }), c.host);
      expect(l.surface).toEqual(s.surface);
      expect(s.surface.role).toBe("img");
      expect(s.surface.hidden).toBeNull();
      expect(s.surface.name).toBe("Latency");
      if (focusable) expect(l.root.getAttribute("tabindex")).toBe("0");
    });

    it(`${name}: by default both are named and the interactive one is focusable`, async () => {
      const s = await surface(c.fixed({}));
      const l = await surface(c.live({}), c.host);
      expect(s.surface.role).toBe("img");
      expect(l.surface.role).toBe("img");
      expect(s.surface.hidden).toBeNull();
      expect(l.surface.hidden).toBeNull();
      expect(s.surface.name).toBeTruthy();
      expect(l.surface.name).toBeTruthy();
      if (focusable) expect(l.root.getAttribute("tabindex")).toBe("0");
    });

    it(`${name}: a caller's summary string IS the name, on both`, async () => {
      // The same prop, the other half of the contract: the charts that ignored
      // `summary={false}` also silently dropped a custom sentence, because the
      // wrapper named itself from the generated one either way.
      const s = await surface(c.fixed({ summary: "Queue depth is healthy" }));
      const l = await surface(c.live({ summary: "Queue depth is healthy" }), c.host);
      expect(s.surface.name).toBe("Queue depth is healthy");
      expect(l.surface.name).toBe("Queue depth is healthy");
    });

    it(`${name}: the interactive entry exposes exactly one named image`, async () => {
      // The wrapper names the chart; the composed static child is `summary={false}`
      // with no title of its own. Forwarding `title` into that child (SpreadBand
      // and StationGlyph did) now yields a second named image inside the first.
      for (const p of [{}, { title: "Latency" }, { summary: false as const, title: "Latency" }]) {
        const screen = await render(c.live(p));
        expect(screen.container.querySelectorAll('[role="img"]').length).toBe(1);
      }
    });
  }
});
