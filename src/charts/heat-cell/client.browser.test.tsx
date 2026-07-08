import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { HeatCell } from "./client.js";

describe("interactive <HeatCell> (plan/22 #3)", () => {
  it("focus reveals the calibrated readout + announces it", async () => {
    const screen = await render(<HeatCell value={42} domain={[0, 100]} title="Load" />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toBe("Load. 42 — level 3 of 5.");
    wrap.focus();
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("42");
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe("42 — level 3 of 5.");
  });

  it("blur hides the readout", async () => {
    const screen = await render(<HeatCell value={42} domain={[0, 100]} />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    wrap.focus();
    await expect.poll(() => document.querySelector(".mc-spark-readout")).not.toBeNull();
    wrap.blur();
    await expect.poll(() => document.querySelector(".mc-spark-readout")).toBeNull();
  });
});
