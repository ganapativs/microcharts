import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CalibrationStrip, calibrationSummary } from "./index.js";
import { calibrationGeometry } from "./geometry.js";
import { EN_CALIBRATION } from "../../core/strings-calibration.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const BINS = [
  { predicted: 0.05, observed: 0.05, count: 100 },
  { predicted: 0.15, observed: 0.16, count: 90 },
  { predicted: 0.25, observed: 0.24, count: 80 },
  { predicted: 0.35, observed: 0.36, count: 70 },
  { predicted: 0.45, observed: 0.44, count: 60 },
  { predicted: 0.55, observed: 0.56, count: 50 },
  { predicted: 0.65, observed: 0.63, count: 40 },
  { predicted: 0.7, observed: 0.52, count: 30 },
  { predicted: 0.85, observed: 0.83, count: 8 },
  { predicted: 0.95, observed: 0.9, count: 5 },
];

describe("<CalibrationStrip>", () => {
  it("renders dots + diagonal + support lane summary", () => {
    const { container } = draw(<CalibrationStrip data={BINS} />);
    expect(container.querySelectorAll("circle").length).toBe(10);
    expect(container.querySelector("path[stroke-dasharray]")).not.toBeNull();
    const geo = calibrationGeometry({
      data: BINS,
      bins: 10,
      minSupport: 11,
      width: 100,
      height: 32,
      supportHeight: 6,
    });
    expect(calibrationSummary(geo.points, geo.maxGap, EN_CALIBRATION, fmt)).toBe(
      "10 bins; largest gap at 0.7 predicted (observed 0.52); 2 low-support bins.",
    );
  });

  it("low-support bins render as open (hollow) dots", () => {
    const { container } = draw(<CalibrationStrip data={BINS} />);
    const hollow = [...container.querySelectorAll("circle")].filter(
      (c) => c.getAttribute("fill") === "none",
    );
    expect(hollow.length).toBe(2);
  });

  it("bars variant draws deviation columns instead of dots", () => {
    const { container } = draw(<CalibrationStrip data={BINS} variant="bars" />);
    expect(container.querySelectorAll("circle").length).toBe(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<CalibrationStrip data={BINS} title="Model calibration" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("CalibrationStrip", (data: readonly Value[]) => (
  <CalibrationStrip
    data={data.map((v, i) => ({
      p: (i + 0.5) / Math.max(1, data.length),
      outcome: typeof v === "number" && v > 0 ? 1 : 0,
    }))}
    title="Edge"
  />
));
