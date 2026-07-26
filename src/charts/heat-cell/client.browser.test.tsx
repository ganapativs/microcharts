import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { HeatCell } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

describe("interactive <HeatCell>", () => {
  it("focus reveals the calibrated readout + announces it", async () => {
    const screen = await render(<HeatCell value={42} domain={[0, 100]} title="Load" />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toBe("Load. 42 — level 3 of 5.");
    wrap.focus();
    await expect
      .poll(() => document.querySelector(".mc-spark-readout")?.textContent)
      .toBe("42 — level 3 of 5");
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe("42 — level 3 of 5.");
  });

  it('label="value" suppresses the chip (numeral already on the cell)', async () => {
    const screen = await render(<HeatCell value={42} domain={[0, 100]} label="value" />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    wrap.focus();
    expect(document.querySelector(".mc-spark-readout")).toBeNull();
  });

  it("blur hides the readout", async () => {
    const screen = await render(<HeatCell value={42} domain={[0, 100]} />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    wrap.focus();
    await expect.poll(() => document.querySelector(".mc-spark-readout")).not.toBeNull();
    wrap.blur();
    await expect.poll(() => document.querySelector(".mc-spark-readout")).toBeNull();
  });

  it("click fires onSelect with the cell value", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <HeatCell value={42} domain={[0, 100]} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 42 });
  });

  it("Enter fires onSelect (readout stays)", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <HeatCell value={7} domain={[0, 100]} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 7 });
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the cell once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <HeatCell value={42} domain={[0, 100]} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("42 — level 3 of 5");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 42, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
