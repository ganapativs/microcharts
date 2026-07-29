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
    // Valence is an ink ROLE, never an inline stroke: `.mc-root` sets
    // forced-color-adjust: none, so inline paint survives into High Contrast
    // Mode and outranks every `:where()` consumer override.
    for (const ink of ["positive", "negative"]) {
      const p = container.querySelector(`path[data-mc-ink="${ink}"]`) as SVGPathElement;
      expect(p).not.toBeNull();
      // literal fill="none" is the opt-in the stroked-valence rule selects on
      expect(p.getAttribute("fill")).toBe("none");
      expect(p.style.stroke).toBe("");
    }
  });

  it("positive='down' flips which polarity carries which valence", () => {
    // slots are 30 wide, so the up tick sits at x=15 and the down tick at x=45
    const { container } = draw(<Seismogram data={[4, -2]} positive="down" width={60} />);
    const d = (ink: string) =>
      container.querySelector(`path[data-mc-ink="${ink}"]`)!.getAttribute("d");
    expect(d("positive")).toMatch(/^M45 /); // down is good here
    expect(d("negative")).toMatch(/^M15 /);
  });

  it("unsigned data → centered ticks, no midline (implied axis)", () => {
    const { container } = draw(<Seismogram data={[1, 0, 8, 0, 3]} />);
    expect(container.querySelector('[data-mc-ink="muted"]')).toBeNull();
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("anomaly → spikes flare in the alert token", () => {
    const { container } = draw(<Seismogram data={[2, 9, 3, 12]} anomaly={8} />);
    const flag = container.querySelector('path[data-mc-ink="negative"]') as SVGPathElement;
    expect(flag).not.toBeNull();
    expect(flag.getAttribute("fill")).toBe("none");
    expect(flag.style.stroke).toBe(""); // token comes from the role, never inline
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull(); // 2 and 3
  });

  it("summary computed from RAW values even when downsampled", () => {
    // 500 slots, exactly 100 events, peak 42 — bucketing must not change the words
    const data = Array.from({ length: 500 }, (_, i) => (i % 5 === 0 ? (i === 250 ? 42 : 3) : 0));
    const { container } = draw(<Seismogram data={data} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("100 events, peak 42.");
  });

  it("a non-finite box paints inside a real frame, seat included", () => {
    // `Chart` clamps the viewBox, so the frame looked fine while the ticks and
    // `--mc-seat` were NaN — a chart that vanished under a correct-sounding name.
    for (const box of [{ width: NaN }, { height: NaN }, { height: Infinity }, { width: -60 }]) {
      const { container } = draw(<Seismogram data={[0, 3, 0, 8]} {...box} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("style") ?? "").not.toMatch(/NaN|Infinity/);
      for (const p of container.querySelectorAll("path")) {
        expect(p.getAttribute("d")).not.toMatch(/NaN|Infinity|-\d/);
      }
    }
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
