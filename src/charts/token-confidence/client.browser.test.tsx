import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TokenConfidence } from "./client.js";

const SENT = [
  { token: "The", confidence: 0.98 },
  { token: " Paris", confidence: 0.62 },
  { token: " guess", confidence: 0.22 },
];

describe("interactive <TokenConfidence> (plan/25 §7)", () => {
  it("→ roves flagged tokens (skips confident); announces tier + confidence", async () => {
    const screen = await render(<TokenConfidence data={SENT} title="Answer" />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    const first = host.querySelector('[tabindex="0"]') as HTMLElement;
    first.focus();
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = host.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("guess: guessing, 0.22.");
  });
});
