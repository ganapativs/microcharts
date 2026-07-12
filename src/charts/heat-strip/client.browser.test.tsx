import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { HeatStrip } from "./client.js";

const DATA = [3, 9, null, 18];

describe("interactive <HeatStrip>", () => {
  it("arrow keys rove cells with ActivityGrid-parity announcements + ring", async () => {
    const screen = await render(<HeatStrip data={DATA} title="Load" />);
    const wrap = screen.container.querySelector(".mc-heat-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 2 of 4: 9.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 3 of 4: no data.");
    // ring overlay present
    expect(wrap.querySelectorAll("svg rect").length).toBe(5); // 4 cells + ring
  });

  it("hover finds the cell by band lookup", async () => {
    const screen = await render(<HeatStrip data={DATA} />);
    const wrap = screen.container.querySelector(".mc-heat-strip-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width - 2,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("18");
  });
});
