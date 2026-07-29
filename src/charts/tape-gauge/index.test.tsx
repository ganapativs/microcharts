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
    // chevron path uses the accent ink role (element-split: strokes on path).
    // It is an OPEN path (no trailing z) — unlike the filled pointer triangle —
    // so it must carry fill="none" or the accent rule fills it into a blob.
    const chevron = [
      ...container.querySelectorAll<SVGPathElement>('path[data-mc-ink="accent"]'),
    ].find((p) => !(p.getAttribute("d") ?? "").trim().endsWith("z"));
    expect(chevron).toBeTruthy();
    expect(chevron!.getAttribute("fill")).toBe("none");
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

/** No non-finite number may reach a coordinate, a size, or the spoken name. */
const expectNoNonFinite = (container: HTMLElement) => {
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
      "style",
      "aria-label",
    ])
      expect(el.getAttribute(attr) ?? "", `<${el.tagName} ${attr}>`).not.toMatch(/NaN|Infinity/);
  expect(container.textContent).not.toMatch(/NaN|Infinity|undefined/);
};

/** Chevron count: the accent path that does NOT close (`z` ends the pointer). */
const chevrons = (c: HTMLElement) =>
  [...c.querySelectorAll<SVGPathElement>('path[data-mc-ink="accent"]')].filter(
    (p) => !(p.getAttribute("d") ?? "").trim().endsWith("z"),
  ).length;

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
      expectNoNonFinite(container);
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

// `span`, `rateTiers`, `width` and `height` are CONFIG props — a NaN from an
// empty input or an Infinity from a division renders a perfectly ordinary gauge
// while the scale under it is not a scale. Announced and painted have to agree.
describe("<TapeGauge> hostile scale props", () => {
  it("an infinite span falls back to the auto window instead of dividing by it", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} span={Infinity} title="Edge" />,
    );
    expectNoNonFinite(container); // was y="NaN" height="NaN" on every zone rect
    // auto span = the 100–200 zone extent × 1.25, so tiers are [2.08, 8.33] and
    // a rate of 1 is steady — the word and the (absent) chevron agree
    expect(container.querySelector("[aria-label]")!.getAttribute("aria-label")).toContain("steady");
    expect(chevrons(container)).toBe(0);
    expect(container.querySelectorAll("rect").length).toBe(3);
  });

  it("a zero or negative span draws the auto window, not an empty tape", () => {
    for (const span of [0, -5]) {
      const { container } = draw(<TapeGauge value={142} zones={ZONES} span={span} title="Edge" />);
      expectNoNonFinite(container);
      expect(container.querySelectorAll("rect").length).toBe(3);
    }
  });

  it("non-finite rate tiers fall back to the span-derived pair", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} rateTiers={[NaN, NaN]} />,
    );
    // NaN compares false both ways, so both thresholds were "cleared" and a
    // rate of 1 announced the top tier over a 25-unit window
    expect(container.querySelector("[aria-label]")!.getAttribute("aria-label")).toContain("rising");
    expect(container.querySelector("[aria-label]")!.getAttribute("aria-label")).not.toContain(
      "fast",
    );
    expect(chevrons(container)).toBe(1);
  });

  it("a non-finite box clamps to the default, frame and marks together", () => {
    for (const box of [{ width: NaN }, { height: NaN }, { width: 0 }, { height: Infinity }]) {
      const { container } = draw(
        <TapeGauge value={142} rate={1} zones={ZONES} span={25} title="Edge" {...box} />,
      );
      // `Chart` clamped the viewBox already; the marks were still laid out
      // against the raw prop and painted NaN coords inside a valid frame
      expectNoNonFinite(container);
      expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 46 60");
    }
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
