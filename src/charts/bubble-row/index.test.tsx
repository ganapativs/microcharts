import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { BubbleRow } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "APAC", value: 560 },
  { label: "LATAM", value: 210 },
] as const;

describe("<BubbleRow>", () => {
  it("summary names the extremes", () => {
    const { container } = draw(<BubbleRow data={REGIONS} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 items; largest EMEA at 1,240, smallest LATAM at 210.",
    );
  });

  it("value numerals are ON by default (a low-precision channel owes the number)", () => {
    const { container } = draw(<BubbleRow data={REGIONS} />);
    expect(container.querySelectorAll("circle").length).toBe(4);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "1,240",
      "890",
      "560",
      "210",
    ]);
  });

  it("label='none' opts out of the numerals", () => {
    const { container } = draw(<BubbleRow data={REGIONS} label="none" />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("label='both' shows label + value", () => {
    const { container } = draw(<BubbleRow data={REGIONS.slice(0, 1)} label="both" />);
    expect(container.querySelector("text")!.textContent).toBe("EMEA 1,240");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<BubbleRow data={REGIONS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<BubbleRow data={REGIONS} title="Market size" />);
    await expectNoA11yViolations(container);
  });

  describe("degenerate values", () => {
    it("a non-finite value prints no numeral — the presence ring stands alone", () => {
      const { container } = draw(
        <BubbleRow data={[{ label: "EMEA", value: Number.NaN }, ...REGIONS.slice(1)]} />,
      );
      expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
        "890",
        "560",
        "210",
      ]);
      // …but it still occupies its slot: 4 bubbles, not 3.
      expect(container.querySelectorAll("circle").length).toBe(4);
    });

    it("no measured value reads as no data", () => {
      const { container } = draw(<BubbleRow data={[{ label: "EMEA", value: null }]} />);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    });

    it("a negative prints no numeral either — area cannot say 'minus'", () => {
      // The row used to paint "-5" under a 0.5-radius presence ring while the
      // summary silently dropped it: painted and announced disagreeing.
      const { container } = draw(
        <BubbleRow data={[{ label: "DEBT", value: -5 }, ...REGIONS.slice(1)]} />,
      );
      expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
        "890",
        "560",
        "210",
      ]);
      expect(container.querySelectorAll("circle").length).toBe(4);
      expect(container.querySelector("circle")!.getAttribute("r")).toBe("0.5");
    });

    it("all-negative reads as no data, and paints no numerals to contradict it", () => {
      const { container } = draw(
        <BubbleRow
          data={[
            { label: "A", value: -5 },
            { label: "B", value: -2 },
          ]}
        />,
      );
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
      expect(container.querySelector("text")).toBeNull();
    });
  });

  describe("hostile layout props", () => {
    // A raw `height`/`gap`/`fontSize` reached viewBox, cx, cy, r, x, y and
    // font-size, so one bad scalar rendered nothing while the summary read fine.
    const HOSTILE = {
      "height NaN": { height: Number.NaN },
      "height Infinity": { height: Number.POSITIVE_INFINITY },
      "gap NaN": { gap: Number.NaN },
      "gap Infinity": { gap: Number.POSITIVE_INFINITY },
      "gap negative": { gap: -100 },
      "fontSize NaN": { fontSize: Number.NaN },
      "fontSize negative": { fontSize: -8 },
    } as const;
    const markup = (props: object) =>
      draw(<BubbleRow data={REGIONS} {...props} />).container.innerHTML;

    for (const [name, props] of Object.entries(HOSTILE)) {
      it(`${name} falls back to the documented default`, () => {
        expect(markup(props)).toBe(markup({}));
      });
    }
  });

  it("numerals drop, never spill, when the box can no longer seat them", () => {
    const { container } = draw(<BubbleRow data={REGIONS} height={8} />);
    expect(container.querySelector("text")).toBeNull();
    // …and the gutter goes with the label: no dead band left behind.
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 20 8");
  });

  it("stays inside the viewBox, marks and estimated text extents alike", () => {
    // Per-char extents measured in core/labels.ts: 0.62 covers tabular figures,
    // 0.95 covers arbitrary caller text (an all-caps label is the worst case).
    for (const [mode, rate] of [
      ["value", 0.62],
      ["both", 0.95],
    ] as const) {
      const { container } = draw(
        <BubbleRow data={[...REGIONS, { label: "WWWWWW", value: 40 }]} label={mode} />,
      );
      const svg = container.querySelector("svg")!;
      const [, , w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
      for (const c of svg.querySelectorAll("circle")) {
        const [cx, cy, r] = ["cx", "cy", "r"].map((a) => Number(c.getAttribute(a)));
        expect(cx! - r!, `${mode} circle left`).toBeGreaterThanOrEqual(0);
        expect(cx! + r!, `${mode} circle right`).toBeLessThanOrEqual(w!);
        expect(cy! - r!, `${mode} circle top`).toBeGreaterThanOrEqual(0);
        expect(cy! + r!, `${mode} circle bottom`).toBeLessThanOrEqual(h!);
      }
      for (const t of svg.querySelectorAll("text")) {
        const x = Number(t.getAttribute("x"));
        const y = Number(t.getAttribute("y"));
        const fs = Number(t.getAttribute("font-size"));
        const half = (t.textContent!.length * rate * fs) / 2; // text-anchor: middle
        expect(x - half, `${mode} text left`).toBeGreaterThanOrEqual(0);
        expect(x + half, `${mode} text right`).toBeLessThanOrEqual(w!);
        expect(y - fs * 0.78, `${mode} text ascent`).toBeGreaterThanOrEqual(0);
        expect(y + fs * 0.22, `${mode} text descent`).toBeLessThanOrEqual(h!);
      }
    }
  });
});

mappedEdgeSuite(
  "BubbleRow",
  (v, i) => ({ label: `R${i}`, value: v }),
  (data) => <BubbleRow data={data} label="both" title="Market size" />,
);
