import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Dumbbell } from "./client.js";

const DATA = [
  { label: "Paris", from: 50, to: 55 },
  { label: "Berlin", from: 48, to: 68 },
];

describe("interactive <Dumbbell> (plan/22 #11)", () => {
  it("↑/↓ rove rows; ←/→ toggle from/to announcements", async () => {
    const screen = await render(<Dumbbell data={DATA} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("From 48 to 68, up 42%.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("From: 48.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("To: 68.");
  });
});
