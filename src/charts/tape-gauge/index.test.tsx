import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TapeGauge, tapeGaugeSummary } from "./index.js";
import { EN_TAPE_GAUGE } from "../../core/strings-tape-gauge.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const ZONES = [
  { from: 100, to: 130, tone: "pos" as const },
  { from: 130, to: 150, tone: "warn" as const },
  { from: 150, to: 200, tone: "neg" as const },
];

describe("<TapeGauge>", () => {
  it("renders zones + ticks + pointer readout summary", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} height={64} />,
    );
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(3);
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(true);
    expect(tapeGaugeSummary(142, 1, [25 / 60, 25 / 15], ZONES[1]!, EN_TAPE_GAUGE, fmt)).toBe(
      "Now 142, rising; in the 130–150 zone.",
    );
  });

  it("rate is a separate channel — a rising chevron is drawn", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={2} zones={ZONES} span={25} height={64} />,
    );
    // chevron path uses the accent ink role (element-split: strokes on path)
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("the center pointer is a solid filled triangle (not a hollow outline)", () => {
    const { container } = draw(<TapeGauge value={142} zones={ZONES} span={25} height={64} />);
    // the closed pointer triangle (ends in z) carries an inline accent fill
    const pointer = [
      ...container.querySelectorAll<SVGPathElement>('path[data-mc-ink="accent"]'),
    ].find((p) => (p.getAttribute("d") ?? "").trim().endsWith("z"));
    expect(pointer).toBeTruthy();
    expect(pointer!.style.fill).toBe("var(--mc-accent)");
  });

  it("no rate → no rate clause", () => {
    expect(tapeGaugeSummary(142, undefined, [1, 2], ZONES[1]!, EN_TAPE_GAUGE, fmt)).toBe(
      "Now 142; in the 130–150 zone.",
    );
  });

  it("label='none' hides the readout number", () => {
    const { container } = draw(
      <TapeGauge value={142} zones={ZONES} span={25} label="none" height={64} />,
    );
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(
      false,
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} title="Airspeed" height={64} />,
    );
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("TapeGauge", (value: number) => (
  <TapeGauge value={value} title="Edge" height={64} />
));

// The scalar suite above walks `value`. ZONES are the other numeric input, and a
// malformed zone used to sail past the `b <= a` reject (NaN compares false) and
// emit y="NaN" height="NaN".
const z = (from: unknown, to: unknown, tone: "pos" | "neg" | "warn" | "neutral" = "warn") =>
  ({ from, to, tone }) as unknown as { from: number; to: number; tone: "warn" };

describe("<TapeGauge> degenerate zones (tests/craft/robust.mjs)", () => {
  const CASES: Record<string, readonly ReturnType<typeof z>[]> = {
    empty: [],
    "single zone": [z(130, 150)],
    "zero-width zone": [z(140, 140)],
    "reversed zone": [z(150, 130)],
    "null bounds": [z(null, null)],
    "one null bound": [z(130, null)],
    "NaN and ±Infinity": [
      z(Number.NaN, 150),
      z(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY),
    ],
    "mixed good and malformed": [z(130, 150, "pos"), z(Number.NaN, Number.NaN)],
    negatives: [z(-150, -130)],
    huge: [z(1e15, 3e15)],
    tiny: [z(1e-9, 3e-9)],
  };

  for (const [label, zones] of Object.entries(CASES)) {
    it(`${label} → renders, no non-finite leak, a11y contract holds`, () => {
      const { container } = draw(
        <TapeGauge value={142} rate={1} zones={zones} span={60} height={64} title="Edge" />,
      );
      for (const el of container.querySelectorAll("*"))
        for (const attr of [
          "d",
          "x",
          "y",
          "x1",
          "x2",
          "y1",
          "y2",
          "cx",
          "cy",
          "r",
          "width",
          "height",
          "viewBox",
          "aria-label",
        ])
          expect(el.getAttribute(attr) ?? "", `<${el.tagName} ${attr}>`).not.toMatch(
            /NaN|Infinity/,
          );
      expect(container.textContent).not.toMatch(/NaN|Infinity|undefined/);
      expect(container.querySelector('[role="img"][aria-label]')).not.toBeNull();
    });
  }

  it("a malformed zone is dropped, and a good one beside it still draws", () => {
    const { container } = draw(
      <TapeGauge value={142} zones={CASES["mixed good and malformed"]!} span={60} height={64} />,
    );
    expect(container.querySelectorAll("rect").length).toBe(1);
  });

  it("empty ≠ zero: no reading draws the rail + an unfilled pointer, not a blank box", () => {
    const { container } = draw(<TapeGauge value={NaN} zones={ZONES} span={60} height={64} />);
    // one muted path carries the rail + the unfilled pointer
    const chrome = container.querySelector<SVGPathElement>('path[data-mc-ink="muted"]')!;
    expect(chrome).not.toBeNull();
    expect(chrome.getAttribute("d")).toMatch(/^M[\d.]+ 1V[\d.]+M/);
    expect(container.querySelectorAll("rect").length).toBe(0); // no zone read as level
    expect([...container.querySelectorAll("text")].length).toBe(0); // no readout
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox — and the tape still
// renders.
describe("TapeGauge degradation", () => {
  it("a tick numeral within half a line of the box edge drops", () => {
    const big = draw(
      <TapeGauge value={142} zones={ZONES} span={60} width={160} height={30} />,
    ).container;
    const bigTicks = [...big.querySelectorAll("text[data-mc-ink='label']")];
    expect(bigTicks.length).toBeGreaterThan(0);
    for (const t of bigTicks) {
      const y = Number(t.getAttribute("y"));
      const fs = Number(t.getAttribute("font-size"));
      expect(y - fs * 0.5).toBeGreaterThanOrEqual(0);
      expect(y + fs * 0.5).toBeLessThanOrEqual(30);
    }

    // at 18 units tall the outermost tick sits under 3.5 units from the edge
    const small = draw(
      <TapeGauge value={142} zones={ZONES} span={60} width={96} height={18} />,
    ).container;
    for (const t of small.querySelectorAll("text[data-mc-ink='label']")) {
      const y = Number(t.getAttribute("y"));
      const fs = Number(t.getAttribute("font-size"));
      expect(y - fs * 0.5).toBeGreaterThanOrEqual(0);
      expect(y + fs * 0.5).toBeLessThanOrEqual(18);
    }
    // the tape, its ticks and the pointer survive
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("the hero readout drops when the box cannot seat it at 7 units", () => {
    const big = draw(
      <TapeGauge
        value={142}
        zones={ZONES}
        span={60}
        orientation="horizontal"
        width={160}
        height={30}
      />,
    ).container;
    expect([...big.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(true);

    // horizontal seats the readout UNDER the tape column — a 18-unit box leaves
    // it under 7 units of room, so it drops rather than painting past the edge
    const small = draw(
      <TapeGauge
        value={142}
        zones={ZONES}
        span={60}
        orientation="horizontal"
        width={96}
        height={18}
      />,
    ).container;
    expect([...small.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(false);
    expect(small.querySelector("path[data-mc-ink='accent']")).not.toBeNull();
  });
});
