import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BenchmarkStrip } from "./client.js";

const PEERS = Array.from({ length: 40 }, (_, i) => i + 1);

describe("interactive <BenchmarkStrip>", () => {
  it("arrow keys step the quantile edges with named announcements", async () => {
    const screen = await render(
      <BenchmarkStrip
        data={PEERS}
        value={20}
        format={{ maximumFractionDigits: 0 }}
        title="Latency"
      />,
    );
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("p5: 3.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("p95: 38.");
    // crosshair overlay present
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(2);
  });

  it("hover snaps to the nearest edge", async () => {
    const screen = await render(<BenchmarkStrip data={PEERS} value={20} />);
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBeTruthy();
  });
});
