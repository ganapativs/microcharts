import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { RugStrip } from "./client.js";

const DATA = [3.1, 5.2, 9.7, 4.4];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <RugStrip>", () => {
  it("arrow keys step through sorted observations with rank announcements", async () => {
    const screen = await render(<RugStrip data={DATA} title="Values" />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    // First arrow lands on the FIRST observation (shared kernel), not the second.
    await expect.poll(() => live.textContent).toBe("3.1 — 1st of 4.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("9.7 — 4th of 4.");
  });

  it("hover finds the nearest tick and shows the readout", async () => {
    const screen = await render(<RugStrip data={DATA} />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 1, // far right → nearest = max value
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("9.7");
  });

  it("onActive reports the focused observation; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<RugStrip data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    // index is the RANK in the sorted values: rank 1 is 4.4, not data[1].
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 4.4 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active observation: fires onSelect + pins a tick", async () => {
    const picks: unknown[] = [];
    const screen = await render(<RugStrip data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-rug-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 3, value: 9.7 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the tick without focus", async () => {
    const screen = await render(<RugStrip data={DATA} selectedIndex={2} />);
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
