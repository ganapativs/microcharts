import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TimeInRange, timeInRangeSummary } from "./index.js";
import { EN_TIME_IN_RANGE } from "../../core/strings-time-in-range.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
// de-DE separates the number from the percent sign with U+00A0, which is
// indistinguishable from a plain space in source — named, never pasted.
const NBSP = String.fromCharCode(160);

describe("<TimeInRange>", () => {
  it("renders one rect per present zone summary + label", () => {
    const { container } = draw(<TimeInRange data={{ below: 9, in: 72, above: 19 }} />);
    expect(container.querySelectorAll("rect").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "72% in range, 9% below, 19% above.",
    );
    // default label="in" shows the in-range percent
    expect(container.querySelector("text")!.textContent).toBe("72%");
  });

  it("summary appends severe tiers when present", () => {
    expect(
      timeInRangeSummary(
        { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 },
        EN_TIME_IN_RANGE,
      ),
    ).toBe("72% in range, 7% below, 15% above, 2% severe low, 4% severe high.");
  });

  it("label='none' draws no text; label='all' labels zones that fit", () => {
    const none = draw(<TimeInRange data={{ below: 9, in: 72, above: 19 }} label="none" />);
    expect(none.container.querySelectorAll("text").length).toBe(0);
    const all = draw(
      <TimeInRange data={{ below: 30, in: 40, above: 30 }} label="all" width={160} height={20} />,
    );
    expect(all.container.querySelectorAll("text").length).toBeGreaterThan(1);
  });

  it("all-zero data → empty strip, summary No data.", () => {
    const { container } = draw(<TimeInRange data={{ below: 0, in: 0, above: 0 }} />);
    expect(container.querySelectorAll("rect").length).toBe(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("locale spells the zone percents, and the fit is measured off that string", () => {
    const { container } = draw(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} locale="de-DE" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      `72${NBSP}% in range, 9${NBSP}% below, 19${NBSP}% above.`,
    );
    // painted label and summary read the SAME localized string
    expect(container.querySelector("text")!.textContent).toBe(`72${NBSP}%`);

    // The in-zone label has to clear its own rect, and the clearance is computed
    // from the FORMATTED string: at 24 units the 3-char en-US percent seats and
    // the 4-char de-DE one does not, so it DROPS rather than spilling the zone.
    const data = { below: 9, in: 72, above: 19 };
    const en = draw(<TimeInRange data={data} width={24} />).container;
    const de = draw(<TimeInRange data={data} width={24} locale="de-DE" />).container;
    expect(en.querySelector("text")).not.toBeNull();
    expect(de.querySelector("text")).toBeNull();
    expect(de.querySelectorAll("rect").length).toBe(3);
  });

  it("a hostile width/height falls back to the default frame instead of painting NaN", () => {
    // A host-computed side (`Number("")`, a collapsed flex box, a division by a
    // zero container) laid the zones out against the raw prop: `width="NaN"`
    // rects inside a valid viewBox, `Infinity` ones outside it, and a NaN
    // `--mc-seat` dragging the inline baseline with it.
    for (const side of [NaN, Infinity, -Infinity, 0, -40]) {
      for (const props of [{ width: side }, { height: side }]) {
        const { container } = draw(
          <TimeInRange data={{ below: 9, in: 72, above: 19 }} {...props} />,
        );
        const svg = container.querySelector("svg")!;
        expect(svg.getAttribute("viewBox")).toBe("0 0 80 12");
        for (const el of container.querySelectorAll("*")) {
          for (const attr of el.attributes) {
            expect(attr.value).not.toMatch(/NaN|Infinity/);
          }
        }
      }
    }
  });

  it("a total past the double range paints the zones it announces", () => {
    // Was: shares all collapsed to 0 (the sum overflowed), so the strip came out
    // blank while the accessible name read "1% in range, 1% below, 1% above".
    const { container } = draw(<TimeInRange data={{ below: 1e308, in: 1e308, above: 1e308 }} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "33% in range, 34% below, 33% above.",
    );
    const widths = [...container.querySelectorAll("rect")].map((r) =>
      Number(r.getAttribute("width")),
    );
    expect(widths.length).toBe(3);
    expect(widths.every((w) => w > 20)).toBe(true);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} title="Glucose in range" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("TimeInRange", (data: readonly Value[]) => (
  <TimeInRange
    data={
      {
        severeBelow: data[0] as number,
        below: (data[1] ?? 0) as number,
        in: (data[2] ?? 0) as number,
        above: (data[3] ?? 0) as number,
        severeAbove: data[4] as number,
      } as { below: number; in: number; above: number }
    }
    title="Edge"
  />
));

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("TimeInRange degradation", () => {
  it("the zone percents drop under a 7-unit strip, the zones still draw", () => {
    const big = draw(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} width={240} height={22} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} width={60} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("rect").length).toBe(3);
  });

  it("a vertical strip thinner than the label DROPS it; a vertical strip that fits seats it inside the viewBox", () => {
    // The <text> is unrotated in BOTH orientations, so the in-zone percent's
    // glyph extent always runs along the SVG X axis — the strip's X width,
    // which is the cross-strip thickness in vertical. The fit gate has to
    // bound that extent against z.width; bounding it against z.height (the
    // along-strip length) let the label escape the viewBox on both X edges
    // on a thin vertical strip.
    const data = { below: 9, in: 72, above: 19 };

    // Repro: viewBox "0 0 12 80", strip thickness 10, "72%" glyph extent ~15.02
    // at fontSize 7 — wider than the strip, so the label DROPS, the zones stay.
    const thin = draw(
      <TimeInRange data={data} orientation="vertical" width={12} height={80} />,
    ).container;
    expect(thin.querySelector("text")).toBeNull();
    expect(thin.querySelectorAll("rect").length).toBe(3);

    // Docs call-site geometry (cross-strip thickness 24): "72%" glyph extent
    // ~22.46 at fontSize 11 — seats, and stays inside the viewBox on X.
    const wide = draw(
      <TimeInRange data={data} orientation="vertical" width={26} height={110} />,
    ).container;
    const text = wide.querySelector("text")!;
    expect(text.textContent).toBe("72%");
    const viewBoxW = Number(wide.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    const x = Number(text.getAttribute("x"));
    const fs = Number(text.getAttribute("font-size"));
    const half = (text.textContent!.length * fs * 0.62 + 2) / 2;
    expect(x - half).toBeGreaterThanOrEqual(0);
    expect(x + half).toBeLessThanOrEqual(viewBoxW);
  });
});
