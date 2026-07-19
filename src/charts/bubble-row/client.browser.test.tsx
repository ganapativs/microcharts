import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { BubbleRow } from "./client.js";

const REGIONS = [
  { label: "EMEA", value: 1240 },
  { label: "AMER", value: 890 },
  { label: "LATAM", value: 210 },
] as const;

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <BubbleRow>", () => {
  it("arrow keys rove and announce each bubble's exact value", async () => {
    const screen = await render(<BubbleRow data={REGIONS} title="Markets" />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    const live = fig.querySelector('[aria-live="polite"]')!;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("EMEA: 1,240.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live.textContent).toBe("AMER: 890.");
  });

  it("wrapper owns naming; static chart is decorative", async () => {
    const screen = await render(<BubbleRow data={REGIONS} title="Markets" />);
    const wrap = screen.container.querySelector(".mc-bubble-live")!;
    expect(wrap.getAttribute("aria-label")).toBe(
      "Markets. 3 items; largest EMEA at 1,240, smallest LATAM at 210.",
    );
    expect(wrap.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("onActive reports the focused datum; null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(<BubbleRow data={REGIONS} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bubble-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 0, value: 1240, label: "EMEA" });
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toEqual({ index: 1, value: 890, label: "AMER" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bubble: fires onSelect + pins a ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(<BubbleRow data={REGIONS} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-bubble-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toEqual({ index: 0, value: 1240, label: "EMEA" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<BubbleRow data={REGIONS} selectedIndex={1} />);
    expect(screen.container.querySelectorAll('circle[data-mc-w="tick"]')).toHaveLength(1);
  });
});
