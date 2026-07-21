import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Hypnogram } from "./client.js";

const SLEEP = [
  { t: 0, state: "Awake" },
  { t: 10, state: "Light" },
  { t: 30, state: "Deep" },
  { t: 50, state: "Light" },
  { t: 90, state: "Awake" },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <Hypnogram>", () => {
  it("←/→ rove runs; each announces its state + span", async () => {
    const screen = await render(<Hypnogram data={SLEEP} domain={[0, 110]} title="Sleep" />);
    const wrap = screen.container.querySelector(".mc-hypno-live") as HTMLElement;
    wrap.focus();
    // First arrow lands on run 0 (the kernel's shared convention).
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Awake, from 0 to 10.");
    key(wrap, "ArrowRight");
    await expect.poll(() => live.textContent).toBe("Light, from 10 to 30.");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).toBe("Light 10–30");
  });

  it("onActive reports the focused run (index = run, value = duration)", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <Hypnogram data={SLEEP} domain={[0, 110]} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-hypno-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 10, label: "Awake" });
    key(wrap, "End");
    expect(seen.at(-1)).toMatchObject({ index: 4, value: 20, label: "Awake" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active run: fires onSelect + pins an outline", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <Hypnogram data={SLEEP} domain={[0, 110]} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-hypno-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 20, label: "Light" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<Hypnogram data={SLEEP} domain={[0, 110]} selectedIndex={2} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
