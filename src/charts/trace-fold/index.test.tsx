import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TraceFold, traceFoldSummary, type TraceFoldDatum } from "./index.js";
import { traceFoldGeometry } from "./geometry.js";
import { EN_TRACE_FOLD } from "../../core/strings-trace-fold.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const ms = (n: number) => `${Math.round(n)} ms`;
const TRACE = [
  { label: "request", start: 0, duration: 214, depth: 0 },
  { label: "db.query", start: 10, duration: 86, depth: 1, parent: 0 },
  { label: "auth", start: 0, duration: 8, depth: 1, parent: 0 },
  { label: "render", start: 96, duration: 60, depth: 1, parent: 0 },
  { label: "serialize", start: 156, duration: 40, depth: 1, parent: 0 },
  { label: "index-scan", start: 12, duration: 70, depth: 2, parent: 1 },
  { label: "decode", start: 82, duration: 12, depth: 2, parent: 1 },
  { label: "log", start: 200, duration: 14, depth: 1, parent: 0 },
  { label: "gc", start: 90, duration: 5, depth: 2, parent: 1 },
];

describe("<TraceFold>", () => {
  it("renders a rect per span summary names the critical path", () => {
    const { container } = draw(<TraceFold data={TRACE} width={200} height={40} />);
    expect(container.querySelectorAll("rect").length).toBe(9);
    const geo = traceFoldGeometry({ data: TRACE, width: 200, height: 40, rowGap: 1.2 });
    expect(traceFoldSummary(geo, EN_TRACE_FOLD, ms)).toBe(
      "9 spans over 214 ms; longest db.query (86 ms) on the critical path.",
    );
  });

  it("critical spans are accented; non-critical muted (emphasis default)", () => {
    const { container } = draw(<TraceFold data={TRACE} width={200} height={40} />);
    expect(container.querySelector('rect[data-mc-ink="accent"]')).not.toBeNull();
    expect(container.querySelector('rect[data-mc-ink="neutral"]')).not.toBeNull();
  });

  it("emphasis='none' renders spans uniformly", () => {
    const { container } = draw(<TraceFold data={TRACE} emphasis="none" width={200} height={40} />);
    expect(container.querySelector('rect[data-mc-ink="accent"]')).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TraceFold data={TRACE} title="Request trace" width={200} height={40} />,
    );
    await expectNoA11yViolations(container);
  });

  describe("degenerate spans", () => {
    it("a fractional/non-finite parent addresses no row instead of crashing", () => {
      const bogus = TRACE.map((s) => ({ ...s, parent: 1e-9 }));
      expect(() =>
        traceFoldGeometry({ data: bogus, width: 200, height: 40, rowGap: 1.2 }),
      ).not.toThrow();
    });

    it("a span with no start is drawn as absent, not at time 0", () => {
      const geo = traceFoldGeometry({
        data: [
          { label: "request", start: 0, duration: 100, depth: 0 },
          { label: "orphan", start: Number.NaN, duration: 40, depth: 1 },
        ],
        width: 200,
        height: 40,
        rowGap: 1.2,
      });
      // it keeps its index (parent links and the picker address it by that)…
      expect(geo.rects.length).toBe(2);
      // …but carries a finite x and no width, so nothing paints.
      expect(Number.isFinite(geo.rects[1]!.x)).toBe(true);
      expect(geo.rects[1]!.width).toBe(0);
      const { container } = draw(
        <TraceFold
          data={[
            { label: "request", start: 0, duration: 100, depth: 0 },
            { label: "orphan", start: Number.NaN, duration: 40, depth: 1 },
          ]}
          width={200}
          height={40}
        />,
      );
      expect(container.querySelectorAll("rect").length).toBe(1);
    });

    // A host sizing a trace off an element it has not measured yet passes
    // `width={NaN}`. `Chart` clamped the frame, so the viewBox and the
    // accessible name read correct while every rect carried x="NaN"; a negative
    // box drew the rows outside a frame that does not clip.
    it.each([
      ["NaN", Number.NaN],
      ["Infinity", Number.POSITIVE_INFINITY],
      ["zero", 0],
      ["negative", -50],
    ])("an unusable %s box falls back to the default, not NaN coords", (_name, bad) => {
      const boxes = [{ width: bad, height: 40 }, { width: 200, height: bad }, { width: bad }];
      for (const box of boxes) {
        const { container } = draw(<TraceFold data={TRACE} {...box} />);
        const svg = container.querySelector("svg")!;
        expect(svg.getAttribute("viewBox")).not.toMatch(/NaN|Infinity|-/);
        // the seat and the label size are derived from the box too
        expect(svg.getAttribute("style")).not.toMatch(/NaN|Infinity/);
        const [, , vw, vh] = svg.getAttribute("viewBox")!.split(" ").map(Number);
        for (const r of container.querySelectorAll("rect")) {
          const [x, y, w, h] = ["x", "y", "width", "height"].map((a) => Number(r.getAttribute(a)));
          expect([x, y, w, h].every((n) => Number.isFinite(n))).toBe(true);
          // the fallback box is the one the marks are laid out against
          expect(x!).toBeGreaterThanOrEqual(0);
          expect(y!).toBeGreaterThanOrEqual(0);
          expect(x! + w!).toBeLessThanOrEqual(vw! + 0.01);
          expect(y! + h!).toBeLessThanOrEqual(vh! + 0.01);
        }
      }
    });

    it("an unplaceable span is never named the longest", () => {
      const geo = traceFoldGeometry({
        data: [
          { label: "request", start: 0, duration: 100, depth: 0 },
          { label: "orphan", start: Number.NaN, duration: 9999, depth: 1 },
        ],
        width: 200,
        height: 40,
        rowGap: 1.2,
      });
      expect(geo.longest?.label).not.toBe("orphan");
    });
  });
});

// Three fields are encoded — `start` (x), `duration` (width) and `depth` (row) —
// so the matrix runs once per field with the other two finite and realistic.
//
// One suite per field, rather than one suite putting the value on both `start`
// and `duration`: with both degenerate the `start` guard discards the row before
// the `duration` guard is consulted, so a broken duration check reads as passing,
// and index parity decides which of NaN/±Infinity ever lands on which field.
// `parent` links every span so the critical-path tree walk runs, and `labels` is
// on by default — the in-rect text is where a numeral leak would surface.
const traceFoldCase = (data: readonly TraceFoldDatum[]) => (
  <TraceFold data={data} title="Edge" width={120} height={32} />
);
mappedEdgeSuite(
  "TraceFold (degenerate start)",
  (v, i) => ({
    label: `s${i}`,
    start: v as number,
    duration: 12,
    depth: i % 3,
    parent: i > 0 ? i - 1 : undefined,
  }),
  traceFoldCase,
);
mappedEdgeSuite(
  "TraceFold (degenerate duration)",
  (v, i) => ({
    label: `s${i}`,
    start: i * 10,
    duration: v as number,
    depth: i % 3,
    parent: i > 0 ? i - 1 : undefined,
  }),
  traceFoldCase,
);
mappedEdgeSuite(
  "TraceFold (degenerate depth)",
  (v, i) => ({
    label: `s${i}`,
    start: i * 10,
    duration: 12,
    depth: v as number,
    parent: i > 0 ? i - 1 : undefined,
  }),
  traceFoldCase,
);
