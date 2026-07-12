import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Seismogram } from "./client.js";

const DATA = [0, 3, 0, 8, 0];

describe("interactive <Seismogram>", () => {
  it("arrow keys step slots; quiet slots announce no data", async () => {
    const screen = await render(<Seismogram data={DATA} title="Bursts" />);
    const wrap = screen.container.querySelector(".mc-seismo-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 2 of 5: 3.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 3 of 5: no data.");
  });

  it("Home/End jump to the first/last EVENT", async () => {
    const screen = await render(<Seismogram data={DATA} />);
    const wrap = screen.container.querySelector(".mc-seismo-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 4 of 5: 8.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 2 of 5: 3.");
  });
});
