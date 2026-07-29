import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PhaseTrace, phaseTraceSummary } from "./index.js";
import { phaseTraceGeometry } from "./geometry.js";
import { EN_PHASE_TRACE } from "../../core/strings-phase-trace.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const TRAJ = [
  { x: 30, y: 80 },
  { x: 35, y: 85 },
  { x: 42, y: 95 },
  { x: 50, y: 105 },
  { x: 55, y: 115 },
  { x: 58, y: 122 },
  { x: 62, y: 130 },
];

afterEach(() => vi.restoreAllMocks());

describe("<PhaseTrace>", () => {
  it("renders trail + tail + endpoint summary with named axes", () => {
    const { container } = draw(<PhaseTrace data={TRAJ} xLabel="CPU" yLabel="Latency" />);
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull();
    expect(container.querySelector('path[stroke="var(--mc-accent)"]')).not.toBeNull();
    const geo = phaseTraceGeometry({
      data: TRAJ,
      xDomain: [30, 62],
      yDomain: [80, 130],
      tail: 0.25,
      width: 40,
      height: 32,
    });
    expect(phaseTraceSummary(TRAJ, "CPU", "Latency", geo.heading, EN_PHASE_TRACE, fmt)).toBe(
      "Latency vs CPU: now 62, 130; heading up-right.",
    );
  });

  it("warns when a title is set but axes are unnamed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<PhaseTrace data={TRAJ} title="Phase" />);
    expect(warn).toHaveBeenCalled();
  });

  it("grid draws quadrant hairlines; startDot anchors the origin", () => {
    const { container } = draw(
      <PhaseTrace data={TRAJ} grid startDot xLabel="CPU" yLabel="Latency" />,
    );
    expect(container.querySelectorAll("circle").length).toBeGreaterThanOrEqual(2); // start + end
  });

  it("paints through ink roles, so forced colors can remap every mark", () => {
    const { container } = draw(
      <PhaseTrace data={TRAJ} grid startDot xLabel="CPU" yLabel="Latency" />,
    );
    // The quadrant cross and the "now" dot used to carry --mc-* paint with no
    // role at all, and the start dot overrode its role with an inline fill —
    // all three survive verbatim under `forced-color-adjust: none`.
    const gridLine = container.querySelector('path[data-mc-w="hair"]');
    expect(gridLine?.getAttribute("data-mc-ink")).toBe("muted");
    expect(gridLine?.getAttribute("stroke")).toBeNull();
    const start = container.querySelector('circle[data-mc-ink="neutral"]');
    expect(start?.getAttribute("style")).toBeNull();
    expect(container.querySelector('circle[data-mc-ink="flag"]')).not.toBeNull();
    // The trail's width is the "full" role, not an inline stroke-width a
    // consumer stylesheet could never override.
    const trail = container.querySelector('path[data-mc-ink="muted"][data-mc-w="full"]');
    expect(trail?.getAttribute("style")).toBeNull();
  });

  // Hostile CONFIG props: the announced scale and the painted scale have to be
  // the same scale. Each of these once rendered a normal-sounding aria-label
  // over NaN coordinates (or, for tail, a rising trace announced as "steady").
  describe("hostile config props", () => {
    const HOSTILE = [
      ["xDomain NaN", { xDomain: [NaN, NaN] }],
      ["xDomain half-NaN", { xDomain: [0, NaN] }],
      ["domain infinite", { domain: [-Infinity, Infinity] }],
      ["domain zero-span", { domain: [5, 5] }],
      ["tail NaN", { tail: NaN }],
      ["width NaN", { width: NaN }],
      ["height 0", { height: 0 }],
      ["width negative", { width: -10 }],
    ] as const;

    for (const [label, props] of HOSTILE) {
      it(`${label} → no non-finite reaches markup`, () => {
        const { container } = draw(
          <PhaseTrace data={TRAJ} grid startDot xLabel="CPU" yLabel="Latency" {...props} />,
        );
        for (const el of container.querySelectorAll("*"))
          for (const attr of el.attributes)
            expect(attr.value, `<${el.tagName} ${attr.name}>`).not.toMatch(/NaN|Infinity/);
      });
    }

    it("a rejected tail still splits the trail from the accent tail it announces", () => {
      const { container } = draw(
        <PhaseTrace data={TRAJ} tail={NaN} xLabel="CPU" yLabel="Latency" />,
      );
      expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull();
      expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
        "Latency vs CPU: now 62, 130; heading up-right.",
      );
    });

    it("a rejected box keeps the viewBox and the marks on one scale", () => {
      const { container } = draw(<PhaseTrace data={TRAJ} width={NaN} xLabel="x" yLabel="y" />);
      expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 40 32");
    });
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <PhaseTrace data={TRAJ} xLabel="CPU" yLabel="Latency" title="Phase portrait" />,
    );
    await expectNoA11yViolations(container);
  });
});

// BOTH coordinates are encoded, so the matrix runs once per coordinate. The
// previous spelling pinned `x: i` and laundered `y` to 0, so a sample with no
// reading was drawn as a real point at zero and a non-finite `x` never reached
// the path at all.
//
// One suite per field, rather than one suite putting the value on both: with
// both fields degenerate the two halves of the finiteness check mask each other
// (the `y` half discards the row before the `x` half is consulted), and index
// parity would decide which of NaN/±Infinity ever landed on which coordinate.
// Splitting guarantees every matrix value reaches every field. `grid` +
// `startDot` are on so every emitted coordinate meets the matrix.
const phaseTraceCase = (data: readonly { x: number; y: number }[]) => (
  <PhaseTrace data={data} grid startDot xLabel="i" yLabel="v" title="Edge" />
);
mappedEdgeSuite("PhaseTrace (degenerate x)", (v, i) => ({ x: v as number, y: i }), phaseTraceCase);
mappedEdgeSuite("PhaseTrace (degenerate y)", (v, i) => ({ x: i, y: v as number }), phaseTraceCase);
