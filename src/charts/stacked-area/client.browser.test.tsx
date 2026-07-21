import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { StackedArea } from "./client.js";

const TRAFFIC = [
  { label: "Mobile", values: [30, 40, 45] },
  { label: "Web", values: [40, 38, 38] },
  { label: "API", values: [15, 17, 17] },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <StackedArea>", () => {
  it("←/→ steps x announcing every layer's share", async () => {
    const screen = await render(<StackedArea data={TRAFFIC} title="Mix" />);
    const wrap = screen.container.querySelector(".mc-stacked-live") as HTMLElement;
    wrap.focus();
    key(wrap, "End");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: Mobile 45%, Web 38%, API 17%.");
  });

  it("onActive reports the focused column (index + stack total); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<StackedArea data={TRAFFIC} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-stacked-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 1, value: 95 });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active column: fires onSelect + pins a persistent crosshair", async () => {
    const picks: unknown[] = [];
    const screen = await render(<StackedArea data={TRAFFIC} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-stacked-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 1, value: 95 });
    wrap.blur();
    await expect.poll(() => wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the crosshair without focus", async () => {
    const screen = await render(<StackedArea data={TRAFFIC} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-stacked-live") as HTMLElement;
    expect(wrap.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
