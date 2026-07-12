import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { EnsembleGhosts } from "./client.js";

const ENS = Array.from({ length: 12 }, (_, i) => [20, 20 + i, 31 + i * 2]);

describe("interactive <EnsembleGhosts>", () => {
  it("←/→ step members discretely, announcing each (the reduced-motion path)", async () => {
    const screen = await render(
      <EnsembleGhosts data={ENS} width={160} height={40} title="Futures" />,
    );
    const wrap = screen.container.querySelector(".mc-ensemble-ghosts-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Member \d+ of 12; ends at \d+\.$/);
    // stepping surfaces one member as a full-accent overlay path
    await expect.poll(() => wrap.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("Escape clears the emphasis and the announcement", async () => {
    const screen = await render(
      <EnsembleGhosts data={ENS} width={160} height={40} title="Futures" />,
    );
    const wrap = screen.container.querySelector(".mc-ensemble-ghosts-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("");
  });
});
