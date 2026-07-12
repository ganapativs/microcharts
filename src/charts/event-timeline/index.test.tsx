import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { EventTimeline, formatDuration } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const H = 3_600_000;
const T0 = Date.UTC(2026, 5, 3); // 2026-06-03 UTC
const DATA = [
  { start: T0, end: T0 + 4 * H, label: "Deploy freeze", kind: "accent" as const },
  { start: T0 + 6 * H, end: T0 + 14 * H, label: "Healthy", kind: "positive" as const },
  { start: T0 + 11 * H + 12 * 60_000, label: "Incident", kind: "negative" as const },
];
const WINDOW: [number, number] = [T0, T0 + 24 * H];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<EventTimeline>", () => {
  it("track + span rects + point diamonds; coverage summary", () => {
    const { container } = draw(<EventTimeline data={DATA} domain={WINDOW} />);
    expect(container.querySelectorAll("rect").length).toBe(2);
    expect(container.querySelectorAll("path").length).toBe(1); // diamond
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 spans covering 50% of the window; 1 event.",
    );
  });

  it("kind maps to semantic ink (state is never color-alone: shape splits types)", () => {
    const { container } = draw(<EventTimeline data={DATA} domain={WINDOW} />);
    expect(container.querySelector('rect[data-mc-ink="accent"]')).not.toBeNull();
    expect(container.querySelector('rect[data-mc-ink="positive"]')).not.toBeNull();
    expect(container.querySelector('path[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("now tick renders as an accent hairline", () => {
    const { container } = draw(<EventTimeline data={DATA} domain={WINDOW} now={T0 + 12 * H} />);
    expect(container.querySelector('line[data-mc-ink="accent"]')).not.toBeNull();
  });

  it("zero-duration span demotes to a point event with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<EventTimeline data={[{ start: T0, end: T0 }]} domain={WINDOW} />);
    expect(container.querySelectorAll("path").length).toBe(1);
    expect(warn).toHaveBeenCalled();
  });

  it("reversed span is dropped with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <EventTimeline data={[{ start: T0 + H, end: T0 }]} domain={WINDOW} />,
    );
    expect(container.querySelectorAll("rect").length).toBe(0);
    expect(warn).toHaveBeenCalled();
  });

  it("fully-outside items are excluded with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <EventTimeline data={[{ start: T0 - 48 * H, end: T0 - 24 * H }]} domain={WINDOW} />,
    );
    expect(container.querySelectorAll("rect").length).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("outside the domain"));
  });

  it("label='spans' renders only labels that fit", () => {
    const { container } = draw(
      <EventTimeline data={DATA} domain={WINDOW} label="spans" width={160} height={14} />,
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("Healthy");
  });

  it("empty data → 'No data.' summary, track still renders", () => {
    const { container } = draw(<EventTimeline data={[]} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe("No data.");
    expect(container.querySelectorAll("line").length).toBe(1);
  });

  it("Date inputs normalize to the same render as ms epochs", () => {
    const a = draw(<EventTimeline data={DATA} domain={WINDOW} />).container.innerHTML;
    const b = draw(
      <EventTimeline
        data={DATA.map((d) => ({
          ...d,
          start: new Date(d.start),
          end: d.end ? new Date(d.end) : undefined,
        }))}
        domain={[new Date(WINDOW[0]), new Date(WINDOW[1])]}
      />,
    ).container.innerHTML;
    expect(b).toEqual(a);
  });

  it("summary={false} → decorative", () => {
    const { container } = draw(<EventTimeline data={DATA} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("axe clean", async () => {
    const { container } = draw(<EventTimeline data={DATA} domain={WINDOW} title="api uptime" />);
    await expectNoA11yViolations(container);
  });
});

describe("formatDuration", () => {
  it("coarse two-unit reads", () => {
    expect(formatDuration(30_000)).toBe("30s");
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(4.5 * H)).toBe("4h 30m");
    expect(formatDuration(26 * H)).toBe("1d 2h");
  });
});
