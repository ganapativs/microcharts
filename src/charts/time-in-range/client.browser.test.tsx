import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TimeInRange } from "./client.js";

describe("interactive <TimeInRange>", () => {
  it("←/→ rove zones from the first; each announces its share + a readout chip", async () => {
    const screen = await render(<TimeInRange data={{ below: 9, in: 72, above: 19 }} title="TIR" />);
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    // First arrow from nothing lands on zone 0 (the kernel contract).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("below: 9%.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("in range: 72%.");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).toBe("in range 72%");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("above: 19%.");
  });

  it("onActive reports the focused datum (zone index + percent + name); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 9, label: "below" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active zone: fires onSelect + pins an outline that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-tir-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: 72, label: "in range" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline with no interaction", async () => {
    const screen = await render(
      <TimeInRange data={{ below: 9, in: 72, above: 19 }} selectedIndex={1} />,
    );
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
