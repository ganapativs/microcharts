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

  it("emphasis accents one lane and MUTES the rest (never fill-only ink)", () => {
    const { container } = draw(<EventRaster data={RASTER} emphasis="db" width={160} height={24} />);
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
    // `neutral` is the FILL family: on these zero-area tick verticals it set
    // `stroke: none` and filled nothing, so every muted lane disappeared.
    expect(container.querySelectorAll('path[data-mc-ink="neutral"]').length).toBe(0);
    expect(container.querySelectorAll('path[data-mc-ink="muted"]').length).toBe(2);
    // one weight for every lane, from the token — not a literal the density and
    // contrast levers cannot reach, and forced-colors cannot remap
    for (const p of container.querySelectorAll("path")) {
      expect(p.getAttribute("stroke")).toBeNull();
      expect(p.getAttribute("stroke-width")).toBeNull();
      expect(p.getAttribute("data-mc-w")).toBe("full");
      expect(p.getAttribute("fill")).toBe("none");
    }
  });

  it("lane ticks take the stroked data ink by default", () => {
    const { container } = draw(<EventRaster data={RASTER} width={160} height={24} />);
    expect(container.querySelectorAll('path[data-mc-ink="data"]').length).toBe(3);
  });

  it("an explicit window drops the events outside it — from the picture AND the name", () => {
    const { container } = draw(
      <EventRaster data={RASTER} domain={[10, 20]} width={160} height={24} />,
    );
    // announced total = painted total; a name quoting 19 over a 5-tick picture
    // is a count the reader cannot check
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 lanes, 5 events; busiest api (2).",
    );
    const xs = [...container.querySelectorAll("path")].flatMap((p) =>
      [...p.getAttribute("d")!.matchAll(/M([\d.-]+)/g)].map((m) => Number(m[1])),
    );
    expect(xs.length).toBe(5);
    for (const x of xs) expect(x).toBeGreaterThanOrEqual(0);
    for (const x of xs) expect(x).toBeLessThanOrEqual(160);
  });

  it("a hostile domain renders the default window, never NaN coordinates", () => {
    for (const domain of [
      [NaN, NaN],
      [0, NaN],
      [-Infinity, Infinity],
    ] as const) {
      const { container } = draw(<EventRaster data={RASTER} domain={domain} width={160} />);
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    }
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
