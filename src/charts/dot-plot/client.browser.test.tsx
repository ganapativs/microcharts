import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { DotPlot } from "./client.js";

const DATA = [
  { label: "Ada", value: 96 },
  { label: "Kim", value: 41 },
  { label: "Sam", value: 88 },
];

describe("interactive <DotPlot> (plan/22 #10)", () => {
  it("↑/↓ rove rows with rank announcements + focus ring", async () => {
    const screen = await render(<DotPlot data={DATA} title="Scores" />);
    const wrap = screen.container.querySelector(".mc-dotplot-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Kim: 41 — 3rd of 3.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
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
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBe("96");
  });
});
