import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { FillWord } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

describe("interactive <FillWord>", () => {
  it("announces changes through a polite region (leading edge)", async () => {
    const screen = await render(<FillWord word="uploading" value={0.2} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<FillWord word="uploading" value={0.6} />);
    await vi.waitFor(() => expect(live.textContent).toBe("uploading: 60% complete."));
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<FillWord word="uploading" value={0.62} title="Upload" />);
    const wrap = screen.container.querySelector(".mc-fillword-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Upload. uploading: 62% complete.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("click fires onSelect with the fill fraction + word", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FillWord word="uploading" value={0.62} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    wrap.click();
    await expect
      .poll(() => picks.at(-1))
      .toMatchObject({ index: 0, value: 0.62, label: "uploading" });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <FillWord word="uploading" value={0.2} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect
      .poll(() => picks.at(-1))
      .toMatchObject({ index: 0, value: 0.2, label: "uploading" });
  });

  it("hover reveals the percent the ink edge only approximates", async () => {
    const screen = await render(<FillWord word="Deploy" value={0.42} />);
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("42%");
    await pointerAway();
    await expect.poll(chip).toBeUndefined();

    // drain mode reads out what is LEFT, exactly like its own numeral does
    const drain = await render(<FillWord word="Deploy" value={0.42} mode="drain" />);
    const dw = drain.container.querySelector(".mc-fillword-live") as HTMLElement;
    await userEvent.hover(dw);
    await expect.poll(() => dw.querySelector(".mc-spark-readout")?.textContent).toBe("58%");

    // …and stays away when the numeral is printed
    const labelled = await render(<FillWord word="Deploy" value={0.42} label="value" />);
    const lw = labelled.container.querySelector(".mc-fillword-live") as HTMLElement;
    await userEvent.hover(lw);
    expect(lw.querySelector(".mc-spark-readout")).toBeNull();
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two.
  it("onActive reports the word once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <FillWord word="Deploy" value={0.42} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-fillword-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("42%");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({
      index: 0,
      value: 0.42,
      label: "Deploy",
      formatted: chip(),
    });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // Leave the mark BEFORE dropping focus. Blurring while the pointer is
    // still over it leaves a hovered-but-unfocused state, and the move away
    // then re-enters — two extra edges, order-dependent, the CI-only
    // `expected 4 to be 2` this file has flaked with twice.
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    wrap.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
