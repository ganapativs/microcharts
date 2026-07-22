import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Delta } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Delta>", () => {
  it("renders the static delta plus a polite live region", async () => {
    const screen = await render(<Delta value={0.12} />);
    const wrap =
      screen.container.querySelector(".mc-delta-live") ?? document.querySelector(".mc-delta-live")!;
    expect(wrap.querySelector('[role="img"]')).not.toBeNull();
    expect(wrap.querySelector('[aria-live="polite"]')!.textContent).toBe("Up 12%.");
  });

  it("live region tracks the current value; pulses on change", async () => {
    const screen = await render(<Delta value={0.1} />);
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("Up 10%.");
    await screen.rerender(<Delta value={-0.05} />);
    expect(live.textContent).toBe("Down 5%.");
    expect(document.querySelector('.mc-delta-live[data-pulse="1"]')).not.toBeNull();
  });

  it("live={false} → the live region stays mounted but says nothing", async () => {
    const screen = await render(<Delta value={0.1} live={false} />);
    // The region is the inline-seat host (shared/live-region.tsx), so it must
    // never be unmounted to silence a chart — silence is empty children.
    const region = screen.container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe("");
  });

  it("click fires onSelect with the encoded change", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Delta value={0.12} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-delta-live") as HTMLElement;
    wrap.click();
    expect(picks).toMatchObject([{ index: 0, value: 0.12 }]);
  });

  it("Enter fires onSelect from the focused wrapper", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Delta value={120} from={100} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-delta-live") as HTMLElement;
    expect(wrap.getAttribute("tabindex")).toBe("0");
    wrap.focus();
    key(wrap, "Enter");
    expect(picks).toMatchObject([{ index: 0, value: 0.2 }]);
  });
});
