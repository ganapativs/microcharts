import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PairedBars } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const DATA = [
  { label: "East", value: 940, ref: 1200 },
  { label: "West", value: 410, ref: 400 },
  { label: "South", value: 620, ref: 600 },
  { label: "North", value: 120, ref: 300 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<PairedBars>", () => {
  it("value + muted ref per pair; summary leads with the largest gap", () => {
    const { container } = draw(<PairedBars data={DATA} />);
    expect(container.querySelectorAll("rect").length).toBe(8);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4 pairs. Largest gap East: 940 vs 1,200.",
    );
  });

  it("null ref → value bar alone; announced summary skips it in gap ranking", () => {
    const { container } = draw(
      <PairedBars
        data={[
          { label: "a", value: 5, ref: null },
          { label: "b", value: 4, ref: 6 },
        ]}
      />,
    );
    expect(container.querySelectorAll("rect").length).toBe(3);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "1 pair. Largest gap b: 4 vs 6.",
    );
  });

  it("all refs missing → dev warning steering to MiniBar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<PairedBars data={[{ label: "a", value: 5, ref: null }]} />);
    expect(warn).toHaveBeenCalled();
  });

  it("positive tints the value bar by over/under reference", () => {
    const { container } = draw(<PairedBars data={DATA.slice(0, 2)} positive="up" />);
    const inks = [...container.querySelectorAll("[data-mc-ink]")].map((el) =>
      el.getAttribute("data-mc-ink"),
    );
    expect(inks).toContain("negative"); // East under ref
    expect(inks).toContain("positive"); // West over ref
  });

  it("overlay halves the footprint: ghost behind the value bar", () => {
    const { container } = draw(<PairedBars data={DATA.slice(0, 2)} mode="overlay" />);
    const rects = [...container.querySelectorAll("rect")];
    expect(rects.length).toBe(4);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PairedBars data={DATA} title="Budget vs actual" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("PairedBars", (data) => (
  <PairedBars
    data={data.map((v, i) => ({ label: `c${i}`, value: v, ref: (v ?? 0) * 1.1 }))}
    title="Edge"
  />
));
