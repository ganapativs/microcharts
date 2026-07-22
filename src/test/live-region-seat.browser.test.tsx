// The inline seat survives a DECORATIVE interactive chart.
//
// `LiveRegion` hosts the seat hoist (shared/seat-hoist.ts), so a client entry
// that UNMOUNTS it to silence a `summary={false}` / `live={false}` chart also
// drops the seat: inside `.mc-inline` the wrapper keeps its unseated layout box
// while the SVG translates, and the readout chip plus the hit box detach from
// the mark by a full seat. The contract is to keep the element mounted and mute
// its children instead. This suite pins both halves — silence AND seat — in a
// real browser, because the hoist is a layout effect reading real styles.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

// Load-bearing: the seat only exists once `.mc-inline`'s rules are live.
import "../../styles.css";

import { Thermometer } from "../charts/thermometer/client.js";
import { Progress } from "../charts/progress/client.js";
import { StatusDot } from "../charts/status-dot/client.js";
import { Sparkline } from "../charts/sparkline/client.js";

const CASES = [
  { name: "Thermometer", node: <Thermometer value={62} summary={false} /> },
  { name: "Progress", node: <Progress value={0.4} summary={false} /> },
  { name: "StatusDot", node: <StatusDot status="ok" summary={false} /> },
  { name: "Sparkline", node: <Sparkline data={[3, 6, 2, 8, 5]} summary={false} /> },
];

describe("decorative interactive charts keep their inline seat", () => {
  for (const c of CASES) {
    it(`${c.name}: seat is hoisted onto the wrapper even with summary={false}`, async () => {
      const screen = await render(<span className="mc-inline">{c.node}</span>);
      const host = screen.container.querySelector("[data-mc-host]") as HTMLElement;
      expect(host, "renders an interactive wrapper").not.toBeNull();
      const svg = host.querySelector("svg") as SVGSVGElement | null;
      // Only charts that emit a seat can hoist one; every chart here does.
      expect(svg?.style.getPropertyValue("--mc-seat"), `${c.name} emits a seat`).toBeTruthy();
      await expect.poll(() => host.dataset.mcSeated, { timeout: 1000 }).toBe("");
      expect(host.style.getPropertyValue("--mc-seat")).toBe(
        svg!.style.getPropertyValue("--mc-seat"),
      );
    });

    it(`${c.name}: decorative means silent — the live region carries no text`, async () => {
      const screen = await render(c.node);
      const region = screen.container.querySelector('[aria-live="polite"]');
      expect(region, "the live region stays mounted (it hosts the seat)").not.toBeNull();
      expect(region!.textContent).toBe("");
    });
  }
});
