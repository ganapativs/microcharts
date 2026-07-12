import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { PolarClock, polarClockSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// A 24-hour day peaking at 14:00, quietest at 04:00.
const DAY = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 100 + h));

describe("<PolarClock>", () => {
  it("summary names the peak and quiet segment with hour labels", () => {
    const { container } = draw(<PolarClock data={DAY} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Peaks at 14:00 (312); quietest 04:00.",
    );
  });

  it("flat cycle → flat summary", () => {
    expect(polarClockSummary([5, 5, 5, 5])).toBe("Flat at 5 across the cycle.");
  });

  it("small cycle uses the index label", () => {
    expect(polarClockSummary([10, 40, 20, 5])).toBe("Peaks at 1 (40); quietest 3.");
  });

  it("renders the guide baseline + a segments path", () => {
    const { container } = draw(<PolarClock data={[10, 40, 20, 5]} />);
    expect(container.querySelector('circle[data-mc-ink="muted"]')).not.toBeNull();
    expect(container.querySelector("path")).not.toBeNull();
  });

  it('label="max" prints the peak value in the gutter', () => {
    const { container } = draw(<PolarClock data={[10, 40, 20]} label="max" />);
    const t = container.querySelector('text[data-mc-ink="label"]');
    expect(t!.textContent).toBe("40");
  });

  it("now accents a segment", () => {
    const { container } = draw(<PolarClock data={[10, 40, 20]} now={1} />);
    expect(container.querySelector('path[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("opacity mode renders level cells", () => {
    const { container } = draw(<PolarClock data={[1, 2, 3, 4, 5]} mode="opacity" />);
    expect(container.querySelector('path[data-mc-ink="cell"]')).not.toBeNull();
  });

  it("all-null → 'No data.'", () => {
    const { container } = draw(<PolarClock data={[null, null]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<PolarClock data={DAY} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<PolarClock data={DAY} now={14} title="Traffic" />);
    await expectNoA11yViolations(container);
  });
});
