import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { MinimapStrip, minimapSummary } from "./index.js";
import { minimapDomain } from "./geometry.js";
import { EN_MINIMAP } from "../../core/strings-minimap.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import type { Value } from "../../core/types.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);
const CONTENT = Array.from({ length: 1200 }, (_, i) => Math.sin(i / 40) + 1);
const DATA = {
  content: CONTENT,
  window: [520, 660] as [number, number],
  marks: [100, 600, 1100],
  known: [[0, 1104]] as [number, number][],
};

describe("<MinimapStrip>", () => {
  it("renders the window + content + marks summary", () => {
    const { container } = draw(<MinimapStrip data={DATA} />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(1);
    // Mark strokes are accent paths — without fill="none" the accent ink rule
    // zeroes the stroke (fill:accent, stroke:none) and the zero-area vertical
    // lines render nothing at all. Guard visibility.
    const mark = container.querySelector('path[data-mc-ink="accent"]');
    expect(mark).not.toBeNull();
    expect(mark!.getAttribute("fill")).toBe("none");
    expect(minimapSummary(DATA, minimapDomain(DATA), 0.08, EN_MINIMAP, fmt)).toBe(
      "Viewing 12% of the whole (520–660 of 1,200); 3 marks; 8% unknown.",
    );
  });

  it("fog renders for unknown regions", () => {
    const { container } = draw(<MinimapStrip data={DATA} />);
    expect(container.querySelector('path[data-mc-ink="muted"]')).not.toBeNull();
  });

  it("heat mode renders content as opacity, no bar path", () => {
    const { container } = draw(<MinimapStrip data={DATA} mode="heat" />);
    expect(container.querySelector('path[data-mc-ink="bar"]')).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<MinimapStrip data={DATA} title="Document position" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("MinimapStrip", (data: readonly Value[]) => (
  <MinimapStrip data={{ content: data, window: [0, Math.max(1, data.length) / 2] }} title="Edge" />
));

// The window, the marks, the known extents and the `domain` prop are numbers
// too — and they are where the leaks were: a short or null window reached the
// formatter, and a non-finite one reached the scale. Drive them from the same
// matrix rather than pairing degenerate content with a valid window.
seriesEdgeSuite("MinimapStrip (degenerate window/domain)", (data: readonly Value[]) => (
  <MinimapStrip
    data={{
      content: data,
      // deliberately unsanitized: a caller CAN hand us these
      window: [data[0], data[1]] as unknown as [number, number],
      marks: data.slice(0, 3) as unknown as number[],
      known: [[data[0], data[data.length - 1]]] as unknown as [number, number][],
    }}
    domain={[data[0], data[1]] as unknown as [number, number]}
    markLane
    title="Edge"
  />
));

describe("<MinimapStrip> degenerate window", () => {
  it("no measurable window → No data, and the rail frames the whole strip", () => {
    const { container } = draw(
      <MinimapStrip
        data={{ content: [1, 2, 3], window: [null, null] as unknown as [number, number] }}
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("No data.");
    // empty ≠ zero: the frame is visible and distinct (hollow + dashed), never a
    // solid window sitting at the left edge.
    const rail = [...container.querySelectorAll("rect")].at(-1)!;
    expect(rail.getAttribute("stroke-dasharray")).toBe("2 2");
    expect(rail.getAttribute("fill-opacity")).toBe("0");
    expect(Number(rail.getAttribute("width"))).toBeGreaterThan(1);
  });

  it("a short window pair is not measurable either", () => {
    const { container } = draw(
      <MinimapStrip data={{ content: [1, 2], window: [1] as unknown as [number, number] }} />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("a non-finite domain prop falls back to the derived domain", () => {
    const { container } = draw(
      <MinimapStrip
        data={{ content: [1, 2, 3, 4], window: [0, 2] }}
        domain={[Number.NaN, Number.NaN] as unknown as [number, number]}
      />,
    );
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Viewing 50% of the whole (0–2 of 4); 0 marks.",
    );
  });
});
