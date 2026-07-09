import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DataDiff } from "./client.js";

const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
];

describe("interactive <DataDiff> (plan/23 #16)", () => {
  it("arrow keys step rows; each announces added / removed / net", async () => {
    const screen = await render(<DataDiff data={DIFF} width={120} height={40} title="Diff" />);
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("users: +340 added, −120 removed, net +220.");
    // a VISIBLE readout chip pairs +added · −removed
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("+340 · −120");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("orders: +88 added, −30 removed, net +58.");
  });

  it("End jumps to the last row", async () => {
    const screen = await render(<DataDiff data={DIFF} width={120} height={40} title="Diff" />);
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^items:/);
  });
});
