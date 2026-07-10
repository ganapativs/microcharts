import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { ControlStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const SAMPLE = [10, 11, 9, 10, 11, 9, 10, 10, 11, 9, 10, 16];

describe("<ControlStrip> (plan/23 #10)", () => {
  it("summary states out count, center, and limits — the real string", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "1 of 12 points outside control limits (center 10.5, limits 6.15–14.85).",
    );
  });

  it("in-control series reads 'All N points within control limits'", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 11, 9, 10, 10, 11, 9]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "All 10 points within control limits",
    );
  });

  it("n < 10 appends 'Limits provisional'", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 12, 8]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toContain(
      "Limits provisional (n=6)",
    );
  });

  it("only out-of-control points get a ringed marker (in-control look boring)", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    // the spike → a ring (2 circles: outer ring + filled core); no other dots
    expect(container.querySelectorAll("circle").length).toBe(2);
  });

  it("dots='all' marks every point", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} dots="all" />);
    // 11 in-control dots + 2 (ring+core) for the out point
    expect(container.querySelectorAll("circle").length).toBe(13);
  });

  it("band + center hairline render", () => {
    const { container } = draw(<ControlStrip data={SAMPLE} />);
    expect(container.querySelector('[data-mc-ink="band"]')).not.toBeNull();
    expect(container.querySelectorAll("line").length).toBe(1); // center
  });

  it("provisional limits render a dashed band border", () => {
    const { container } = draw(<ControlStrip data={[10, 11, 9, 10, 12, 8]} />);
    // a separate muted outline rect — the band role's `stroke: none` CSS rule
    // would override stroke attributes set on the band rect itself
    const outline = container.querySelector('rect[data-mc-ink="muted"]')!;
    expect(outline.getAttribute("stroke-dasharray")).toBe("2 2");
    expect(outline.getAttribute("data-mc-w")).toBe("hair");
  });

  it("is axe-clean", async () => {
    const { container } = draw(<ControlStrip data={SAMPLE} title="Line 3 fill weight" />);
    await expectNoA11yViolations(container);
  });
});

seriesEdgeSuite("ControlStrip", (data) => <ControlStrip data={data as number[]} title="Edge" />);
