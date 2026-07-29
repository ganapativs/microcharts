import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { MinimapStrip } from "./client.js";

const CONTENT = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 30) + 1);

describe("interactive <MinimapStrip>", () => {
  it("→ nudges the viewport window and announces it", async () => {
    const screen = await render(
      <MinimapStrip
        data={{ content: CONTENT, window: [400, 500] }}
        domain={[0, 1000]}
        title="Doc"
        width={160}
        height={16}
      />,
    );
    const wrap = screen.container.querySelector(".mc-minimap-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Viewing 450 to 550 of 1,000.");
  });

  it("announces the unknown share it paints", async () => {
    // The fog comes from the composed static; the name here passed a flat 0, so
    // the interactive strip hatched half of itself and said nothing about it.
    const screen = await render(
      <MinimapStrip
        data={{ content: CONTENT, window: [0, 100], known: [[0, 500]] }}
        domain={[0, 1000]}
        width={160}
        height={16}
      />,
    );
    const wrap = screen.container.querySelector(".mc-minimap-live") as HTMLElement;
    expect(wrap.getAttribute("aria-label")).toContain("50% unknown");
  });

  it("shows the window range while dragging — not only to a screen reader", async () => {
    const screen = await render(
      <MinimapStrip
        data={{ content: CONTENT, window: [400, 500] }}
        domain={[0, 1000]}
        width={160}
        height={16}
      />,
    );
    const wrap = screen.container.querySelector(".mc-minimap-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    expect(chip()).toBeUndefined();
    await userEvent.hover(wrap);
    await expect.poll(chip).toBe("400–500");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(chip).toBe("450–550");
  });
});
