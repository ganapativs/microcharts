import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { EtaBar, etaBarSummary } from "./index.js";
import { EN_ETA_BAR } from "../../core/strings-eta-bar.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { valueEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const min = (t: number) => `${Math.round(t)} min`;

describe("<EtaBar>", () => {
  it("renders done + remaining summary", () => {
    const { container } = draw(
      <EtaBar progress={0.64} elapsed={3.6} rate={0.18} etaFormat={min} width={120} height={14} />,
    );
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(2);
    expect(
      etaBarSummary(
        {
          progress: 0.64,
          elapsed: 3.6,
          rate: 0.18,
          etaFormat: min,
          fmt: makeFormatter(undefined, undefined),
        },
        EN_ETA_BAR,
      ),
    ).toBe("64% done; about 2 min remaining at the current rate.");
  });

  it("stalled summary when the rate is zero", () => {
    expect(
      etaBarSummary(
        { progress: 0.3, elapsed: 10, rate: 0, fmt: makeFormatter(undefined, undefined) },
        EN_ETA_BAR,
      ),
    ).toBe("30% done; stalled.");
  });

  it("done summary at completion", () => {
    expect(
      etaBarSummary(
        { progress: 1, elapsed: 10, rate: 0.1, fmt: makeFormatter(undefined, undefined) },
        EN_ETA_BAR,
      ),
    ).toBe("Done.");
  });

  it("label='percent' renders the progress percent", () => {
    const { container } = draw(
      <EtaBar progress={0.42} elapsed={10} rate={0.05} label="percent" width={120} height={14} />,
    );
    expect(container.querySelector("text")!.textContent).toBe("42%");
  });

  it("is axe-clean", async () => {
    const { container } = draw(
      <EtaBar progress={0.64} elapsed={3.6} rate={0.18} title="Export progress" />,
    );
    await expectNoA11yViolations(container);
  });
});

valueEdgeSuite("EtaBar", (value: number) => (
  <EtaBar progress={value} elapsed={10} rate={0.05} title="Edge" />
));
