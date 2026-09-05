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

describe("<CalendarStrip>", () => {
  // A zero day and a value day share the `cell` ink role, so both take the
  // override. Only `value` got it, and the zero day fell back to the
  // stylesheet's accent beside recoloured neighbours.
  it("recolours zero days along with the rest", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} color="#B14E2E" />);
    const inked = [...container.querySelectorAll('rect[data-mc-ink="cell"]')];
    expect(inked.length).toBeGreaterThan(0);
    for (const r of inked) expect((r as SVGElement).style.fill).toBe("rgb(177, 78, 46)");
  });

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

  // The no-record cell is the whole "empty ≠ zero" claim. Its `fill: none` comes
  // from the muted ink role, but under forced-colors that role maps to
  // `fill: GrayText` — only the literal attribute keeps the hollow-mark rule
  // holding it back. Without it a day with no record filled solid in High
  // Contrast Mode and outweighed a real low day.
  it("empty cells declare a literal fill='none' (forced-colors hollow-mark rule)", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} />);
    const empty = [...container.querySelectorAll('rect[data-mc-ink="muted"]')];
    expect(empty.length).toBe(24);
    expect(empty.every((r) => r.getAttribute("fill") === "none")).toBe(true);
    // value/zero cells stay filled — the attribute is the hollow signal, not decor
    expect(container.querySelector('rect[data-mc-ink="cell"]')!.getAttribute("fill")).toBeNull();
  });

  // Announced scale === painted scale. `weeks` used to reach the summary raw,
  // so a floored/clamped/capped prop named a calendar that was never drawn.
  it("the summary names the painted window, not the raw `weeks`", () => {
    const label = (weeks: number) =>
      draw(<CalendarStrip data={DATA} end={END} weeks={weeks} />)
        .container.querySelector("svg")!
        .getAttribute("aria-label");
    expect(label(4.7)).toBe("Active 3 of 28 days over 4 weeks.");
    expect(label(NaN)).toBe("Active 1 of 7 days over 1 week.");
    expect(label(Infinity)).toBe("Active 1 of 7 days over 1 week.");
    expect(label(0)).toBe("Active 1 of 7 days over 1 week.");
  });

  it("hostile scalars never reach the markup", () => {
    for (const props of [
      { steps: NaN },
      { steps: Infinity },
      { cell: NaN },
      { gap: NaN },
      { cell: Infinity },
      { domain: [NaN, NaN] as const },
    ]) {
      const { container } = draw(<CalendarStrip data={DATA} end={END} {...props} />);
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
      // a poisoned length used to reach <Chart> as viewBox="0 0 NaN NaN"
      expect(container.querySelector("svg")!.getAttribute("viewBox")).toMatch(
        /^0 0 \d+(\.\d+)? \d+(\.\d+)?$/,
      );
    }
  });

  it("a non-finite `steps` keeps the intensity ramp (no dropped fill-opacity)", () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} steps={NaN} />);
    const ramp = [...container.querySelectorAll('rect[data-mc-ink="cell"]')].map((r) =>
      r.getAttribute("fill-opacity"),
    );
    expect(ramp).not.toContain("NaN");
    expect(new Set(ramp).size).toBeGreaterThan(1); // still stepped, not flat
  });

  it("axe clean", async () => {
    const { container } = draw(<CalendarStrip data={DATA} end={END} title="Deploy cadence" />);
    await expectNoA11yViolations(container);
  });

  // The only static in the catalog that reads the clock. It is a documented
  // default, but on the server it is also a hydration trap: render at 23:59 UTC,
  // hydrate at 00:01, and the grid differs. Dev-only warning, server-only path
  // — called as a plain function because statics are hook-free by contract.
  it("warns when rendered server-side with no `end` (hydration trap)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("window", undefined);
    try {
      CalendarStrip({ data: [{ date: "2026-03-01", value: 3 }] });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("without `end`"));
      warn.mockClear();
      // Pinned `end` is deterministic — no warning.
      CalendarStrip({ data: [{ date: "2026-03-01", value: 3 }], end: "2026-03-02" });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      warn.mockRestore();
    }
  });
});
