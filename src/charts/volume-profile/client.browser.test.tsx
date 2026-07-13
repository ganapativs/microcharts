import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { VolumeProfile } from "./client.js";

const PROFILE = [
  { level: 138, weight: 8 },
  { level: 140, weight: 14 },
  { level: 142, weight: 25 },
  { level: 144, weight: 13 },
  { level: 146, weight: 7 },
];

describe("interactive <VolumeProfile>", () => {
  it("↑/↓ rove levels; POC announces its clause", async () => {
    const screen = await render(
      <VolumeProfile data={PROFILE} bins={5} title="Volume" width={120} height={60} />,
    );
    const wrap = screen.container.querySelector(".mc-volprofile-live") as HTMLElement;
    wrap.focus();
    // default active = bottom bar (index n-1); ↑ three times reaches the POC (index 2)
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("(POC)");
  });
});
