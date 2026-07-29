import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Dumbbell } from "./client.js";

const DATA = [
  { label: "Paris", from: 50, to: 55 },
  { label: "Berlin", from: 48, to: 68 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

const cx = (c: Element) => Number(c.getAttribute("cx"));

describe("interactive <Dumbbell>", () => {
  it("↑/↓ rove rows, announcing each pair's change", async () => {
    const screen = await render(<Dumbbell data={DATA} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    // First arrow focuses row 0 (no skip-to-1).
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("From 50 to 55, up 10%.");
    key(wrap, "ArrowDown");
    await expect.poll(() => live.textContent).toBe("From 48 to 68, up 42%.");
  });

  it("a pair with a non-finite endpoint announces no data without throwing", async () => {
    const gappy = [
      { label: "Paris", from: 50, to: 55 },
      { label: "Berlin", from: 48, to: Number.NaN },
    ];
    const screen = await render(<Dumbbell data={gappy} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "ArrowDown"); // Berlin: NaN endpoint
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("No data.");
  });

  it("onActive reports the focused datum (row index + `to` value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Dumbbell data={DATA} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 55, label: "Paris" });
    key(wrap, "Escape");
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active row: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Dumbbell data={DATA} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 55, label: "Paris" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  // The client re-derives the label gutter to place its overlay rings while the
  // dots come from the composed static entry. Only the static path used to drop
  // the names under a crowded pitch, so on a short box the client reserved a
  // 56-unit gutter the painted chart never had and every ring sat that far right
  // of its dot. Both entries now read one budget (dumbbellLabelChars).
  it("the focus ring lands on its dot when the row names drop", async () => {
    const rows = [
      { label: "East", from: 47, to: 1 },
      { label: "West", from: 41, to: 53 },
      { label: "South", from: 33, to: 43 },
      { label: "North", from: 44, to: 57 },
      { label: "Mid", from: 20, to: 26 },
    ];
    const screen = await render(<Dumbbell data={rows} width={77} height={28} title="Bands" />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    await expect.poll(() => wrap.querySelectorAll('circle[r="3.25"]').length).toBe(2);
    const dots = [...wrap.querySelectorAll("circle")]
      .filter((c) => c.getAttribute("r") !== "3.25")
      .map(cx);
    for (const ring of wrap.querySelectorAll('circle[r="3.25"]')) {
      expect(dots).toContain(cx(ring));
    }
  });

  it("a change against a zero base reads as a direction, not an empty percent", async () => {
    const screen = await render(<Dumbbell data={[{ label: "Berlin", from: 0, to: 5 }]} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    // `pairChange` has no percent against a zero base; the chip printed "(up )".
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("0 → 5 (up)");
  });

  it("controlled selectedIndex pins the mark without focus", async () => {
    const screen = await render(<Dumbbell data={DATA} selectedIndex={1} />);
    const wrap = screen.container.querySelector(".mc-dumbbell-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
