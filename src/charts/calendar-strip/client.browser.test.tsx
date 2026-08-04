import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CalendarStrip } from "./client.js";

const END = "2026-07-05"; // pinned (determinism)
const DATA = [
  { date: "2026-06-08", value: 5 }, // the window's first cell (Monday)
  { date: "2026-06-09", value: 0 },
  { date: "2026-07-01", value: 12 },
];

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <CalendarStrip>", () => {
  it("focusable role=img named by the calendar summary", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} title="Deploys" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toBe("Deploys. Active 2 of 28 days over 4 weeks.");
  });

  it("keyboard walks days/weeks and announces real calendar days", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} title="Deploys" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(live.textContent).toBe("Monday, June 8: 5.");
    await userEvent.keyboard("{ArrowRight}"); // next day — a zero day
    expect(live.textContent).toBe("Tuesday, June 9: 0.");
    await userEvent.keyboard("{ArrowDown}"); // one week down, same weekday — empty
    expect(live.textContent).toBe("Tuesday, June 16: no data.");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}"); // above the window → consumed
    expect(live.textContent).toBe("Tuesday, June 9: 0.");
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Sunday, July 5: no data.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("focus ring hugs the active cell", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector("rect[data-mc-active]")).not.toBeNull();
  });

  it("inner SVG fills the wrapper when a demo scales it via CSS width", async () => {
    // the grid has a fixed 7px cell (intrinsic viewBox ~55px), so a card sizes
    // it up with a CSS width. The SVG must fill that width or the pointer math
    // (which divides by the wrapper width) lands off the cells.
    const fig = await mount(<CalendarStrip data={DATA} end={END} style={{ width: 180 }} />);
    const svg = fig.querySelector("svg")!;
    const wrapW = fig.getBoundingClientRect().width;
    const svgW = svg.getBoundingClientRect().width;
    expect(wrapW).toBeGreaterThan(120); // the demo width took effect
    expect(Math.abs(svgW - wrapW)).toBeLessThan(1); // SVG fills it exactly
  });

  it("onActive reports the focused day datum (index + value + day name); null on clear", async () => {
    const seen: unknown[] = [];
    const fig = await mount(<CalendarStrip data={DATA} end={END} onActive={(d) => seen.push(d)} />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 5, label: "Monday, June 8" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active day: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const fig = await mount(
      <CalendarStrip data={DATA} end={END} onSelect={(d) => picks.push(d)} />,
    );
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 0, label: "Tuesday, June 9" });
    fig.blur();
    await expect.poll(() => fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  // Announced scale === painted scale, in the wrapper too: the static entry names
  // the window it built, and the interactive name has to be the same string.
  it("the wrapper names the painted window, not the raw `weeks`", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} weeks={4.7} />);
    expect(fig.getAttribute("aria-label")).toBe("Active 2 of 28 days over 4 weeks.");
  });

  // A poisoned length falls back in geometry; the ring metrics and the pointer
  // pitch read it from there, so they can't drift from the grid that was drawn.
  it("a non-finite `cell` falls back to the default grid, ring included", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} cell={NaN} />);
    expect(fig.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 55 31");
    fig.focus();
    await userEvent.keyboard("{Home}");
    const ring = fig.querySelector("rect[data-mc-active]")!;
    expect(ring.getAttribute("x")).toBe("-0.5"); // cell 0 at the resolved metrics
    expect(ring.getAttribute("width")).toBe("8");
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} selectedIndex={23} />);
    expect(fig.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
