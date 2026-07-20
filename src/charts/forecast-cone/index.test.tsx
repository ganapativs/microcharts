import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ForecastCone } from "./index.js";
import type { ForecastInput } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const HIST = [30, 32, 31, 34, 36, 35, 38];
const FC: ForecastInput = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
  p50: [
    [37, 41],
    [37, 43],
    [36, 46],
    [35, 49],
  ],
};

describe("<ForecastCone>", () => {
  it("summary states median, horizon interval, and today — the real string", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Median forecast 42 by week 11 (80% between 33 and 55), from 38 today.",
    );
  });

  it("target adds a clearance clause (straddles when target is inside the band)", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} target={45} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "The 80% band straddles the 45 target",
    );
  });

  it("target below the whole band → clears", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} target={20} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "clears the 20 target",
    );
  });

  it("2 bands + solid history + dashed median", () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} />);
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(2);
    const mid = [...container.querySelectorAll("path")].find(
      (p) => p.getAttribute("stroke-dasharray") === "2.5 2.5",
    );
    expect(mid).toBeTruthy(); // median is dashed
  });

  it("p50 omitted → a single band", () => {
    const { container } = draw(
      <ForecastCone data={HIST} forecast={{ mid: FC.mid, p80: FC.p80 }} />,
    );
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(1);
  });

  it("a non-widening cone dev-warns and renders as given (never auto-inflated)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <ForecastCone
        data={[10, 11]}
        forecast={{
          mid: [12, 13, 14],
          p80: [
            [9, 15],
            [10, 14],
            [11, 13],
          ],
        }}
      />,
    );
    expect(warn).toHaveBeenCalled();
    expect(container.querySelectorAll("path.mc-cone-band").length).toBe(1);
  });

  it("label='landing' states the median endpoint; 'none' shows no text", () => {
    const labeled = draw(<ForecastCone data={HIST} forecast={FC} />).container;
    const none = draw(<ForecastCone data={HIST} forecast={FC} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("42");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ForecastCone data={HIST} forecast={FC} title="Q4 revenue" />);
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    // label="none" keeps totalWidth == width, so the containment frame matches
    // the viewBox (the landing label legitimately lives in a right gutter).
    expectHostsAnnotations(
      (children) => (
        <ForecastCone data={HIST} forecast={FC} label="none" width={80} height={20} summary={false}>
          {children}
        </ForecastCone>
      ),
      80,
      20,
    );
  });
});

seriesEdgeSuite("ForecastCone", (data) => (
  <ForecastCone
    data={data as number[]}
    forecast={{
      mid: [40, 42],
      p80: [
        [37, 43],
        [35, 47],
      ],
    }}
    title="Edge"
  />
));

// The shared suite above walks `data` (the history). The FORECAST is the other
// numeric input and has its own shape (mid[] + [lo,hi] pairs), so it gets the
// same matrix here: a malformed band must never reach a coordinate or the name.
const f = (mid: unknown, p80: unknown): ForecastInput => ({ mid, p80 }) as unknown as ForecastInput;

describe("<ForecastCone> degenerate forecast input (tests/craft/robust.mjs)", () => {
  const CASES: Record<string, ForecastInput> = {
    "empty mid": f([], []),
    "single period": f([39], [[36]]), // a SHORT pair — no hi bound
    "missing p80 rows": f([39, 40, 41], [[36, 42]]),
    "no p80 at all": f([39, 40], undefined),
    "all equal": f(
      [40, 40],
      [
        [40, 40],
        [40, 40],
      ],
    ),
    "null bounds": f(
      [39, 40],
      [
        [null, null],
        [null, 45],
      ],
    ),
    "NaN and ±Infinity": f(
      [39, 40],
      [
        [Number.NaN, 42],
        [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
      ],
    ),
    "reversed pairs": f(
      [39, 40],
      [
        [42, 36],
        [45, 35],
      ],
    ),
    negatives: f(
      [-39, -40],
      [
        [-42, -36],
        [-45, -35],
      ],
    ),
    huge: f(
      [1e15, 3e15],
      [
        [1e15, 2e15],
        [9e14, 4e15],
      ],
    ),
    tiny: f(
      [1e-9, 2e-9],
      [
        [1e-9, 3e-9],
        [1e-9, 4e-9],
      ],
    ),
  };

  for (const [label, forecast] of Object.entries(CASES)) {
    it(`${label} → renders, no non-finite leak, a11y contract holds`, () => {
      const { container } = draw(<ForecastCone data={HIST} forecast={forecast} title="Edge" />);
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

  it("an unknown interval bound collapses the band onto the median, never to NaN", () => {
    const { container } = draw(
      <ForecastCone data={HIST} forecast={f([39], [[36]])} title="Edge" />,
    );
    // "…(80% between 36 and 39)…" — the known bound is kept, the missing one
    // falls back to the median rather than inventing a range.
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "80% between 36 and 39",
    );
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("ForecastCone degradation", () => {
  it("the landing readout drops under a 7-unit box, the cone still draws", () => {
    const big = draw(<ForecastCone data={HIST} forecast={FC} width={240} height={32} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(<ForecastCone data={HIST} forecast={FC} width={48} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
