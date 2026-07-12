import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DualWindowMeter } from "./client.js";

const NOISE = Array.from({ length: 40 }, (_, i) => 74 + Math.sin(i / 4) * 3);

describe("interactive <DualWindowMeter>", () => {
  it("←/→ rove points; announces fast, slow, target", async () => {
    const screen = await render(
      <DualWindowMeter data={NOISE} target={75} title="Loudness" width={160} height={24} />,
    );
    const wrap = screen.container.querySelector(".mc-dualwin-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/fast .+, slow .+, target 75\./);
  });
});
