import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CyclePlot } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);

describe("<CyclePlot>", () => {
  it("summary names peak, dip, and the leading drift — the real string", () => {
    const { container } = draw(
      <CyclePlot data={WEEKS} period={7} slots={DAYS} cycleUnit="weeks" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Peaks Fri (61), dips Sun (38); Mon rising across 6 weeks.",
    );
  });

  it("drops the drift clause when no slot drift leads", () => {
    // flat slots → no drift
    const flat = [10, 20, 30, 10, 20, 30, 10, 20, 30];
    const { container } = draw(<CyclePlot data={flat} period={3} slots={["A", "B", "C"]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Peaks C (30), dips A (10).",
    );
  });

  it("renders a spine, slot ticks, and within-slot lines", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull(); // spine
    expect(container.querySelectorAll("circle").length).toBe(7); // one tick per slot
    // The slot lines are one node carrying seven subpaths — identical paint, so
    // seven <path> siblings were seven nodes saying the same thing.
    const ghosts = container.querySelectorAll('path[data-mc-ink="ghost"]');
    expect(ghosts.length).toBe(1);
    expect(ghosts[0]!.getAttribute("d")!.match(/M/g)!.length).toBe(7);
  });

  it("keeps each slot's subpath inside its own column after the merge", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} width={84} height={20} />);
    const d = container.querySelector('path[data-mc-ink="ghost"]')!.getAttribute("d")!;
    // Subpaths must stay in slot order and never span a boundary: every x in
    // subpath i sits left of every x in subpath i+1.
    const runs = d
      .split("M")
      .filter(Boolean)
      .map((run) => [...run.matchAll(/(\d+\.?\d*) \d+\.?\d*/g)].map((m) => Number(m[1])));
    expect(runs.length).toBe(7);
    for (let i = 1; i < runs.length; i++) {
      expect(Math.min(...runs[i]!)).toBeGreaterThan(Math.max(...runs[i - 1]!));
    }
  });

  it("trend={false} → spine only, no slot lines", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} trend={false} />);
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBe(0);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("spine={false} → no spine, slot lines remain", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} spine={false} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).toBeNull();
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  it("a domain that is not a scale still paints the shape it announces", () => {
    // `[NaN, NaN]` is what a host gets from Math.min/max over a series holding a
    // null. It used to flatten every mark onto the midline while the summary
    // kept announcing the real peak and dip.
    const { container } = draw(
      <CyclePlot data={WEEKS} period={7} slots={DAYS} domain={[NaN, 5]} />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe(
      "Peaks Fri (61), dips Sun (38); Mon rising across 6 cycles.",
    );
    const ys = [...container.querySelectorAll("circle")].map((c) => Number(c.getAttribute("cy")));
    expect(new Set(ys).size).toBeGreaterThan(1); // not one flat rule
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
  });

  it("no in-chart text by default (labels feed summaries)", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} slots={DAYS} />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <CyclePlot data={WEEKS} period={7} slots={DAYS} title="Weekly shape" />,
    );
    await expectNoA11yViolations(container);
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    expectHostsAnnotations(
      (children) => (
        <CyclePlot data={WEEKS} period={7} slots={DAYS} width={80} height={20} summary={false}>
          {children}
        </CyclePlot>
      ),
      80,
      20,
    );
  });
});
