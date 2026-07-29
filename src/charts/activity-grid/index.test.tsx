import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ActivityGrid, calendarOffset } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const days = Array.from({ length: 35 }, (_, i) => i % 7);

describe("<ActivityGrid>", () => {
  it("renders one cell per value, role=img", () => {
    const { container } = draw(<ActivityGrid data={days} title="Activity" />);
    expect(container.querySelector("svg")!.getAttribute("role")).toBe("img");
    expect(container.querySelectorAll("rect")).toHaveLength(days.length);
  });

  it("cells carry the cell ink + per-level opacity", () => {
    const { container } = draw(<ActivityGrid data={[0, 10]} domain={[0, 10]} />);
    const rects = container.querySelectorAll('rect[data-mc-ink="cell"]');
    expect(rects).toHaveLength(2);
    const o0 = Number(rects[0]!.getAttribute("fill-opacity"));
    const o1 = Number(rects[1]!.getAttribute("fill-opacity"));
    expect(o1).toBeGreaterThan(o0);
  });

  it("summary states total, periods, and the busiest bin", () => {
    const { container } = draw(<ActivityGrid data={[1, 2, 3]} title="A" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "A. Total 6 over 3 periods. Busiest 3.",
    );
  });

  it("strip layout → single row of cells", () => {
    const { container } = draw(<ActivityGrid data={[1, 2, 3, 4]} layout="strip" />);
    const ys = new Set([...container.querySelectorAll("rect")].map((r) => r.getAttribute("y")));
    expect(ys.size).toBe(1);
  });

  it("empty → no cells, 'No activity.'", () => {
    const { container } = draw(<ActivityGrid data={[]} title="e" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("e. No activity.");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ActivityGrid data={days} title="Activity" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ActivityGrid", (data) => <ActivityGrid data={[...data]} title="Edge" />);

describe("<ActivityGrid> hostile config", () => {
  const NUMERIC = ["x", "y", "width", "height", "rx", "fill-opacity"] as const;
  const attrs = (container: HTMLElement) => {
    const svg = container.querySelector("svg")!;
    const out = [svg.getAttribute("viewBox") ?? ""];
    for (const r of container.querySelectorAll("rect"))
      for (const a of NUMERIC) out.push(r.getAttribute(a) ?? "0");
    return out;
  };
  const expectClean = (container: HTMLElement, what: string) =>
    expect(
      attrs(container).filter((v) => /NaN|Infinity/.test(v)),
      `${what} emitted non-finite attributes`,
    ).toEqual([]);

  it("a non-finite steps/cell/gap/weekStart never reaches an attribute", () => {
    for (const bad of [NaN, Infinity]) {
      expectClean(draw(<ActivityGrid data={days} steps={bad} />).container, `steps=${bad}`);
      expectClean(draw(<ActivityGrid data={days} cell={bad} />).container, `cell=${bad}`);
      expectClean(draw(<ActivityGrid data={days} gap={bad} />).container, `gap=${bad}`);
    }
    expectClean(
      draw(<ActivityGrid data={days} anchor="1970-01-01" weekStart={NaN as unknown as 0} />)
        .container,
      "weekStart=NaN",
    );
  });

  // The ramp used the RAW `steps` while the geometry bucketed against a clamped
  // one, so `steps={1}` painted every non-empty cell at full opacity from a
  // two-level bucketing — a level scale the cells were never binned against.
  it("paints the level count the cells were bucketed against", () => {
    const { container } = draw(<ActivityGrid data={[0, 5, 10]} steps={1} domain={[0, 10]} />);
    const ops = [...container.querySelectorAll('rect[data-mc-ink="cell"]')].map((r) =>
      Number(r.getAttribute("fill-opacity")),
    );
    // clamped to 2 levels: the empty track, then one full step
    expect(ops[0]).toBeCloseTo(0.06, 5);
    expect(ops[1]).toBeCloseTo(1, 5);
    expect(ops[2]).toBeCloseTo(1, 5);
  });

  it("a repaired cell/gap still contains every mark in the viewBox", () => {
    for (const props of [{ cell: NaN }, { gap: -20 }, { cell: -5 }]) {
      const { container } = draw(<ActivityGrid data={days} {...props} />);
      const [, , w, h] = container
        .querySelector("svg")!
        .getAttribute("viewBox")!
        .split(" ")
        .map(Number);
      for (const r of container.querySelectorAll("rect")) {
        const n = (a: string) => Number(r.getAttribute(a));
        expect(n("x")).toBeGreaterThanOrEqual(0);
        expect(n("x") + n("width")).toBeLessThanOrEqual(w!);
        expect(n("y") + n("height")).toBeLessThanOrEqual(h!);
      }
    }
  });
});

describe("<ActivityGrid> shape + calendar alignment", () => {
  it("shape defaults to crisp square (rx 1, crispEdges)", () => {
    const { container } = draw(<ActivityGrid data={[1, 2]} />);
    const r = container.querySelector('rect[data-mc-ink="cell"]')!;
    expect(r.getAttribute("rx")).toBe("1");
    expect(r.getAttribute("shape-rendering")).toBe("crispEdges");
  });

  it("shape='round' softens corners and drops crispEdges (never on curves)", () => {
    const { container } = draw(<ActivityGrid data={[1, 2]} shape="round" />);
    const r = container.querySelector('rect[data-mc-ink="cell"]')!;
    expect(Number(r.getAttribute("rx"))).toBeCloseTo(3, 5);
    expect(r.getAttribute("shape-rendering")).toBeNull();
  });

  it("shape='dot' insets the mark and fully rounds it", () => {
    const { container } = draw(<ActivityGrid data={[1, 2]} cell={10} shape="dot" />);
    const r = container.querySelector('rect[data-mc-ink="cell"]')!;
    const size = Number(r.getAttribute("width"));
    expect(size).toBeLessThan(10);
    expect(Number(r.getAttribute("rx"))).toBeCloseTo(size / 2, 5);
    expect(r.getAttribute("shape-rendering")).toBeNull();
  });

  it("anchor pads the first column to the real weekday (1970-01-01 = Thursday)", () => {
    // Monday weekStart → Thursday = 3 leading empty slots
    expect(calendarOffset("1970-01-01", 1)).toBe(3);
    expect(calendarOffset("1970-01-01", 0)).toBe(4);
    expect(calendarOffset(undefined, 1)).toBe(0);
    expect(calendarOffset("not-a-date", 1)).toBe(0);
    const { container } = draw(<ActivityGrid data={[1, 2, 3, 4, 5]} anchor="1970-01-01" />);
    const first = container.querySelector('rect[data-mc-ink="cell"]')!;
    // slot 3 of column 0 → y = 3 * (10 + 2)
    expect(first.getAttribute("y")).toBe("36");
    expect(first.getAttribute("x")).toBe("0");
  });

  it("strip layout ignores anchor (single row has no weekday)", () => {
    const { container } = draw(<ActivityGrid data={[1, 2]} layout="strip" anchor="1970-01-01" />);
    expect(container.querySelector('rect[data-mc-ink="cell"]')!.getAttribute("x")).toBe("0");
  });
});
