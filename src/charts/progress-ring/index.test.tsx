import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ProgressRing } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<ProgressRing>", () => {
  it("track + value arc; summary reuses the progress wording", () => {
    const { container } = draw(<ProgressRing value={0.68} />);
    expect(container.querySelectorAll("path").length).toBe(2);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("68% complete.");
  });

  it("sweep mode: remaining wedge + remaining wording", () => {
    const { container } = draw(<ProgressRing value={0.68} sweep />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("32% remaining.");
  });

  it("label='percent' centers the figure", () => {
    const { container } = draw(<ProgressRing value={0.68} label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("68%");
    expect(container.querySelector("text")!.getAttribute("text-anchor")).toBe("middle");
  });

  it("3-digit percent (100%) still clears the inner ring", () => {
    const { container } = draw(<ProgressRing value={1} label="percent" size={32} weight={3} />);
    const text = container.querySelector("text")!;
    expect(text.textContent).toBe("100%");
    const fs = Number(text.getAttribute("font-size"));
    const rInner = 32 / 2 - 0.5 - 3;
    expect((4 * fs * 0.62) / 2).toBeLessThanOrEqual(rInner - 1);
  });

  it("overflow: ring clamps, label tells the truth", () => {
    const { container } = draw(<ProgressRing value={1.12} label="percent" size={32} />);
    expect(container.querySelector("text")!.textContent).toBe("112%");
  });

  it("icon-sized ring drops a 3-digit label instead of colliding", () => {
    const { container } = draw(<ProgressRing value={1} label="percent" size={16} weight={3} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelectorAll("path").length).toBeGreaterThanOrEqual(1);
  });

  it("max <= 0 → track only + 'No data.'", () => {
    const { container } = draw(<ProgressRing value={5} max={0} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("node budget ≤ 3", () => {
    const { container } = draw(<ProgressRing value={0.4} label="percent" />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(3);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ProgressRing value={0.68} title="Sync" />);
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("ProgressRing", (value) => (
  <ProgressRing value={value} title="Edge" label="percent" />
));
