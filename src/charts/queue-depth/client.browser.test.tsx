import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QueueDepth } from "./client.js";

const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const CAP = 100;

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
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBe("214");
  });
});
