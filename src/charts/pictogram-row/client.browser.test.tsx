import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PictogramRow } from "./client.js";

describe("interactive <PictogramRow> (plan/22 #7)", () => {
  it("wrapper owns naming; quiet on mount; announces value changes", async () => {
    const screen = await render(<PictogramRow value={5} total={8} title="Seats" />);
    const wrap = screen.container.querySelector(".mc-pictogram-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Seats. 5 of 8.");
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<PictogramRow value={6} total={8} title="Seats" />);
    await expect.poll(() => live.textContent).toBe("6 of 8.");
  });

  it("live={false} → no live region", async () => {
    await render(<PictogramRow value={5} total={8} live={false} />);
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });
});
