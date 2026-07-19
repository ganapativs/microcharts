import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DotPlot } from "./client.js";

const DATA = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <DotPlot>", () => {
  it("↑/↓ rove rows with rank announcements + focus ring", async () => {
    const screen = await render(<DotPlot data={DATA} title="Scores" />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    wrap.focus();
    // First arrow focuses row 0 (no skip-to-1).
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Ada: 96 — 1st of 3.");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("Kim: 41 — 3rd of 3.");
    key(wrap, "Home");
    await expect.poll(() => live.textContent).toBe("Ada: 96 — 1st of 3.");
    expect(wrap.querySelectorAll("circle").length).toBe(4); // 3 dots + ring
  });

  it("hover finds the row by y-band", async () => {
    const screen = await render(<DotPlot data={DATA} />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + 2, // first row
      }),
    );
    await expect
      .poll(() => document.querySelector(".mc-spark-readout")?.textContent)
      .toBe("Ada: 96");
  });

  it("onActive reports the focused datum (row index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<DotPlot data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown");
    await expect.poll(() => seen.at(-1)).toEqual({ index: 1, value: 41, label: "Kim" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active row: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<DotPlot data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 96, label: "Ada" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<DotPlot data={DATA} selectedIndex={2} />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
