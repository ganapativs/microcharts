import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Hourglass } from "./client.js";

describe("interactive <Hourglass>", () => {
  it("announces only when a documented threshold is crossed", async () => {
    const screen = await render(<Hourglass value={0.3} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    // 0.3 → 0.4: no threshold crossed → still quiet
    await screen.rerender(<Hourglass value={0.4} />);
    expect(live.textContent).toBe("");
    // 0.4 → 0.6: crosses 50% → announce
    await screen.rerender(<Hourglass value={0.6} />);
    await vi.waitFor(() => expect(live.textContent).toBe("60% elapsed, 40% remaining."));
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<Hourglass value={0.75} title="Session" />);
    const wrap = screen.container.querySelector(".mc-hourglass-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Session. 75% elapsed, 25% remaining.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the elapsed fraction", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Hourglass value={0.6} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 0.6 });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Hourglass value={0.25} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 0.25 });
  });

  it("hover reveals the elapsed percent; a printed label suppresses the chip", async () => {
    const screen = await render(<Hourglass value={0.42} title="Trial" />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("42%");
    await userEvent.unhover(wrap);
    await expect.poll(chip).toBeUndefined();

    const labelled = await render(<Hourglass value={0.42} label="remaining" title="Trial" />);
    const lw = labelled.container.querySelector(".mc-hourglass-live") as HTMLElement;
    await userEvent.hover(lw);
    expect(lw.querySelector(".mc-spark-readout")).toBeNull();
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two.
  it("onActive reports the glyph once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Hourglass value={0.42} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-hourglass-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("42%");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.42, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    wrap.blur();
    await userEvent.unhover(wrap); // already cleared — must not re-announce
    await expect.poll(() => seen.at(-1)).toBeNull();
    expect(seen.length).toBe(2);
  });
});
