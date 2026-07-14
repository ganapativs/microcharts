import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { Waveform, waveformSummary } from "./index.js";
import { EN_WAVEFORM } from "../../core/strings-waveform.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const SPIKE = Array.from({ length: 200 }, (_, i) => (i === 126 ? 0.82 : Math.sin(i / 3) * 0.15));

describe("<Waveform>", () => {
  it("renders bar path summary discloses the peak", () => {
    const { container } = draw(<Waveform data={SPIKE} />);
    expect(container.querySelector('path[data-mc-ink="bar"]')).not.toBeNull();
    expect(waveformSummary(SPIKE, EN_WAVEFORM, fmt)).toBe("Peak 0.82 at 63% through 200 samples.");
  });

  it("silence → Silent. summary", () => {
    expect(waveformSummary([0, 0, 0, 0], EN_WAVEFORM, fmt)).toBe("Silent.");
  });

  it("envelope variant renders one filled area path", () => {
    const { container } = draw(<Waveform data={SPIKE} variant="envelope" />);
    // one area path; it carries "bar" ink so the rise entrance covers it
    // (the inline fill keeps the envelope color)
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(1);
    expect(paths[0]!.getAttribute("data-mc-ink")).toBe("bar");
    expect(paths[0]!.getAttribute("style")).toContain("--mc-stroke");
  });

  it("progress splits played (accent) from the rest", () => {
    const { container } = draw(<Waveform data={SPIKE} progress={0.5} />);
    expect(container.querySelector('path[style*="--mc-accent"]')).not.toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<Waveform data={SPIKE} title="Voice memo" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("Waveform", (data: readonly Value[]) => <Waveform data={data} title="Edge" />);
