import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { RateVolume } from "./index.js";
import type { RateVolumePoint } from "./geometry.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE: RateVolumePoint[] = [
  { rate: 2.3, volume: 120 },
  { rate: 3.1, volume: 90 },
  { rate: 2.8, volume: 140 },
  { rate: 4.1, volume: 38 },
];

describe("<RateVolume>", () => {
  it("summary always pairs rate with volume — the real string", () => {
    const { container } = draw(<RateVolume data={SAMPLE} minVolume={50} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "4.1 on 38 events (low volume); up from 2.3 across 4 periods.",
    );
  });

  it("one ghost bar per period + a rate line", () => {
    const { container } = draw(<RateVolume data={SAMPLE} />);
    expect(container.querySelectorAll('[data-mc-ink="ghost"]').length).toBe(4);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
  });

  it("minVolume renders low-denominator marks hollow (shape, not color)", () => {
    const { container } = draw(<RateVolume data={SAMPLE} minVolume={50} dots="none" />);
    // period 3 (vol 38) is the only hollow ring. The surface fill is inline —
    // as an attribute it would lose to the ring's ink role, and that role is
    // what puts the ring in the data-change transition.
    const rings = [...container.querySelectorAll("circle")].filter((c) =>
      c.getAttribute("style")?.includes("var(--mc-surface)"),
    );
    expect(rings.length).toBe(1);
  });

  it("label='last' states the endpoint rate; 'none' shows no text", () => {
    const labeled = draw(<RateVolume data={SAMPLE} />).container;
    const none = draw(<RateVolume data={SAMPLE} label="none" />).container;
    expect(labeled.querySelector("text")!.textContent).toBe("4.1");
    expect(none.querySelector("text")).toBeNull();
  });

  it("a zero-volume period breaks the line (no rate on no events)", () => {
    const data: RateVolumePoint[] = [
      { rate: 2, volume: 100 },
      { rate: 9, volume: 0 },
      { rate: 3, volume: 80 },
    ];
    const { container } = draw(<RateVolume data={data} />);
    const d = container.querySelector('path[data-mc-ink="data"]')!.getAttribute("d")!;
    expect(d.match(/M/g)).toHaveLength(2); // gapped into two subpaths
  });

  it("percent format flows through to the summary", () => {
    const pct: RateVolumePoint[] = Array.from({ length: 12 }, (_, i) => ({
      rate: [2.3, 2.4, 2.6, 2.9, 3, 3.3, 3.5, 3.6, 3.8, 3.9, 4, 4.1][i]!,
      volume: [200, 190, 180, 170, 160, 150, 140, 120, 100, 80, 60, 38][i]!,
    }));
    const { container } = draw(
      <RateVolume
        data={pct}
        minVolume={50}
        format={{ style: "percent", maximumFractionDigits: 1 }}
      />,
    );
    // rates are fractions here so percent formatting reads them as-is × 100
    const label = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(label).toContain("on 38 events (low volume)");
    expect(label).toContain("across 12 periods");
  });

  it("the endpoint readout leaves tabular-nums to styles.css", () => {
    const { container } = draw(<RateVolume data={SAMPLE} />);
    // inline paint would outrank the `:where()` rules the theming contract
    // hands consumers, and styles.css already sets it on `.mc-root text`
    expect(container.querySelector("text")!.style.fontVariantNumeric).toBe("");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<RateVolume data={SAMPLE} title="Conversion rate" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("RateVolume", (data) => (
  <RateVolume data={data.map((v) => ({ rate: v as number, volume: 100 }))} title="Edge" />
));

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("RateVolume degradation", () => {
  it("the rate readout drops under a 7-unit box, the line still draws", () => {
    const big = draw(<RateVolume data={SAMPLE} minVolume={50} width={240} height={32} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(<RateVolume data={SAMPLE} minVolume={50} width={48} height={6} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
