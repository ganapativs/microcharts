import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QueueDepth } from "./client.js";

const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const CAP = 100;

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <QueueDepth>", () => {
  it("arrow keys step periods; announces depth and the breach state", async () => {
    const screen = await render(<QueueDepth data={DATA} capacity={CAP} title="Queue" />);
    const wrap = screen.container.querySelector(".mc-queue-depth-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("t0: 42 queued.");
    // End jumps to the breached endpoint
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("t8: 214 queued, above capacity.");
  });

  it("shows a visible readout chip at the focused period", async () => {
    const screen = await render(<QueueDepth data={DATA} capacity={CAP} title="Queue" />);
    const wrap = screen.container.querySelector(".mc-queue-depth-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("t8: 214 queued, above capacity");
  });

  it("onActive reports the focused datum (data index + depth); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <QueueDepth data={DATA} capacity={CAP} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-queue-depth-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 1, value: 55 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active period: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <QueueDepth data={DATA} capacity={CAP} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-queue-depth-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 1, value: 55 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const screen = await render(<QueueDepth data={DATA} capacity={CAP} selectedIndex={0} />);
    const wrap = screen.container.querySelector(".mc-queue-depth-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
