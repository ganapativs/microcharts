import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Delta } from "./client.js";

describe("interactive <Delta> (plan/04 §4, plan/08 §5)", () => {
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

  it("live={false} → no live region", async () => {
    await render(<Delta value={0.1} live={false} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });
});
