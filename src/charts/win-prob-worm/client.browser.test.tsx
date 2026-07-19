import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { WinProbWorm } from "./client.js";

const GAME = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];

// transient crosshair vs the persistent pin
const FOCUS = 'line[data-mc-w="support"]';
const PIN = 'line[data-mc-w="tick"]';

describe("interactive <WinProbWorm>", () => {
  it("←/→ rove the points, announcing leader + probability; a readout chip shows it", async () => {
    const screen = await render(
      <WinProbWorm data={GAME} sides={["home", "away"]} width={220} height={32} title="Win prob" />,
    );
    const wrap = screen.container.querySelector(".mc-win-prob-worm-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 15: home 98%.");
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("98%");
    // step to a trailing point — the loser's side + their probability
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 2: away 52%.");
  });

  it("Escape clears the crosshair + readout", async () => {
    const screen = await render(
      <WinProbWorm data={GAME} width={220} height={32} title="Win prob" />,
    );
    const wrap = screen.container.querySelector(".mc-win-prob-worm-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).toBeNull();
  });

  it("onActive reports the focused datum (data index + probability); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <WinProbWorm data={GAME} width={220} height={32} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-win-prob-worm-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toEqual({ index: 1, value: 48 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent crosshair", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <WinProbWorm data={GAME} width={220} height={32} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-win-prob-worm-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toEqual({ index: 1, value: 48 });
    fig.blur();
    await expect.poll(() => fig.querySelector(PIN)).not.toBeNull();
    await expect.poll(() => fig.querySelector(FOCUS)).toBeNull();
  });

  it("controlled selectedIndex pins the crosshair with no interaction", async () => {
    const screen = await render(
      <WinProbWorm data={GAME} width={220} height={32} selectedIndex={4} />,
    );
    const fig = screen.container.querySelector(".mc-win-prob-worm-live") as HTMLElement;
    expect(fig.querySelector(PIN)).not.toBeNull();
  });
});
