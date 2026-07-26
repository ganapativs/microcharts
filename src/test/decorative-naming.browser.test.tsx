// `summary={false}` is the documented decorative opt-out. On a static entry it
// renders `aria-hidden`. On an interactive entry it used to leave `tabIndex={0}`
// and `role="img"` in place while `aria-label` resolved to `undefined` — a
// focusable, unnamed image that assistive tech stops on and reads nothing
// (WCAG 4.1.2). Every client entry shipped that except `Delta`, which gated the
// tab stop by hand; `named()` now does it for all of them.
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

const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const PARTS = [
  { label: "A", value: 5 },
  { label: "B", value: 3 },
];

// The eight below shadowed the `summary` PROP with the generated sentence
// (`const summary = fooSummary(…)`), so `summary={false}` named the wrapper
// anyway — the decorative opt-out reached the static child and stopped there —
// and a caller's `summary="…"` string was dropped on the floor. They read
// `props.summary` now; these cases are what keeps that true.
const CASES: Record<string, (p: { summary?: string | false; title?: string }) => ReactElement> = {
  sparkline: (p) => <Sparkline data={WAVE} {...p} />,
  "activity-grid": (p) => <ActivityGrid data={WAVE} {...p} />,
  "segmented-bar": (p) => <SegmentedBar data={PARTS} {...p} />,
  "balance-beam": (p) => (
    <BalanceBeam
      data={[
        { label: "A", value: 8 },
        { label: "B", value: 5 },
      ]}
      {...p}
    />
  ),
  "dice-pips": (p) => <DicePips value={4} {...p} />,
  "fat-digits": (p) => <FatDigits value={42} {...p} />,
  "fill-word": (p) => <FillWord value={0.62} word="LOAD" {...p} />,
  "moon-phase": (p) => <MoonPhase value={0.25} {...p} />,
  "pictogram-row": (p) => <PictogramRow value={5} total={8} {...p} />,
  "tally-marks": (p) => <TallyMarks value={7} {...p} />,
  thermometer: (p) => <Thermometer value={21} domain={[0, 40]} {...p} />,
};

describe("decorative interactive charts are not nameless tab stops", () => {
  for (const [name, make] of Object.entries(CASES)) {
    it(`${name}: summary={false} with no title is hidden, not focusable`, async () => {
      const screen = await render(make({ summary: false }));
      const wrapper = screen.container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute("aria-hidden")).toBe("true");
      expect(wrapper.hasAttribute("tabindex")).toBe(false);
      expect(wrapper.getAttribute("role")).toBeNull();
    });

    it(`${name}: summary={false} WITH a title stays named and focusable`, async () => {
      // A title is a name, so the chart is not decorative — it keeps its tab stop.
      const screen = await render(make({ summary: false, title: "Latency" }));
      const wrapper = screen.container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute("role")).toBe("img");
      expect(wrapper.getAttribute("tabindex")).toBe("0");
      expect(wrapper.getAttribute("aria-label")).toBe("Latency");
    });

    it(`${name}: by default it is named and focusable`, async () => {
      const screen = await render(make({}));
      const wrapper = screen.container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute("role")).toBe("img");
      expect(wrapper.getAttribute("tabindex")).toBe("0");
      expect(wrapper.getAttribute("aria-label")).toBeTruthy();
    });

    it(`${name}: a caller's summary string IS the name`, async () => {
      // The same prop, the other half of the contract: the charts that ignored
      // `summary={false}` also silently dropped a custom sentence, because the
      // wrapper named itself from the generated one either way.
      const screen = await render(make({ summary: "Queue depth is healthy" }));
      const wrapper = screen.container.firstElementChild as HTMLElement;
      expect(wrapper.getAttribute("aria-label")).toBe("Queue depth is healthy");
    });
  }
});
