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

const WAVE = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const PARTS = [
  { label: "A", value: 5 },
  { label: "B", value: 3 },
];

const CASES: Record<string, (p: { summary?: false; title?: string }) => ReactElement> = {
  sparkline: (p) => <Sparkline data={WAVE} {...p} />,
  "activity-grid": (p) => <ActivityGrid data={WAVE} {...p} />,
  "segmented-bar": (p) => <SegmentedBar data={PARTS} {...p} />,
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
  }
});
