import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PhaseTrace, phaseTraceSummary } from "./index.js";
import { phaseTraceGeometry } from "./geometry.js";
import { EN_PHASE_TRACE } from "../../core/strings-phase-trace.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

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

describe("<PhaseTrace> (plan/25 §17, plan/17 F16)", () => {
  it("renders trail + tail + endpoint; docs-as-tests summary with named axes", () => {
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

  it("is axe-clean", async () => {
    const { container } = draw(
      <PhaseTrace data={TRAJ} xLabel="CPU" yLabel="Latency" title="Phase portrait" />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("PhaseTrace", (data: readonly Value[]) => (
  <PhaseTrace
    data={data.map((v, i) => ({ x: i, y: typeof v === "number" ? v : 0 }))}
    xLabel="i"
    yLabel="v"
    title="Edge"
  />
));
