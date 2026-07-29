import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Honeycomb } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Honeycomb>", () => {
  it("summary is the real string with the unit", () => {
    const { container } = draw(<Honeycomb value={34} total={40} unit="seats" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "34 of 40 seats filled.",
    );
  });

  it("renders exactly two paths (filled + empty)", () => {
    const { container } = draw(<Honeycomb value={6} total={12} />);
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("value > total → all filled, but the summary keeps the true value", () => {
    const { container } = draw(<Honeycomb value={45} total={40} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("45 of 40 filled.");
    // all filled → no empty path
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("empty='blank' draws nothing for the empty cells (GardenGrid's pattern)", () => {
    const { container } = draw(<Honeycomb value={6} total={12} empty="blank" />);
    // only the filled path remains — no empty-cell path at all
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("total 0 → 'No data.'", () => {
    const { container } = draw(<Honeycomb value={5} total={0} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it from assistive tech", () => {
    const { container } = draw(<Honeycomb value={6} total={12} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  // A host computes these: `total={Number(field.value)}` on an empty field is
  // NaN, `total={seats / perFloor}` at perFloor 0 is Infinity. Both used to paint
  // an ordinary comb while the accessible name said "5 of NaN filled."
  it.each([
    ["NaN total", Number.NaN, "5 of 10 filled.", "5/10"],
    ["Infinite total", Number.POSITIVE_INFINITY, "5 of 10 filled.", "5/10"],
  ])("%s falls back to the default capacity in name AND label", (_n, total, name, text) => {
    const { container } = draw(<Honeycomb value={5} total={total} label="count" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe(name);
    expect(svg.querySelector("text")!.textContent).toBe(text);
    expect(svg.getAttribute("viewBox")).not.toMatch(/NaN|Infinity/);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it.each([
    ["NaN", Number.NaN],
    ["Infinite", Number.POSITIVE_INFINITY],
  ])("a %s value is no count — announced and painted as none", (_n, value) => {
    const { container } = draw(<Honeycomb value={value} total={12} label="count" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("0 of 12 filled.");
    expect(svg.querySelector("text")!.textContent).toBe("0/12");
    // nothing filled → only the empty path
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it.each([
    ["rows", { rows: Number.NaN }],
    ["cell", { cell: Number.NaN }],
    ["negative cell", { cell: -4 }],
  ])("a hostile %s prop never reaches the markup", (_n, hostile) => {
    const { container } = draw(<Honeycomb value={5} total={12} {...hostile} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Honeycomb value={34} total={40} unit="seats" title="Occupancy" />);
    await expectNoA11yViolations(container);
  });
});
