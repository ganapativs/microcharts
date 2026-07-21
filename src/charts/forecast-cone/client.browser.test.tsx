import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ForecastCone } from "./client.js";
import type { ForecastInput } from "./geometry.js";

const HIST = [30, 32, 31, 34, 36, 35, 38];
const FC: ForecastInput = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ],
};

// transient focus dot vs the persistent pin
const FOCUS = 'circle[data-mc-w="support"]';
const PIN = 'circle[data-mc-w="tick"]';

describe("interactive <ForecastCone>", () => {
  it("region-aware: history announces a value, forecast the median + interval", async () => {
    const screen = await render(<ForecastCone data={HIST} forecast={FC} title="Q4" />);
    const wrap = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 1: 30.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("week 11 (forecast): median 42, 80% between 33 and 55.");
    // a VISIBLE readout chip pairs median · interval in the forecast region
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("week 11: 42 · 33–55");
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<ForecastCone data={HIST} forecast={FC} title="Q4" />);
    const wrap = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("week 3: 31.");
  });

  it("onActive reports the focused datum (axis index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <ForecastCone data={HIST} forecast={FC} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 32 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent dot", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <ForecastCone data={HIST} forecast={FC} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 32 });
    fig.blur();
    await expect.poll(() => fig.querySelector(PIN)).not.toBeNull();
    await expect.poll(() => fig.querySelector(FOCUS)).toBeNull();
  });

  it("controlled selectedIndex pins the dot with no interaction", async () => {
    const screen = await render(<ForecastCone data={HIST} forecast={FC} selectedIndex={2} />);
    const fig = screen.container.querySelector(".mc-forecast-cone-live") as HTMLElement;
    expect(fig.querySelector(PIN)).not.toBeNull();
  });
});
