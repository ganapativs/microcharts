import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { CalendarStrip } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

// pinned end (determinism — never a live "now" in tests)
const END = "2026-07-05";
const DATA = [
  { date: "2026-07-01", value: 12 },
  { date: "2026-06-30", value: 0 },
  { date: "2026-06-24", value: 3 },
  { date: "2026-06-15", value: 7 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<CalendarStrip> (plan/22 #26, structured)", () => {
  it("renders real calendar cells with the composed summary", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Active 3 of 28 days over 4 weeks.");
    expect(svg.getAttribute("viewBox")).toBe("0 0 55 31");
    expect(container.querySelectorAll("rect").length).toBe(28); // Sunday end → no future cells
  });

  it("empty ≠ zero: no-record days render as outline, zero days as track fill", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} />);
    const rects = [...container.querySelectorAll("rect")];
    const empty = rects.filter((r) => r.getAttribute("data-mc-ink") === "muted");
    const filled = rects.filter((r) => r.getAttribute("data-mc-ink") === "cell");
    expect(empty.length).toBe(24); // 28 days − 3 value − 1 zero
    expect(filled.length).toBe(4);
  });

  it("future days are blank (never extrapolated)", () => {
    const { container } = draw(<CalendarStrip data={DATA} end="2026-07-01" />);
    // Wednesday end, Monday weeks → 4 trailing future cells not rendered
    expect(container.querySelectorAll("rect").length).toBe(24);
  });

  it("duplicate dates are summed with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(
      <CalendarStrip
        data={[
          { date: "2026-07-01", value: 2 },
          { date: "2026-07-01", value: 3 },
        ]}
        end={END}
      />,
    );
    expect(warn).toHaveBeenCalled();
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Active 1 of 28 days over 4 weeks.",
    );
  });

  it("empty data still renders the window; summary reads 0 active", () => {
    const { container } = draw(<CalendarStrip data={[]} end={END} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "Active 0 of 28 days over 4 weeks.",
    );
  });

  it("unparseable end refuses with a dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = draw(<CalendarStrip data={DATA} end="garbage" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("weeks > 8 dev-warns (ActivityGrid territory)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(<CalendarStrip data={DATA} end={END} weeks={9} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("ActivityGrid"));
  });

  it("summary={false} → decorative", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("shape='dot' insets the marks", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} shape="dot" />);
    const r = container.querySelector("rect")!;
    expect(Number(r.getAttribute("x"))).toBeGreaterThan(0);
  });

  it("axe clean", async () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} title="Deploy cadence" />);
    await expectNoA11yViolations(container);
  });
});
