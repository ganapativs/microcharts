import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { EtaBar } from "./client.js";

const min = (t: number) => `${Math.round(t)} min`;

describe("interactive <EtaBar>", () => {
  it("focus reveals the forecast readout + announces it", async () => {
    const screen = await render(
      <EtaBar
        progress={0.64}
        elapsed={3.6}
        rate={0.18}
        etaFormat={min}
        title="Export"
        width={160}
        height={16}
      />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    wrap.focus();
    // The chip carries the two numbers, not the sentence. It used to render the
    // whole accessible summary — 143px past its width cap, and a verbatim
    // duplicate of the aria-label sitting on the same element.
    // Default `label="eta"` already prints the remaining time in the gutter —
    // the chip adds only the percent (no redundant "2 min").
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("64%");
    // ...and the sentence is still there, where a screen reader reads it. The
    // test was named "+ announces it" but only ever checked the chip.
    expect(wrap.getAttribute("aria-label")).toBe(
      "Export. 64% done; about 2 min remaining at the current rate.",
    );
  });

  // Regression: the chip was wired to focus ONLY, so a mouse reader hovering
  // the bar saw nothing at all — every other reveal-on-hover scalar in the
  // library (Bullet, Thermometer, HeatCell, MoonPhase, OrbitStatus) took both.
  it("hover reveals the same readout as focus", async () => {
    const screen = await render(
      <EtaBar progress={0.64} elapsed={3.6} rate={0.18} etaFormat={min} width={160} height={16} />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    expect(chip()).toBeUndefined();
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("64%");
    await userEvent.unhover(wrap);
    await expect.poll(chip).toBeUndefined();
  });

  it('label="none" floats percent and ETA; label="percent" floats only the ETA', async () => {
    const none = await render(
      <EtaBar
        progress={0.64}
        elapsed={3.6}
        rate={0.18}
        etaFormat={min}
        label="none"
        width={160}
        height={16}
      />,
    );
    const nw = none.container.querySelector(".mc-eta-live") as HTMLElement;
    await userEvent.hover(nw);
    await expect
      .poll(() => none.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("64% · 2 min");

    const pct = await render(
      <EtaBar
        progress={0.64}
        elapsed={3.6}
        rate={0.18}
        etaFormat={min}
        label="percent"
        width={160}
        height={16}
      />,
    );
    const pw = pct.container.querySelector(".mc-eta-live") as HTMLElement;
    await userEvent.hover(pw);
    await expect
      .poll(() => pct.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("2 min");
  });

  it("readout={false} suppresses the chip on hover too", async () => {
    const screen = await render(
      <EtaBar progress={0.64} elapsed={3.6} rate={0.18} etaFormat={min} readout={false} />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    await userEvent.hover(wrap);
    wrap.focus();
    expect(screen.container.querySelector(".mc-spark-readout")).toBeNull();
  });

  it("click fires onSelect with the clamped progress", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <EtaBar progress={0.64} elapsed={3.6} rate={0.18} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    wrap.click();
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 0.64 });
  });

  it("Enter fires onSelect (and keeps the focus readout)", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <EtaBar progress={0.3} elapsed={1} rate={0.1} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 0.3 });
    expect(screen.container.querySelector(".mc-spark-readout")).not.toBeNull();
  });

  // The shared interaction contract (shared/interactive.ts): `onActive` reports
  // the hovered/focused unit and `null` when that clears — on the EDGE only, so
  // hover-then-focus is one announcement, not two.
  it("onActive reports the bar once, then null when the active state clears", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <EtaBar
        progress={0.64}
        elapsed={3.6}
        rate={0.18}
        etaFormat={min}
        width={160}
        height={16}
        onActive={(d) => seen.push(d)}
      />,
    );
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    await userEvent.hover(wrap);
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    await expect.poll(chip).toBe("64%");
    // the datum carries the chip's own string, so a consumer can render it
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 0.64, formatted: chip() });
    wrap.focus(); // already active — must not re-announce
    expect(seen.length).toBe(1);
    wrap.blur();
    await userEvent.unhover(wrap); // already cleared — must not re-announce
    await expect.poll(() => seen.at(-1)).toBeNull();
    expect(seen.length).toBe(2);
  });
});
