import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { FoldedDayBand, binPosition, foldedBandSummary } from "./index.js";
import { foldedBandGeometry } from "./geometry.js";
import { EN_FOLDED_BAND } from "../../core/strings-folded-band.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

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

describe("<FoldedDayBand>", () => {
  it("renders envelopes + median summary with today clause", () => {
    const { container } = draw(<FoldedDayBand data={DATA} today={TODAY} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    const geo = foldedBandGeometry({
      data: DATA,
      today: TODAY,
      period: 24,
      bins: 24,
      percentiles: BANDS,
      width: 120,
      height: 32,
    });
    expect(foldedBandSummary(geo, 24, EN_FOLDED_BAND, fmt)).toBe(
      "Median peaks at 14 (82); today is above the 75th percentile.",
    );
  });

  it("today overlay renders an accent line, not a filled shape", () => {
    const { container } = draw(<FoldedDayBand data={DATA} today={TODAY} />);
    const today = container.querySelector('path[data-mc-ink="accent"]');
    expect(today).not.toBeNull();
    // Open polyline: must carry fill="none" or the accent ink rule fills it
    // (auto-closing the M…L… path into a solid blob). See styles.css accent rule.
    expect(today!.getAttribute("fill")).toBe("none");
  });

  it("no today → no today clause", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      percentiles: BANDS,
      width: 120,
      height: 32,
    });
    expect(foldedBandSummary(geo, 24, EN_FOLDED_BAND, fmt)).toBe("Median peaks at 14 (82).");
  });

  // The envelopes are the primary encoding. Inline `fill` survived verbatim
  // into High Contrast Mode (`.mc-root` sets `forced-color-adjust: none`), so a
  // 12%-opacity ink was no envelope at all; the paint moved to the shared
  // `[data-mc-cone]` rule, which has a forced-colors mapping.
  it("envelopes paint through a themable rule, never an inline fill", () => {
    const { container } = draw(<FoldedDayBand data={DATA} />);
    const bands = [...container.querySelectorAll("path[data-mc-cone]")];
    expect(bands.length).toBe(2);
    for (const b of bands) {
      const inline = b.getAttribute("style") ?? "";
      expect(inline).not.toMatch(/(^|;)\s*fill\s*:/);
      expect(inline).toContain("--mc-cone-color");
      expect(inline).toContain("--mc-cone-opacity");
    }
  });

  // Both traces sit in the same plot box; one scaling its stroke with the box
  // and the other not let the support-weight overlay outweigh the median.
  it("both traces hold their stroke weight when the box scales", () => {
    const { container } = draw(<FoldedDayBand data={DATA} today={TODAY} />);
    for (const sel of ['path[data-mc-ink="data"]', 'path[data-mc-ink="accent"]']) {
      expect(container.querySelector(sel)!.getAttribute("vector-effect")).toBe(
        "non-scaling-stroke",
      );
    }
  });

  // Announced axis == drawn axis. `period` reaches this component from a host
  // computation, and the summary read it raw.
  it.each([NaN, Infinity, 0, -5])("period=%p never leaks into the name", (period) => {
    const { container } = draw(<FoldedDayBand data={DATA} period={period} />);
    const name = container.querySelector("svg")!.getAttribute("aria-label")!;
    expect(name).not.toMatch(/NaN|Infinity/);
    expect(name).toBe("Median peaks at 14 (82).");
  });

  // Saturated in geometry (512 bins), so the label has to saturate with it —
  // dividing by the raw prop put every bin at position 0.
  it("a huge `bins` labels the axis it actually drew", () => {
    expect(binPosition(256, 1_000_000, 24)).toBe(binPosition(256, 512, 24));
    expect(binPosition(0, NaN, NaN)).toBe(0);
  });

  it("is axe-clean", async () => {
    const { container } = draw(<FoldedDayBand data={DATA} title="Typical day" />);
    await expectNoA11yViolations(container);
  });
});

// Both fields are read — `t` picks the fold bucket, `value` feeds the quantile.
// The previous spelling pinned `t: i` and laundered every gap into `value: 0`,
// so a bin with no reading was asserted to be a measured zero (the opposite of
// empty ≠ zero) and `t` never went non-finite at all.
//
// One suite per field, rather than one suite putting the value on both: with
// both fields degenerate the two halves of foldBins' finiteness check mask each
// other — drop the `Number.isFinite(d.t)` half and a both-fields mapping still
// passes, because the `value` half has already skipped the row. `today` is
// passed so the overlay + percentile clause meet the matrix too.
const foldedCase = (data: readonly { t: number; value: number }[]) => (
  <FoldedDayBand data={data} today={data} title="Edge" />
);
mappedEdgeSuite(
  "FoldedDayBand (degenerate t)",
  (v, i) => ({ t: v as number, value: i }),
  foldedCase,
);
mappedEdgeSuite(
  "FoldedDayBand (degenerate value)",
  (v, i) => ({ t: i, value: v as number }),
  foldedCase,
);
