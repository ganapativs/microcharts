import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { EventRaster, eventRasterSummary } from "./index.js";
import { EN_EVENT_RASTER } from "../../core/strings-event-raster.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const RASTER = [
  { label: "api", events: [2, 5, 9, 14, 20, 26, 33, 40, 48] },
  { label: "db", events: [3, 6, 10, 15, 21, 27, 34] },
  { label: "cache", events: [5, 20, 40] },
];

describe("<EventRaster>", () => {
  it("renders a lane path per source summary", () => {
    const { container } = draw(<EventRaster data={RASTER} width={160} height={24} />);
    expect(container.querySelectorAll("path").length).toBe(3);
    expect(eventRasterSummary(RASTER, [], EN_EVENT_RASTER)).toBe(
      "3 lanes, 19 events; busiest api (9).",
    );
  });

  it("binned overflow is disclosed in the summary", () => {
    expect(eventRasterSummary(RASTER, ["api"], EN_EVENT_RASTER)).toBe(
      "3 lanes, 19 events; busiest api (9). api shown binned.",
    );
  });

  it("renders lane labels in the gutter", () => {
    const { container } = draw(<EventRaster data={RASTER} width={160} height={24} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["api", "db", "cache"]);
  });

  it("emphasis accents one lane", () => {
    const { container } = draw(<EventRaster data={RASTER} emphasis="db" width={160} height={24} />);
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <EventRaster data={RASTER} title="Service events" width={160} height={24} />,
    );
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("EventRaster", (data: readonly Value[]) => (
  <EventRaster
    data={[{ label: "lane", events: data.filter((v) => typeof v === "number") as number[] }]}
    title="Edge"
  />
));

describe("<EventRaster> degrades at small sizes", () => {
  const LANES = [
    { label: "api", events: [2, 5, 9] },
    { label: "db", events: [3, 15] },
    { label: "cache", events: [6, 41] },
  ];

  // Each lane name is centred in its lane. Once a lane is shorter than one em
  // the names stack on each other and the outer two spill past the viewBox —
  // the tab-header failure. `labelFont` floors at 7, so they drop instead.
  it("keeps the lane names while a lane holds one em (height 21 → lane 7)", () => {
    const { container } = draw(<EventRaster data={LANES} width={200} height={21} />);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual([
      "api",
      "db",
      "cache",
    ]);
  });

  it("drops the lane names below one em — every event tick survives", () => {
    const { container } = draw(<EventRaster data={LANES} width={200} height={20} />);
    expect(container.querySelectorAll("text").length).toBe(0);
    // the marks still read: one raster path per lane, none of them empty
    const paths = [...container.querySelectorAll("path")];
    expect(paths.length).toBe(3);
    for (const p of paths) expect(p.getAttribute("d")).not.toBe("");
    // and the lanes reclaim the gutter: the plot now starts at the box edge
    const first = paths[0]!.getAttribute("d")!;
    expect(Number(first.slice(1).split(" ")[0])).toBeLessThan(20);
  });

  it("names too wide for their share of the width drop instead of clipping", () => {
    const wide = [{ label: "authorization-service", events: [2, 5] }];
    const { container } = draw(<EventRaster data={wide} width={60} height={24} />);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("path")).not.toBeNull();
  });
});
