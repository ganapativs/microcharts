import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { FoldedDayBand, foldedBandSummary } from "./index.js";
import { foldedBandGeometry } from "./geometry.js";
import { EN_FOLDED_BAND } from "../../core/strings-folded-band.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const curve = (h: number) => Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10));
const DATA = Array.from({ length: 3 }, (_p, p) =>
  Array.from({ length: 24 }, (_h, h) => ({ t: p * 24 + h, value: curve(h) + [-2, 0, 2][p]! })),
).flat();
const TODAY = Array.from({ length: 24 }, (_h, h) => ({ t: h, value: 90 }));
const BANDS: [number, number][] = [
  [25, 75],
  [5, 95],
];

describe("<FoldedDayBand> (plan/25 §15, plan/17 F7)", () => {
  it("renders envelopes + median; docs-as-tests summary with today clause", () => {
    const { container } = draw(<FoldedDayBand data={DATA} today={TODAY} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    const geo = foldedBandGeometry({
      data: DATA,
      today: TODAY,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    expect(foldedBandSummary(geo, 24, EN_FOLDED_BAND, fmt)).toBe(
      "Median peaks at 14 (82); today is above the 75th percentile.",
    );
  });

  it("today overlay renders an accent line", () => {
    const { container } = draw(<FoldedDayBand data={DATA} today={TODAY} />);
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("no today → no today clause", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    expect(foldedBandSummary(geo, 24, EN_FOLDED_BAND, fmt)).toBe("Median peaks at 14 (82).");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<FoldedDayBand data={DATA} title="Typical day" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("FoldedDayBand", (data: readonly Value[]) => (
  <FoldedDayBand
    data={data.map((v, i) => ({ t: i, value: typeof v === "number" ? v : 0 }))}
    title="Edge"
  />
));
