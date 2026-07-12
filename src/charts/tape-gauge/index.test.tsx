import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { TapeGauge, tapeGaugeSummary } from "./index.js";
import { EN_TAPE_GAUGE } from "../../core/strings-tape-gauge.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const ZONES = [
  { from: 100, to: 130, tone: "pos" as const },
  { from: 130, to: 150, tone: "warn" as const },
  { from: 150, to: 200, tone: "neg" as const },
];

describe("<TapeGauge>", () => {
  it("renders zones + ticks + pointer readout summary", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} span={25} height={64} />,
    );
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(3);
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(true);
    expect(tapeGaugeSummary(142, 1, [25 / 60, 25 / 15], ZONES[1]!, EN_TAPE_GAUGE, fmt)).toBe(
      "Now 142, rising; in the 130–150 zone.",
    );
  });

  it("rate is a separate channel — a rising chevron is drawn", () => {
    const { container } = draw(
      <TapeGauge value={142} rate={2} zones={ZONES} span={25} height={64} />,
    );
    // chevron path uses the accent ink role (element-split: strokes on path)
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("no rate → no rate clause", () => {
    expect(tapeGaugeSummary(142, undefined, [1, 2], ZONES[1]!, EN_TAPE_GAUGE, fmt)).toBe(
      "Now 142; in the 130–150 zone.",
    );
  });

  it("label='none' hides the readout number", () => {
    const { container } = draw(
      <TapeGauge value={142} zones={ZONES} span={25} label="none" height={64} />,
    );
    expect([...container.querySelectorAll("text")].some((t) => t.textContent === "142")).toBe(
      false,
    );
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <TapeGauge value={142} rate={1} zones={ZONES} title="Airspeed" height={64} />,
    );
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("TapeGauge", (value: number) => (
  <TapeGauge value={value} title="Edge" height={64} />
));
