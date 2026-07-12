import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Seismogram } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

describe("<Seismogram>", () => {
  it("renders tick paths; summary is the docs' real string", () => {
    const data = [0, 3, 0, 0, 8, 1, 0, 2];
    const { container } = draw(<Seismogram data={data} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("4 events, peak 8.");
  });

  it("all-zero → designed quiet strip + 'No events.'", () => {
    const { container } = draw(<Seismogram data={[0, 0, 0, 0]} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No events.");
  });

  it("signed data → midline hairline + polarity coloring with positive set", () => {
    const { container } = draw(<Seismogram data={[4, -2, 3]} positive="up" />);
    expect(container.querySelector('[data-mc-ink="muted"]')).not.toBeNull();
    const paths = [...container.querySelectorAll('path[data-mc-ink="data"]')];
    expect(paths.length).toBe(2);
    const strokes = paths.map((p) => (p as SVGElement).style.stroke);
    expect(strokes).toContain("var(--mc-positive)");
    expect(strokes).toContain("var(--mc-negative)");
  });

  it("unsigned data → centered ticks, no midline (implied axis)", () => {
    const { container } = draw(<Seismogram data={[1, 0, 8, 0, 3]} />);
    expect(container.querySelector('[data-mc-ink="muted"]')).toBeNull();
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("anomaly → spikes flare in the alert token", () => {
    const { container } = draw(<Seismogram data={[2, 9, 3, 12]} anomaly={8} />);
    const strokes = [...container.querySelectorAll('path[data-mc-ink="data"]')].map(
      (p) => (p as SVGElement).style.stroke,
    );
    expect(strokes).toContain("var(--mc-negative)"); // flagged path
    expect(strokes.filter((s) => !s).length).toBeGreaterThan(0); // normal path (token default)
  });

  it("summary computed from RAW values even when downsampled", () => {
    // 500 slots, exactly 100 events, peak 42 — bucketing must not change the words
    const data = Array.from({ length: 500 }, (_, i) => (i % 5 === 0 ? (i === 250 ? 42 : 3) : 0));
    const { container } = draw(<Seismogram data={data} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("100 events, peak 42.");
  });

  it("node budget ≤ 2 for unsigned data (one path)", () => {
    const { container } = draw(<Seismogram data={[1, 0, 3, 0, 2]} />);
    expect(container.querySelectorAll("svg *").length).toBeLessThanOrEqual(2);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Seismogram data={[0, 3, 8, 0]} title="Error bursts" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Seismogram", (data) => <Seismogram data={data} title="Edge" />);
