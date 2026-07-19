import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DataDiff } from "./client.js";

const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DataDiff>", () => {
  it("arrow keys step rows; each announces added / removed / net", async () => {
    const screen = await render(<DataDiff data={DIFF} width={120} height={40} title="Diff" />);
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("users: +340 added, −120 removed, net +220.");
    // a VISIBLE readout chip pairs +added · −removed
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("+340 · −120");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("orders: +88 added, −30 removed, net +58.");
  });

  it("End jumps to the last row", async () => {
    const screen = await render(<DataDiff data={DIFF} width={120} height={40} title="Diff" />);
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^items:/);
  });

  it("onActive reports the focused row (row index + net); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <DataDiff data={DIFF} width={120} height={40} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    expect(seen.at(-1)).toEqual({ index: 0, value: 220, label: "users" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active row: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <DataDiff data={DIFF} width={120} height={40} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-data-diff-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 220, label: "users" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<DataDiff data={DIFF} width={120} height={40} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
