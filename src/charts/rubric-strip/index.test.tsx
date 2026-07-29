import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RubricStrip, rubricStripSummary, type RubricStripDatum } from "./index.js";
import { EN_RUBRIC } from "../../core/strings-rubric.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

describe("<RubricStrip>", () => {
  it("renders a bar per criterion summary names extremes", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={120} height={32} />);
    // 4 tracks + 4 bars
    expect(container.querySelectorAll("rect").length).toBe(8);
    expect(rubricStripSummary(RUBRIC, EN_RUBRIC, fmt)).toBe(
      "4 criteria; highest Correctness (0.92), lowest Style (0.41).",
    );
  });

  it("target renders a target tick across all rows", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} target={0.7} width={120} height={32} />);
    expect(container.querySelector("line[stroke-dasharray]")).not.toBeNull();
  });

  it("labels sit clear of the track — not kissing the bar", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} labels width={240} height={80} />);
    const label = [...container.querySelectorAll("text")].find(
      (t) => t.textContent === "Correctness",
    )!;
    const tracks = [...container.querySelectorAll("rect")].filter(
      (r) => r.getAttribute("data-mc-ink") === "neutral",
    );
    const trackX = Math.min(...tracks.map((r) => Number(r.getAttribute("x"))));
    expect(Number(label.getAttribute("x"))).toBeLessThanOrEqual(trackX - 8);
  });

  it("labels render the criterion names in the gutter", () => {
    const { container } = draw(<RubricStrip data={RUBRIC} width={260} height={40} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["Correctness", "Coverage", "Clarity", "Style"]);
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <RubricStrip data={RUBRIC} title="Model eval" width={120} height={32} />,
    );
    await expectNoA11yViolations(container);
  });

  describe("degenerate scores", () => {
    it("an unscored row can't be an extreme, but still counts as a criterion", () => {
      expect(
        rubricStripSummary(
          [{ label: "Correctness", score: null as unknown as number }, ...RUBRIC.slice(1)],
          EN_RUBRIC,
          fmt,
        ),
      ).toBe("4 criteria; highest Coverage (0.78), lowest Style (0.41).");
    });

    it("no scored row reads as no data, never as NaN or ∞", () => {
      const allGaps = RUBRIC.map((d) => ({ ...d, score: null as unknown as number }));
      expect(rubricStripSummary(allGaps, EN_RUBRIC, fmt)).toBe("No data.");
      expect(
        rubricStripSummary(
          RUBRIC.map((d) => ({ ...d, score: Number.POSITIVE_INFINITY })),
          EN_RUBRIC,
          fmt,
        ),
      ).toBe("No data.");
    });

    it("a row keeps its own bar when two criteria share a name", () => {
      // Keys were the label: React reconciled the second row onto the first.
      const { container } = draw(
        <RubricStrip
          data={[
            { label: "Same", score: 0.9, weight: 1 },
            { label: "Same", score: 0.2, weight: 1 },
          ]}
          width={120}
          height={40}
        />,
      );
      const bars = [...container.querySelectorAll('rect[data-mc-ink="accent"]')].map((r) =>
        Number(r.getAttribute("width")),
      );
      expect(bars.length).toBe(2);
      expect(bars[0]).toBeGreaterThan(bars[1]!);
    });

    it("an unscored row draws its track but no bar — empty is not zero", () => {
      const { container } = draw(
        <RubricStrip
          data={[{ label: "Correctness", score: null as unknown as number }]}
          width={120}
          height={32}
        />,
      );
      const rects = [...container.querySelectorAll("rect")];
      // the track is full width; the bar is zero-width (drawn as absent)
      expect(rects[0]!.getAttribute("width")).not.toBe("0");
      expect(rects[1]!.getAttribute("width")).toBe("0");
    });
  });
});

