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

describe("<EventRaster> (plan/25 §5, plan/17 F18)", () => {
  it("renders a lane path per source; docs-as-tests summary", () => {
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
    expect(container.querySelector('path[stroke="var(--mc-accent)"]')).not.toBeNull();
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
