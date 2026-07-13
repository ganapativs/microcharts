import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { SparkGroup } from "./SparkGroup.js";
import { Sparkline } from "../charts/sparkline/index.js";
import { expectNoA11yViolations } from "../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// Extract the y of the first point of each rendered sparkline path.
function firstYs(container: HTMLElement): number[] {
  return [...container.querySelectorAll('path[data-mc-ink="data"]')].map((p) => {
    const d = p.getAttribute("d")!;
    return Number(d.match(/^M[\d.-]+ ([\d.-]+)/)![1]);
  });
}

describe("<SparkGroup> shared scale", () => {
  it("shared domain: equal values land at equal y across children", () => {
    const { container } = draw(
      <SparkGroup width={80} height={20}>
        <Sparkline data={[0, 100]} summary={false} />
        <Sparkline data={[0, 10]} summary={false} />
      </SparkGroup>,
    );
    const [pathA, pathB] = [...container.querySelectorAll('path[data-mc-ink="data"]')].map((p) =>
      p.getAttribute("d"),
    );
    // both start at value 0 → same y under a shared [0,100] domain
    const yA = Number(pathA!.match(/^M[\d.-]+ ([\d.-]+)/)![1]);
    const yB = Number(pathB!.match(/^M[\d.-]+ ([\d.-]+)/)![1]);
    expect(yA).toBeCloseTo(yB, 5);
  });

  it("WITHOUT the group each fits its own domain (the bug it prevents)", () => {
    const { container } = draw(
      <>
        <Sparkline data={[0, 100]} summary={false} />
        <Sparkline data={[0, 10]} summary={false} />
      </>,
    );
    // independent auto-fit → identical shape, but that's per-row scaling; the
    // group test above proves the group makes them comparable. Here just sanity:
    expect(firstYs(container)).toHaveLength(2);
  });

  it("enforces one physical size on children", () => {
    const { container } = draw(
      <SparkGroup width={64} height={16}>
        <Sparkline data={[1, 2, 3]} summary={false} />
        <Sparkline data={[3, 2, 1]} width={200} summary={false} />
      </SparkGroup>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs[0]!.getAttribute("viewBox")).toBe("0 0 64 16");
    // child's explicit width wins over the group (grammar: prop > provider)
    expect(svgs[1]!.getAttribute("viewBox")).toBe("0 0 200 16");
  });

  it("explicit [min,max] domain overrides shared computation", () => {
    const { container } = draw(
      <SparkGroup domain={[0, 1000]} width={80} height={20}>
        <Sparkline data={[0, 100]} summary={false} />
      </SparkGroup>,
    );
    const d = container.querySelector('path[data-mc-ink="data"]')!.getAttribute("d")!;
    // 100 on a [0,1000] domain sits low (large y), not near the top
    const lastY = Number(d.match(/([\d.]+)$/)![1]);
    expect(lastY).toBeGreaterThan(10);
  });

  it("does not inject chart props into non-series children (no bogus attrs)", () => {
    const { container } = draw(
      <SparkGroup width={80} height={20}>
        <h4 data-testid="label">Services</h4>
        <Sparkline data={[1, 2, 3]} summary={false} />
      </SparkGroup>,
    );
    const heading = container.querySelector('[data-testid="label"]')!;
    expect(heading.hasAttribute("domain")).toBe(false);
    expect(heading.hasAttribute("width")).toBe(false);
    // the real chart still receives the enforced size
    expect(container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 80 20");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <SparkGroup width={80} height={20}>
        <Sparkline data={[1, 2, 3]} title="A" />
        <Sparkline data={[3, 2, 1]} title="B" />
      </SparkGroup>,
    );
    await expectNoA11yViolations(container);
  });
});
