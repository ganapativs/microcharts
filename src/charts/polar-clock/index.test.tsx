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

  it("now accents a segment with a solid fill (not a hollow outline)", () => {
    const { container } = draw(<PolarClock data={[10, 40, 20]} now={1} />);
    const accent = container.querySelector('path[data-mc-ink="accent"]') as SVGElement | null;
    expect(accent).not.toBeNull();
    expect(accent!.style.fill).toBe("var(--mc-accent)");
  });

  it("opacity mode renders level cells", () => {
    const { container } = draw(<PolarClock data={[1, 2, 3, 4, 5]} mode="opacity" />);
    expect(container.querySelector('path[data-mc-ink="cell"]')).not.toBeNull();
  });

  it("an unusable size/fontSize still paints the chart it announces", () => {
    // A host-computed prop (`Number(field.value)` on an empty input → NaN) put
    // NaN in every coordinate: `Chart` clamped the frame to 1×1 and the marks
    // vanished, under a summary that read as though the chart were fine.
    const bad = draw(<PolarClock data={DAY} size={Number.NaN} label="max" />);
    const svg = bad.container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 39");
    expect(bad.container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(bad.container.querySelector('path[data-mc-ink="bar"]')).not.toBeNull();

    const badFont = draw(<PolarClock data={DAY} label="max" fontSize={Number.NaN} />);
    expect(badFont.container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 24 39");
    expect(badFont.container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("drops a peak numeral too wide for the box instead of painting past it", () => {
    // Nothing measures text on the server, so a per-char over-estimate decides.
    // `.mc-root` is overflow: visible — a 9-digit numeral centred on a 24-unit
    // box would run into the page, not get clipped.
    const tight = draw(<PolarClock data={[1, 1234567, 3]} label="max" size={24} />);
    expect(tight.container.querySelector('text[data-mc-ink="label"]')).toBeNull();
    // and the band goes with it — no empty gutter under the dial
    expect(tight.container.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 24 24");

    const roomy = draw(<PolarClock data={[1, 1234567, 3]} label="max" size={120} />);
    expect(roomy.container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe(
      "1,234,567",
    );
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
