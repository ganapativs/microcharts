import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CyclePlot } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

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
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBe(7); // slot lines
  });

  it("trend='none' → spine only, no slot lines", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} trend="none" />);
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBe(0);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("spine={false} → no spine, slot lines remain", () => {
    const { container } = draw(<CyclePlot data={WEEKS} period={7} spine={false} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).toBeNull();
    expect(container.querySelectorAll('path[data-mc-ink="ghost"]').length).toBe(7);
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
});
