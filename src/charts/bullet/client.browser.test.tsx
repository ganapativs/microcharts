import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Bullet } from "./client.js";
import { pointerAway } from "../../test/pointer.js";

const mount = async (ui: React.ReactNode) => {
  const screen = await render(ui);
  return screen.getByRole("img").element() as HTMLElement;
};

describe("interactive <Bullet>", () => {
  it("focusable role=img with the composed name; inner chart is decorative", async () => {
    const fig = await mount(<Bullet value={72} target={80} title="Sales" />);
    expect(fig.getAttribute("tabindex")).toBe("0");
    expect(fig.getAttribute("aria-label")).toMatch(/Sales\. 72 of 80 target\./);
    expect(fig.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("focus reveals a value/target readout; blur hides it", async () => {
    const fig = await mount(<Bullet value={72} target={80} />);
    fig.focus();
    await expect
      .poll(() => fig.querySelector(".mc-spark-readout")?.textContent)
      .toBe("72 / 80 · −8");
    fig.blur();
    await expect.poll(() => fig.querySelector(".mc-spark-readout")).toBe(null);
  });

  it("click fires onSelect with the measure (not the target)", async () => {
    const picks: unknown[] = [];
    const fig = await mount(<Bullet value={72} target={80} onSelect={(d) => picks.push(d)} />);
    fig.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 72 });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const fig = await mount(<Bullet value={72} target={80} onSelect={(d) => picks.push(d)} />);
    fig.focus();
    fig.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 72 });
  });

  // The chip states the SIGNED GAP to target; the accessible name states only
  // value and target. Without a live region a screen-reader user never got the
  // gap — Bullet was the one interactive entry with no announcement channel.
  it("announces the same reading the chip shows", async () => {
    const fig = await mount(<Bullet value={72} target={80} title="Sales" />);
    const live = fig.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    fig.focus();
    await expect.poll(() => live.textContent).toBe("72 / 80 · −8");
    await expect
      .poll(() => fig.querySelector(".mc-spark-readout")?.textContent)
      .toBe(live.textContent);
    fig.blur();
    await expect.poll(() => live.textContent).toBe("");
  });

  // `Intl` formats NaN as "NaN" and Infinity as "∞", and both reached the chip
  // and the live region verbatim while the name beside them said "No data.".
  it("a non-finite value reads as an em-dash, never as NaN", async () => {
    const fig = await mount(<Bullet value={Number.NaN} target={80} />);
    fig.focus();
    await expect.poll(() => fig.querySelector(".mc-spark-readout")?.textContent).toBe("— / 80");
    expect(fig.querySelector('[aria-live="polite"]')!.textContent).toBe("— / 80");
    expect(fig.getAttribute("aria-label")).toBe("No data.");
  });

  it("a non-finite value with no target reads as an em-dash", async () => {
    const fig = await mount(<Bullet value={Number.POSITIVE_INFINITY} />);
    fig.focus();
    await expect.poll(() => fig.querySelector(".mc-spark-readout")?.textContent).toBe("—");
  });

  // Edge-only `onActive` — shared/interactive.ts; pointerAway() before blur (src/test/pointer.ts).
  it("onActive reports the measure once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const fig = await mount(<Bullet value={72} target={80} onActive={(d) => seen.push(d)} />);
    await userEvent.hover(fig);
    const chip = () => fig.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("72 / 80 · −8");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 72, formatted: chip() });
    fig.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    // pointerAway before blur — see src/test/pointer.ts (hover+blur order flakes edge counts).
    await pointerAway();
    await expect.poll(() => seen.at(-1)).toBeNull();
    fig.blur(); // already cleared — must not re-announce
    expect(seen.length).toBe(2);
  });
});
