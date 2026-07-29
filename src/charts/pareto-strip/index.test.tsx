import { describe, it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ParetoStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);
const vbWidth = (c: Element) =>
  Number(c.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

describe("<ParetoStrip>", () => {
  it("summary states the vital-few count and cumulative — the real string", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} unit="causes" metric="incidents" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Top 4 of 9 causes account for 82% of incidents.",
    );
  });

  it("threshold=false → 'top leads at'", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} threshold={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(
      /^Timeouts leads at \d+%\.$/,
    );
  });

  it("zero total → 'No recorded'", () => {
    const { container } = draw(
      <ParetoStrip data={[{ label: "a", value: 0 }]} metric="incidents" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No recorded incidents.",
    );
  });

  it("descending bars + a cumulative line + threshold hairline", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} width={160} />);
    const bars = container.querySelectorAll("rect");
    expect(bars.length).toBeGreaterThan(2);
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull(); // cum line
    expect(container.querySelectorAll("line").length).toBe(1); // threshold
  });

  it("vital bars (accent) stop at the crossing; the rest are muted", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} threshold={80} width={200} />);
    const bars = [...container.querySelectorAll("rect")];
    const accent = bars.filter((b) => b.getAttribute("data-mc-ink") === "accent");
    // top few are accent, and they are the leftmost (a prefix)
    expect(accent.length).toBeGreaterThan(0);
    expect(accent.length).toBeLessThan(bars.length);
  });

  it("maxItems rolls the tail into Other (rendered, last)", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} maxItems={3} width={160} />);
    // 3 head bars + Other = 4 bars
    expect(container.querySelectorAll("rect").length).toBe(4);
  });

  it("label='count' states 'K of N → cum%'; 'none' hides it", () => {
    const labeled = draw(<ParetoStrip data={CAUSES} width={160} />).container;
    const none = draw(<ParetoStrip data={CAUSES} label="none" width={160} />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("4 of 9 → 82%");
    expect(none.querySelector("text")).toBeNull();
  });

  it("locale spells the percent, and the label gutter widens with the string", () => {
    const en = draw(<ParetoStrip data={CAUSES} width={160} />).container;
    const de = draw(<ParetoStrip data={CAUSES} width={160} locale="de-DE" />).container;
    expect(de.querySelector("text")!.textContent).toBe(`4 of 9 → 82${NBSP}%`);
    expect(de.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `Top 4 of 9 causes account for 82${NBSP}% of the total.`,
    );
    // the gutter is reserved from the FORMATTED string, so the extra character
    // buys viewBox width instead of spilling the caption past it
    expect(vbWidth(de)).toBeGreaterThan(vbWidth(en));
  });

  it("duplicate category labels still draw one bar each", () => {
    // Labels are caller data: two categories can share a name, and a caller
    // category named "Other" sits beside the rolled-up one. Keying bars by
    // label made React drop or duplicate a bar on re-render.
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => errors.push(a[0]));
    const dupes = draw(
      <ParetoStrip
        data={[
          { label: "Timeouts", value: 38 },
          { label: "Timeouts", value: 24 },
          { label: "OOM", value: 15 },
        ]}
        width={160}
      />,
    ).container;
    const collides = draw(
      <ParetoStrip
        data={[
          { label: "Other", value: 38 },
          { label: "A", value: 24 },
          { label: "B", value: 15 },
          { label: "C", value: 9 },
        ]}
        maxItems={2}
        width={160}
      />,
    ).container;
    spy.mockRestore();
    expect(dupes.querySelectorAll("rect").length).toBe(3);
    expect(collides.querySelectorAll("rect").length).toBe(3); // 2 head + Other
    expect(errors.filter((e) => String(e).includes("same key"))).toEqual([]);
  });

  it("color tints the vital few only; the muted rest keeps its ink role", () => {
    // An inline fill survives `forced-color-adjust: none` verbatim, so the
    // muted bars must reach High Contrast through the role, not a pinned var.
    const { container } = draw(<ParetoStrip data={CAUSES} color="#c0392b" width={200} />);
    const bars = [...container.querySelectorAll("rect")];
    const vital = bars.filter((b) => b.getAttribute("data-mc-ink") === "bar");
    const muted = bars.filter((b) => b.getAttribute("data-mc-ink") === "neutral");
    expect(vital.length).toBeGreaterThan(0);
    expect(muted.length).toBeGreaterThan(0);
    expect(vital.length + muted.length).toBe(bars.length);
    for (const b of vital) expect(b.style.fill).not.toBe("");
    for (const b of muted) expect(b.getAttribute("style")).toBeNull();
    // the crossing dot keeps the accent role under a custom color too
    expect(container.querySelector("circle")!.getAttribute("data-mc-ink")).toBe("accent");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ParetoStrip data={CAUSES} title="Incident causes" />);
    await expectNoA11yViolations(container);
  });
});

// Hosts compute these props, so a bad one is ordinary. Each used to paint while
// the accessible name read normally: `threshold={NaN}` emitted `<line y1="NaN">`
// under a summary that had silently dropped the threshold, and `threshold={150}`
// put the hairline 6 units above a 20-unit box — `.mc-root` is
// `overflow: visible`, so that lands on the page rather than clipping.
describe("ParetoStrip hostile config", () => {
  it("a non-finite scalar paints no NaN and announces the scale it drew", () => {
    const bad = [
      () => <ParetoStrip data={CAUSES} threshold={NaN} />,
      () => <ParetoStrip data={CAUSES} threshold={Infinity} />,
      () => <ParetoStrip data={CAUSES} maxItems={NaN} />,
      () => <ParetoStrip data={CAUSES} width={NaN} />,
      () => <ParetoStrip data={CAUSES} height={NaN} />,
    ];
    for (const ui of bad) {
      const { container } = draw(ui());
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
      // every one of these resolves to a documented default, so all five
      // announce the same chart the default props draw
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
        "Top 4 of 9 causes account for 82% of the total.",
      );
    }
  });

  it("an out-of-range threshold clamps to the box edge", () => {
    for (const [threshold, y1] of [
      [150, 2],
      [-50, 18],
    ] as const) {
      const { container } = draw(<ParetoStrip data={CAUSES} threshold={threshold} height={20} />);
      expect(Number(container.querySelector("line")!.getAttribute("y1"))).toBe(y1);
      const dot = container.querySelector("circle");
      if (dot) {
        const cy = Number(dot.getAttribute("cy"));
        const r = Number(dot.getAttribute("r"));
        expect(cy - r).toBeGreaterThanOrEqual(0);
        expect(cy + r).toBeLessThanOrEqual(20);
      }
    }
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("ParetoStrip degradation", () => {
  it("the vital-few readout drops under a 7-unit box, the bars still draw", () => {
    const big = draw(
      <ParetoStrip data={CAUSES} unit="causes" metric="incidents" width={240} height={32} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <ParetoStrip data={CAUSES} unit="causes" metric="incidents" width={48} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("rect").length).toBeGreaterThan(0);
  });
});
