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

describe("<RugStrip> (plan/22 #5, S1 distribution)", () => {
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

  it("is axe-clean", async () => {
    const { container } = draw(<RugStrip data={[3, 5, 8]} title="Salaries" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("RugStrip", (data) => <RugStrip data={data} title="Edge" markValue={5} />);
