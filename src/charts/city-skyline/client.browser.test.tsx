import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { CitySkyline } from "./client.js";

const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <CitySkyline>", () => {
  it("arrow keys rove buildings; the lit fraction is announced as a percent", async () => {
    const screen = await render(<CitySkyline data={TEAMS} title="Teams" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Platform: 46; 70% lit.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("Core: 32; 50% lit.");
    await userEvent.keyboard("{ArrowRight}"); // Web has no lit
    expect(live.textContent).toBe("Web: 28.");
  });

  it("a null-value building announces no data without throwing", async () => {
    // `value` is typed `number`, but bad data reaches the readout at runtime.
    const data = [
      { label: "Platform", value: 46, lit: 0.7 },
      { label: "Core", value: null as unknown as number },
      { label: "Web", value: 28 },
    ];
    const screen = await render(<CitySkyline data={data} title="Teams" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}"); // Core: null
    expect(live.textContent).toBe("Core: no data.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<CitySkyline data={TEAMS} unit="teams" title="Teams" />);
    const wrap = screen.container.querySelector(".mc-skyline-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Teams. 3 teams; tallest Platform at 46.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<CitySkyline data={TEAMS} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-skyline-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 46, label: "Platform" });
    key(wrap, "End");
    expect(seen.at(-1)).toEqual({ index: 2, value: 28, label: "Web" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active building: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(<CitySkyline data={TEAMS} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-skyline-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 46, label: "Platform" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<CitySkyline data={TEAMS} selectedIndex={1} />);
    expect(screen.container.querySelectorAll('rect[data-mc-w="tick"]')).toHaveLength(1);
  });
});
