import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { SpreadBand } from "./client.js";

const D = [
  { a: 10, b: 12 },
  { a: 14, b: 12 },
  { a: 18, b: 13 },
];

describe("interactive <SpreadBand>", () => {
  it("←/→ steps x announcing the lead at that point", async () => {
    const screen = await render(
      <SpreadBand data={D} seriesLabels={["Organic", "Paid"]} title="Channels" />,
    );
    const wrap = screen.container.querySelector(".mc-spread-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: Organic +5 over Paid.");
  });

  it("onActive reports the focused datum (data index + signed gap); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<SpreadBand data={D} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 2 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active reading: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<SpreadBand data={D} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 1, value: 2 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(<SpreadBand data={D} selectedIndex={2} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
