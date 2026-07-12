import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Hypnogram } from "./client.js";

const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 10, state: "Light" },
  { t: 30, state: "Deep" },
  { t: 50, state: "Light" },
  { t: 90, state: "Awake" },
];

describe("interactive <Hypnogram>", () => {
  it("←/→ rove runs; each announces its state + span", async () => {
    const screen = await render(<Hypnogram data={SLEEP} domain={[0, 110]} title="Sleep" />);
    const wrap = screen.container.querySelector(".mc-hypno-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Light, from 10 to 30.");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).toBe("Light");
  });
});
