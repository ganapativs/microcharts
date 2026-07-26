import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BreathingDot } from "./client.js";

describe("interactive <BreathingDot>", () => {
  it("pulses the core dot (motion IS the encoding)", async () => {
    const screen = await render(<BreathingDot value={0.65} title="Load" />);
    const core = screen.container.querySelector(".mc-breathing-core") as SVGCircleElement;
    await vi.waitFor(() => expect(core.getAnimations().length).toBeGreaterThan(0));
  });

  it("does not pulse when the value is unknown", async () => {
    const screen = await render(<BreathingDot value={null} title="Load" />);
    const core = screen.container.querySelector(".mc-breathing-core") as SVGCircleElement;
    // give the effect a tick; still no animation on an unknown dot
    await new Promise((r) => setTimeout(r, 50));
    expect(core.getAnimations().length).toBe(0);
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<BreathingDot value={0.42} title="Load" />);
    const wrap = screen.container.querySelector(".mc-breathing-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Load. Load 42% — calm.");
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("announces on band change only", async () => {
    const screen = await render(<BreathingDot value={0.2} title="Load" />);
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    // first render establishes the band; crossing into a new band announces it
    await screen.rerender(<BreathingDot value={0.9} title="Load" />);
    expect(live.textContent).toBe("Load 90% — strained.");
  });

  it("unknown value announces the unknown state (never looks calm)", async () => {
    const screen = await render(<BreathingDot value={0.2} title="Load" />);
    const live = screen.container.querySelector('[aria-live="polite"]')!;
    await screen.rerender(<BreathingDot value={null} title="Load" />);
    expect(live.textContent).toBe("Load unknown.");
    // no ring while unknown
    expect(screen.container.querySelectorAll("circle").length).toBe(1);
  });

  it("click fires onSelect with the level + band name", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BreathingDot value={0.9} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-breathing-live") as HTMLElement;
    wrap.click();
    await expect
      .poll(() => picks.at(-1))
      .toMatchObject({ index: 0, value: 0.9, label: "strained" });
  });

  it("Enter fires onSelect", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BreathingDot value={0.2} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-breathing-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 0.2, label: "calm" });
  });

  // Motion names the BAND; the level itself was invisible to a mouse reader
  // unless `label="value"` printed it. Hover/focus reveals it.
  it('hover reveals the load level; label="value" suppresses the chip', async () => {
    const screen = await render(<BreathingDot value={0.62} title="Load" />);
    const wrap = screen.container.querySelector(".mc-breathing-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    expect(chip()).toBeUndefined();
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("62% · elevated");
    await userEvent.unhover(wrap);
    await expect.poll(chip).toBeUndefined();

    // The number is already beside the dot — no second copy floating over it.
    const labelled = await render(<BreathingDot value={0.62} label="value" title="Load" />);
    const lw = labelled.container.querySelector(".mc-breathing-live") as HTMLElement;
    await userEvent.hover(lw);
    expect(lw.querySelector(".mc-spark-readout")).toBeNull();
  });
});