/** Every numeric attribute the strip emitted, so a NaN can't hide in one. */
const numericAttrs = (container: HTMLElement): string[] => {
  const out: string[] = [];
  for (const el of container.querySelectorAll("rect, line, text")) {
    for (const name of ["x", "y", "x1", "x2", "y1", "y2", "width", "height", "rx", "font-size"]) {
      const v = el.getAttribute(name);
      if (v !== null) out.push(v);
    }
  }
  out.push(container.querySelector("svg")!.getAttribute("style") ?? "");
  return out;
};

// Hostile CONFIG — the props a host computes rather than types by hand: a domain
// from `Math.min(...)` over a series with a gap, a `target` from an empty input,
// a box side from a layout that has not measured yet. Each of these painted a
// normal-looking strip while the marks or the accessible name disagreed with the
// scale actually drawn.
describe("<RubricStrip> survives a hostile config", () => {
  it("a non-finite domain bound falls back to the unit default, never NaN widths", () => {
    for (const domain of [
      [NaN, 1],
      [0, NaN],
      [0, Infinity],
      [-Infinity, Infinity],
    ] as Array<[number, number]>) {
      const { container } = draw(<RubricStrip data={RUBRIC} domain={domain} width={120} />);
      expect(numericAttrs(container).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
      // and the fallback is the SAME scale the summary reads out: 0.92 of the
      // unit domain is 92% of its track, not an empty row.
      const [track, bar] = [...container.querySelectorAll("rect")];
      expect(Number(bar!.getAttribute("width"))).toBeCloseTo(
        Number(track!.getAttribute("width")) * 0.92,
        1,
      );
    }
  });

  it("a non-finite target is no target — no tick, and no row painted as a miss", () => {
    for (const target of [NaN, Infinity]) {
      const { container } = draw(<RubricStrip data={RUBRIC} target={target} width={120} />);
      expect(container.querySelector("line")).toBeNull();
      expect(container.querySelector('rect[data-mc-ink="negative"]')).toBeNull();
    }
  });

  it("a non-finite or negative box side falls back to the documented default", () => {
    for (const props of [
      { width: NaN },
      { width: -40 },
      { width: 0 },
      { height: NaN },
      { height: -30 },
      { height: Number.MAX_VALUE * 2 },
    ]) {
      const { container } = draw(<RubricStrip data={RUBRIC} {...props} />);
      expect(numericAttrs(container).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
      // marks are laid out against the box `Chart` actually frames
      const [, , vw, vh] = container
        .querySelector("svg")!
        .getAttribute("viewBox")!
        .split(" ")
        .map(Number);
      for (const r of container.querySelectorAll("rect")) {
        expect(Number(r.getAttribute("x"))).toBeGreaterThanOrEqual(0);
        expect(Number(r.getAttribute("x")) + Number(r.getAttribute("width"))).toBeLessThanOrEqual(
          vw! + 0.01,
        );
        expect(Number(r.getAttribute("y")) + Number(r.getAttribute("height"))).toBeLessThanOrEqual(
          vh! + 0.01,
        );
      }
    }
  });
});

// Containment. `.mc-root` is `overflow: visible`, so a criterion name that
// outgrows its gutter spills into the page — it is never clipped. Text is never
// measured here (the static path may not), so extents use the same prose
// per-char estimate the gutter reserves with.
const LONG = "A criterion with an extremely long name indeed";
const extents = (container: HTMLElement) =>
  [...container.querySelectorAll("text")].map((t) => {
    const size = Number(t.getAttribute("font-size"));
    // text-anchor="end": the name runs LEFT from its x
    return {
      left: Number(t.getAttribute("x")) - (t.textContent?.length ?? 0) * size * 0.95,
      top: Number(t.getAttribute("y")) - size * 0.5,
      bottom: Number(t.getAttribute("y")) + size * 0.5,
    };
  });

describe("<RubricStrip> keeps every mark and name inside the viewBox", () => {
  it.each([
    ["one long name", [{ label: LONG, score: 0.5, weight: 1 }], 240, 20],
    ["long names in a small box", [{ label: LONG, score: 0.5, weight: 1 }], 80, 20],
    ["mixed lengths", RUBRIC, 260, 40],
    ["an astral-glyph name", [{ label: "🚀🚀🚀🚀🚀🚀🚀🚀🚀", score: 0.5, weight: 1 }], 200, 20],
    [
      "one dominant weight",
      [
        { label: "Correctness", score: 0.92, weight: 10 },
        { label: "Coverage", score: 0.78, weight: 1 },
        { label: "Clarity", score: 0.65, weight: 1 },
        { label: "Style", score: 0.41, weight: 1 },
      ],
      200,
      40,
    ],
  ])("%s", (_name, data, width, height) => {
    const { container } = draw(<RubricStrip data={data} width={width} height={height} />);
    for (const e of extents(container)) {
      expect(e.left).toBeGreaterThanOrEqual(0);
      expect(e.top).toBeGreaterThanOrEqual(0);
      expect(e.bottom).toBeLessThanOrEqual(height + 0.01);
    }
  });

  it("truncates a name that outgrows its gutter, and drops it when even that can't read", () => {
    const wide = draw(<RubricStrip data={[{ label: LONG, score: 0.5, weight: 1 }]} width={240} />);
    expect(wide.container.querySelector("text")!.textContent).toBe("A criterion wi…");
    // The budget tracks the room: a narrower box keeps fewer characters, down to
    // the `ROW_LABEL_MIN_CHARS` floor, below which the name would identify
    // nothing and drops so the track can reclaim the gutter.
    const tight = draw(<RubricStrip data={[{ label: LONG, score: 0.5, weight: 1 }]} width={80} />);
    expect(tight.container.querySelector("text")!.textContent).toBe("A cr…");
    const crushed = draw(
      <RubricStrip data={[{ label: LONG, score: 0.5, weight: 1 }]} width={30} />,
    );
    expect(crushed.container.querySelector("text")).toBeNull();
    expect(crushed.container.querySelector("rect")!.getAttribute("x")).toBe("0");
  });

  it("drops the names when one dominant weight squeezes its neighbours together", () => {
    // Thickness is the weight channel: rows sit on the 2-unit floor while the
    // AVERAGE row still looks roomy, and the names printed over each other.
    const lopsided = [
      { label: "Correctness", score: 0.92, weight: 10 },
      { label: "Coverage", score: 0.78, weight: 1 },
      { label: "Clarity", score: 0.65, weight: 1 },
      { label: "Style", score: 0.41, weight: 1 },
    ];
    const { container } = draw(<RubricStrip data={lopsided} width={200} height={40} />);
    expect(container.querySelectorAll("text").length).toBe(0);
    // even weights at the same box keep them
    const even = draw(
      <RubricStrip data={lopsided.map((d) => ({ ...d, weight: 1 }))} width={200} height={40} />,
    );
    expect(even.container.querySelectorAll("text").length).toBe(4);
  });
});

// `score` is typed `number`, but a rubric row with no score is a real state and
// the runtime has to survive it. Both numeric fields are encoded — `score` is bar
// length, `weight` is row thickness — so the matrix runs once per field with the
// other finite.
//
// One suite per field, rather than the previous spelling that put the value on
// BOTH at once: with a degenerate weight the row can collapse before the score
// guard is consulted, so a broken score check reads as passing, and index parity
// decides which of NaN/±Infinity ever lands on which field. `labels` (default)
// and `target` are on — the criterion text and the target tick are where a
// numeral leak surfaces.
const rubricCase = (data: readonly RubricStripDatum[]) => (
  <RubricStrip data={data} target={0.7} title="Edge" />
);
mappedEdgeSuite(
  "RubricStrip (degenerate score)",
  (v, i) => ({ label: `c${i}`, score: v as number, weight: 1 + (i % 3) }),
  rubricCase,
);
mappedEdgeSuite(
  "RubricStrip (degenerate weight)",
  (v, i) => ({ label: `c${i}`, score: 0.35 + (i % 5) * 0.12, weight: v as number }),
  rubricCase,
);
