import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Constellation, constellationSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const monthFmt = (x: number) => MONTHS[x] ?? String(x);

const EVENTS = [
  { x: 0, y: 40, m: 2 },
  { x: 2, y: 90, m: 7 },
  { x: 5, y: 30, m: 3 },
] as const;

describe("<Constellation>", () => {
  it("summary names the count, span, and largest event", () => {
    const { container } = draw(<Constellation data={EVENTS} xFormat={monthFmt} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 events between Jan and Jun; largest at Mar.",
    );
  });

  it("single event → the one-event phrasing", () => {
    expect(constellationSummary([{ x: 2, y: 5 }], { xFormat: monthFmt })).toBe("1 event at Mar.");
  });

  it("renders a connector path + one circle per event (+ the brightest-star halo)", () => {
    const { container } = draw(<Constellation data={EVENTS} />);
    expect(container.querySelectorAll("circle").length).toBe(4); // 3 events + 1 halo
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  it("connect={false} drops the connector", () => {
    const { container } = draw(<Constellation data={EVENTS} connect={false} />);
    expect(container.querySelector("path")).toBeNull();
  });

  it('label="max" places a numeral at the largest event', () => {
    const { container } = draw(<Constellation data={EVENTS} label="max" />);
    const t = container.querySelector("text");
    expect(t).not.toBeNull();
    expect(t!.textContent).toBe("7"); // magnitude of the Mar event
  });

  it("empty data → 'No data.'", () => {
    const { container } = draw(<Constellation data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Constellation data={EVENTS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <Constellation data={EVENTS} xFormat={monthFmt} title="Incidents" />,
    );
    await expectNoA11yViolations(container);
  });
});

describe("<Constellation> degrades at small sizes", () => {
  const EV = [
    { x: 0, y: 40, m: 2 },
    { x: 2, y: 90, m: 7 },
    { x: 5, y: 30, m: 3 },
  ];

  // The magnitude numeral prefers to sit above the brightest star and falls
  // back to below it. The fallback is pinned inside the frame, then checked:
  // if the pinned line can't clear the star's halo, the numeral drops.
  it("keeps the numeral while a placement clears both the frame and the halo", () => {
    const { container } = draw(<Constellation data={EV} label="max" width={63} height={17} />);
    expect(container.querySelector("text")!.textContent).toBe("7");
  });

  it("never paints the numeral outside the viewBox", () => {
    for (const [w, h] of [
      [90, 24],
      [63, 17],
      [60, 20],
      [45, 12],
    ] as const) {
      const { container } = draw(<Constellation data={EV} label="max" width={w} height={h} />);
      const t = container.querySelector("text");
      if (!t) continue;
      const fs = Number(t.getAttribute("font-size"));
      const y = Number(t.getAttribute("y"));
      const half = (t.textContent!.length * fs * 0.62) / 2;
      const x = Number(t.getAttribute("x"));
      expect(y - fs * 0.78).toBeGreaterThanOrEqual(0);
      expect(y + fs * 0.22).toBeLessThanOrEqual(h);
      expect(x - half).toBeGreaterThanOrEqual(0);
      expect(x + half).toBeLessThanOrEqual(w);
    }
  });

  it("drops the numeral when nothing clears — the stars and halo still render", () => {
    const { container } = draw(<Constellation data={EV} label="max" width={38} height={10} />);
    expect(container.querySelector("text")).toBeNull();
    // 3 events + the brightest-star halo
    expect(container.querySelectorAll("circle").length).toBe(4);
  });
});
