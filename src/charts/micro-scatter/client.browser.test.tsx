import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { MicroScatter } from "./client.js";

const DATA = [
  { x: 1, y: 10 },
  { x: 2, y: 30 },
  { x: 3, y: 20 },
];

describe("interactive <MicroScatter>", () => {
  it("←/→ step points ordered by x with pair announcements + ring", async () => {
    const screen = await render(<MicroScatter data={DATA} title="Correlation" />);
    const wrap = screen.container.querySelector(".mc-scatter-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 1 of 3: 1, 10.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 3 of 3: 3, 20.");
    expect(wrap.querySelectorAll("circle").length).toBe(4); // 3 dots + ring
  });

  it("hover finds the nearest point by Euclidean distance", async () => {
    const screen = await render(<MicroScatter data={DATA} />);
    const wrap = screen.container.querySelector(".mc-scatter-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 2,
        clientY: r.top + r.height - 2, // bottom-left → (1, 10)
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("1, 10");
  });

  it("onActive reports the focused point (y as value, x as label); null after Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(<MicroScatter data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-scatter-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 10, label: "1" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 30, label: "2" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(<MicroScatter data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-scatter-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 10, label: "1" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<MicroScatter data={DATA} selectedIndex={1} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
