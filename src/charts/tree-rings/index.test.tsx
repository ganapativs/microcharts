import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TreeRings } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const YEARS = [8, 12, 10, 18, 22, 15, 20, 14];

describe("<TreeRings>", () => {
  it("summary names the latest and biggest period", () => {
    const { container } = draw(<TreeRings data={YEARS} unit="years" periodWord="year" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "8 years; latest 14, biggest 22 in year 5.",
    );
  });

  it("renders one boundary ring per period + the centre dot, merged into one path", () => {
    const { container } = draw(<TreeRings data={YEARS} />);
    // 7 non-highlighted boundaries merge into one muted path (SSR hot path)...
    const rings = container.querySelector('path[data-mc-ink="muted"]')!;
    expect((rings.getAttribute("d")!.match(/M/g) ?? []).length).toBe(7);
    // ...leaving 2 circles: the highlighted (last) ring + the centre dot.
    expect(container.querySelectorAll("circle").length).toBe(2);
  });

  it("highlight='last' emphasizes the outermost ring (weight, not color-alone)", () => {
    const { container } = draw(<TreeRings data={YEARS} />);
    const accent = [...container.querySelectorAll("circle")].find((c) =>
      (c.getAttribute("style") ?? "").includes("1.5"),
    );
    expect(accent).toBeTruthy();
  });

  it("rings='fill' draws annulus paths", () => {
    const { container } = draw(<TreeRings data={YEARS} rings="fill" />);
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("label='last' prints the latest value", () => {
    const { container } = draw(<TreeRings data={YEARS} label="last" />);
    expect(container.querySelector("text")!.textContent).toBe("14");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<TreeRings data={YEARS} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<TreeRings data={YEARS} title="Account age" />);
    await expectNoA11yViolations(container);
  });
});
