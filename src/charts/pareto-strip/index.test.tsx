import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ParetoStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Auth", value: 4 },
  { label: "Disk", value: 3 },
  { label: "DNS", value: 3 },
  { label: "Other bug", value: 2 },
];

describe("<ParetoStrip>", () => {
  it("summary states the vital-few count and cumulative — the real string", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} unit="causes" metric="incidents" />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Top 4 of 9 causes account for 82% of incidents.",
    );
  });

  it("threshold=false → 'top leads at'", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} threshold={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toMatch(
      /^Timeouts leads at \d+%\.$/,
    );
  });

  it("zero total → 'No recorded'", () => {
    const { container } = draw(
      <ParetoStrip data={[{ label: "a", value: 0 }]} metric="incidents" />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "No recorded incidents.",
    );
  });

  it("descending bars + a cumulative line + threshold hairline", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} width={160} />);
    const bars = container.querySelectorAll("rect");
    expect(bars.length).toBeGreaterThan(2);
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull(); // cum line
    expect(container.querySelectorAll("line").length).toBe(1); // threshold
  });

  it("vital bars (accent) stop at the crossing; the rest are muted", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} threshold={80} width={200} />);
    const bars = [...container.querySelectorAll("rect")];
    const accent = bars.filter((b) => b.getAttribute("data-mc-ink") === "accent");
    // top few are accent, and they are the leftmost (a prefix)
    expect(accent.length).toBeGreaterThan(0);
    expect(accent.length).toBeLessThan(bars.length);
  });

  it("maxItems rolls the tail into Other (rendered, last)", () => {
    const { container } = draw(<ParetoStrip data={CAUSES} maxItems={3} width={160} />);
    // 3 head bars + Other = 4 bars
    expect(container.querySelectorAll("rect").length).toBe(4);
  });

  it("label='count' states 'K of N → cum%'; 'none' hides it", () => {
    const labeled = draw(<ParetoStrip data={CAUSES} width={160} />).container;
    const none = draw(<ParetoStrip data={CAUSES} label="none" width={160} />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("4 of 9 → 82%");
    expect(none.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ParetoStrip data={CAUSES} title="Incident causes" />);
    await expectNoA11yViolations(container);
  });
});

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("ParetoStrip degradation", () => {
  it("the vital-few readout drops under a 7-unit box, the bars still draw", () => {
    const big = draw(
      <ParetoStrip data={CAUSES} unit="causes" metric="incidents" width={240} height={32} />,
    ).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(
      <ParetoStrip data={CAUSES} unit="causes" metric="incidents" width={48} height={6} />,
    ).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("rect").length).toBeGreaterThan(0);
  });
});
