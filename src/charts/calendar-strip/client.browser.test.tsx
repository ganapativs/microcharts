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
    await userEvent.keyboard("{End}");
    expect(live.textContent).toBe("Sunday, July 5: no data.");
    await userEvent.keyboard("{Escape}");
    expect(live.textContent).toBe("");
  });

  it("focus ring hugs the active cell", async () => {
    const fig = await mount(<CalendarStrip data={DATA} end={END} />);
    fig.focus();
    await userEvent.keyboard("{Home}");
    expect(fig.querySelector('rect[stroke="var(--mc-accent)"]')).not.toBeNull();
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
});
