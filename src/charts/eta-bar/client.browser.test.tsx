import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
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
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("64% · 2 min");
    // ...and the sentence is still there, where a screen reader reads it. The
    // test was named "+ announces it" but only ever checked the chip.
    expect(wrap.getAttribute("aria-label")).toBe(
      "Export. 64% done; about 2 min remaining at the current rate.",
    );
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
});
