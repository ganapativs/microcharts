import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MinimapStrip } from "./client.js";

const CONTENT = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 30) + 1);

describe("interactive <MinimapStrip> (plan/25 §10)", () => {
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
});
