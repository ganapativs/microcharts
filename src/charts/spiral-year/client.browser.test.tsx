import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SpiralYear } from "./client.js";

const YEAR = Array.from({ length: 52 }, (_, i) => (i === 29 ? 480 : i === 5 ? 10 : 100 + i));

describe("interactive <SpiralYear>", () => {
  it("arrow keys step chronologically and announce the period + value", async () => {
    const screen = await render(<SpiralYear data={YEAR} title="Year" size={64} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("week 1: 100.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("week 2: 101.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<SpiralYear data={YEAR} title="Year" size={64} />);
    const wrap = screen.container.querySelector(".mc-spiral-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Year. 52 weeks; peak 480 in week 30, low in week 6.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum (data index + value + label); null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <SpiralYear data={YEAR} size={64} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 101, label: "week 2" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active period: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <SpiralYear data={YEAR} size={64} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 1, value: 101, label: "week 2" });
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<SpiralYear data={YEAR} size={64} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
