import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { VolumeProfile, volumeProfileSummary } from "./index.js";
import { volumeProfileGeometry } from "./geometry.js";
import { EN_VOLUME_PROFILE } from "../../core/strings-volume-profile.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const PROFILE = [
  { level: 138, weight: 8 },
  { level: 140, weight: 14 },
  { level: 142, weight: 25 },
  { level: 144, weight: 13 },
  { level: 146, weight: 7 },
];

describe("<VolumeProfile>", () => {
  it("renders bars + POC accent summary", () => {
    const { container } = draw(<VolumeProfile data={PROFILE} bins={5} width={80} height={40} />);
    expect(container.querySelector('path[data-mc-ink="bar"]')).not.toBeNull();
    // POC must be a filled rect — path[data-mc-ink=accent] is stroke-only in CSS.
    expect(container.querySelector('rect[data-mc-ink="accent"]')).not.toBeNull();
    expect(container.querySelector('path[data-mc-ink="accent"]')).toBeNull();
    const geo = volumeProfileGeometry({
      data: PROFILE,
      bins: 5,
      valueArea: 0.7,
      align: "left",
      width: 80,
      height: 40,
      gutter: 12,
    });
    expect(volumeProfileSummary(geo, 0.7, EN_VOLUME_PROFILE, fmt)).toBe(
      "Activity concentrates at 142 (POC); 70% within 140.4–143.6.",
    );
  });

  it("POC label renders the modal level", () => {
    const { container } = draw(<VolumeProfile data={PROFILE} bins={5} width={80} height={40} />);
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(true);
  });

  it("even distribution → evenly-spread summary", () => {
    const flat = Array.from({ length: 6 }, (_, i) => ({ level: 100 + i * 2, weight: 10 }));
    const geo = volumeProfileGeometry({
      data: flat,
      bins: 6,
      valueArea: 0.7,
      align: "left",
      width: 48,
      height: 32,
      gutter: 0,
    });
    expect(volumeProfileSummary(geo, 0.7, EN_VOLUME_PROFILE, fmt)).toBe(
      "Activity is evenly spread.",
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <VolumeProfile data={PROFILE} bins={5} title="Volume by price" width={80} height={40} />,
    );
    await expectNoA11yViolations(container);
  });
});

// Hostile CONFIG — the props a host computes rather than types by hand. Each
// case rendered a chart that looked fine and announced something that was not
// the scale it painted.
describe("VolumeProfile hostile config", () => {
  /** Every numeric attribute the chart emitted, so NaN can't hide in one. */
  const attrs = (el: Element): string[] =>
    [...el.querySelectorAll("*")].flatMap((n) => [...n.attributes].map((a) => a.value));

  it("a non-fraction valueArea never reaches the accessible name", () => {
    // `Number("")` → NaN walked no bins outward and still announced
    // "NaN% within 142–142": the announced convention was not the shaded band.
    for (const bad of [NaN, Infinity, -1, 95] as const) {
      const { container } = draw(<VolumeProfile data={PROFILE} bins={5} valueArea={bad} />);
      expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
        "Activity concentrates at 142 (POC); 70% within 140.4–143.6.",
      );
    }
  });

  it("an unbounded or non-finite bins renders a bounded chart", () => {
    // bins={Infinity} threw `Invalid array length`; bins={NaN} announced
    // "No data." over five real observations.
    const huge = draw(<VolumeProfile data={PROFILE} bins={Infinity} />).container;
    expect(huge.querySelector('path[data-mc-ink="bar"]')).not.toBeNull();
    const nan = draw(<VolumeProfile data={PROFILE} bins={NaN} />).container;
    expect(nan.querySelector("svg")!.getAttribute("aria-label")).not.toBe("No data.");
  });

  it("a non-finite width/height paints in the default box, never NaN coords", () => {
    for (const box of [{ width: NaN }, { height: NaN }, { height: Infinity }] as const) {
      const { container } = draw(<VolumeProfile data={PROFILE} bins={5} {...box} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 48 32");
      expect(attrs(svg).filter((v) => /NaN|Infinity/.test(v))).toEqual([]);
    }
  });
});

seriesEdgeSuite("VolumeProfile", (data: readonly Value[]) => (
  <VolumeProfile data={data as readonly number[]} title="Edge" width={48} height={32} />
));

// Degradation contract (tests/craft/floor.mjs): a label the box can no longer
// seat is DROPPED — never painted outside the viewBox, never stacked on a
// neighbour — the reserved gutter goes with it, and the mark still renders.
describe("VolumeProfile degradation", () => {
  it("the POC price drops once its gutter would eat half the box, the bars still draw", () => {
    const big = draw(<VolumeProfile data={PROFILE} bins={5} width={120} height={80} />).container;
    expect(big.querySelector("text")).not.toBeNull();

    const small = draw(<VolumeProfile data={PROFILE} bins={5} width={24} height={16} />).container;
    expect(small.querySelector("text")).toBeNull();
    expect(small.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
