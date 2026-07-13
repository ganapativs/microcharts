import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { TraceFold } from "./client.js";

const ms = (n: number) => `${Math.round(n)} ms`;
const TRACE = [
  { label: "request", start: 0, duration: 200, depth: 0 },
  { label: "db", start: 10, duration: 120, depth: 1, parent: 0 },
  { label: "render", start: 130, duration: 60, depth: 1, parent: 0 },
];

describe("interactive <TraceFold>", () => {
  it("↓ then → roves spans; announces the span with depth + share", async () => {
    const screen = await render(
      <TraceFold data={TRACE} format={ms} title="Trace" width={200} height={30} />,
    );
    const wrap = screen.container.querySelector(".mc-trace-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toMatch(/(db|render), \d+ ms, \d+% of total, depth 1/);
  });
});
