import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RugStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<RugStrip>", () => {
  it("renders tick tiers; summary is the docs' real string", () => {
    const values = [3.1, 5.2, 9.7, 4.4, 6.8, 5.2];
    const { container } = draw(<RugStrip data={values} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "6 values from 3.1 to 9.7, median 5.2.",
    );
  });

  it("node budget: tiered paths, never one node per tick", () => {
    const values = Array.from({ length: 120 }, (_, i) => (i * 13) % 47);
    const { container } = draw(<RugStrip data={values} />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(4);
  });

  it("markValue renders a full-height accent tick", () => {
    const { container } = draw(<RugStrip data={[1, 5, 9]} markValue={5} />);
    const hl = container.querySelector("line")!;
    expect(hl.getAttribute("data-mc-ink")).toBe("accent");
    expect(Number(hl.getAttribute("y1"))).toBe(0);
    expect(Number(hl.getAttribute("y2"))).toBe(10);
  });

  it("> 400 observations → dev warning steering to histogram-strip", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<RugStrip data={Array.from({ length: 401 }, (_, i) => i)} />);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("vertical orientation swaps default box", () => {
    const { container } = draw(<RugStrip data={[1, 2, 3]} orientation="vertical" />);
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 10 60");
  });

  it("a non-finite or non-positive box never reaches the marks or the seat", () => {
    const boxes = [{ width: Number.NaN }, { height: Number.NaN }, { width: 0 }, { height: -10 }];
    for (const box of boxes)
      for (const orientation of ["horizontal", "vertical"] as const) {
        const { container } = draw(
          <RugStrip data={[3.1, 5.2, 9.7]} markValue={5} orientation={orientation} {...box} />,
        );
        const svg = container.querySelector("svg")!;
        const [, , vbW, vbH] = svg.getAttribute("viewBox")!.split(" ").map(Number);
        expect(svg.outerHTML).not.toMatch(/NaN|Infinity/);
        for (const el of container.querySelectorAll("path, line")) {
          for (const n of (el.getAttribute("d") ?? "").match(/-?[\d.]+/g) ?? [])
            expect(Number(n)).toBeGreaterThanOrEqual(0);
          for (const [a, limit] of [
            ["x1", vbW!],
            ["x2", vbW!],
            ["y1", vbH!],
            ["y2", vbH!],
          ] as const) {
            const v = el.getAttribute(a);
            if (v !== null) expect(Number(v)).toBeLessThanOrEqual(limit);
          }
        }
      }
  });

  it("a reversed domain is a window: ticks stay left-to-right", () => {
    const { container } = draw(<RugStrip data={[2, 8]} domain={[10, 0]} />);
    const xs = [...container.querySelectorAll('path[data-mc-ink="data"]')].flatMap((p) =>
      [...p.getAttribute("d")!.matchAll(/M([\d.]+)/g)].map((m) => Number(m[1])),
    );
    expect(xs).toEqual([12.3, 47.7]);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<RugStrip data={[3, 5, 8]} title="Salaries" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("RugStrip", (data) => <RugStrip data={data} title="Edge" markValue={5} />);
