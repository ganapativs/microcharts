import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { IconArray } from "./client.js";

describe("interactive <IconArray>", () => {
  it("2-D roving announces the running count", async () => {
    const screen = await render(<IconArray value={0.15} total={20} title="Risk" />);
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Unit 1 of 20 — filled. 3 of 20 filled.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Unit 11 of 20 — empty. 3 of 20 filled.");
    expect(wrap.querySelectorAll("svg rect").length).toBe(21); // 20 units + ring
  });

  it("hover finds the nearest unit", async () => {
    const screen = await render(<IconArray value={0.5} total={20} />);
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + 1,
        clientY: r.top + 1,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    // top-left corner → the first unit; running count is always stated
    await expect.poll(() => live.textContent).toBe("Unit 1 of 20 — filled. 10 of 20 filled.");
  });

  it("onActive reports the focused datum (unit index + filled state); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    // k = 3, so unit 0 is filled → value 1.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 1 });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active unit: fires onSelect + pins a ring that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toMatchObject({ index: 0, value: 1 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<IconArray value={0.15} total={20} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });

  // Roving used to light a ring and speak the unit while showing nothing: the
  // chip is the sighted half of that same reading, and `formatted` mirrors it.
  it("roving paints the unit's reading as a chip; `formatted` mirrors it", async () => {
    const seen: { formatted?: string | undefined }[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onActive={(d) => d && seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("1 of 20 — filled");
    expect(seen.at(-1)?.formatted).toBe("1 of 20 — filled");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("20 of 20 — empty");
  });

  it("readout={false} drops the chip and keeps the ring + callback", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} readout={false} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toMatchObject({ formatted: "1 of 20 — filled" });
    expect(screen.container.querySelector('rect[data-mc-w="full"]')).not.toBeNull();
    expect(screen.container.querySelector(".mc-spark-readout")).toBeNull();
  });

  // Regression: an unguarded GRID_DIMS lookup threw here too, so a bad `total`
  // killed the wrapper before the picker existed. The picker must rove the same
  // 20 units the static entry paints.
  it("a denominator with no designed grid roves the fallback 20-unit grid", async () => {
    const screen = await render(<IconArray value={0.15} total={7 as never} />);
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    expect(wrap.querySelectorAll("svg rect").length).toBe(20);
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("20 of 20 — empty");
  });

  it("a custom `strings` owns the chip text (no hardcoded English)", async () => {
    const screen = await render(
      <IconArray
        value={0.15}
        total={20}
        strings={{
          noData: "Aucune donnée.",
          iconArray: (k, n) => `${k} sur ${n}.`,
          iconArrayRatio: (k, n) => `${k} sur ${n}`,
          iconArrayUnit: (i, n, filled) => `Unité ${i} sur ${n} — ${filled ? "plein" : "vide"}.`,
          iconArrayChip: (i, n, filled) => `${i}/${n} ${filled ? "plein" : "vide"}`,
        }}
      />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("1/20 plein");
  });
});

// The idle rule ("a first arrow from nothing focuses unit 0") sat ahead of the
// key filter, so it caught every key. The first Tab or letter after an idle
// reset activated unit 0, fired onActive, and preventDefault swallowed the
// keystroke.
describe("interactive <IconArray> while idle", () => {
  it("ignores a non-roving key instead of activating unit 0", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <IconArray value={0.15} total={20} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-icon-array-live") as HTMLElement;
    wrap.focus();
    const ev = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    wrap.dispatchEvent(ev);
    await new Promise((r) => setTimeout(r, 50));
    expect(seen).toEqual([]);
    expect(ev.defaultPrevented).toBe(false);
    expect(screen.container.querySelector("rect[data-mc-active]")).toBeNull();
    // …and the roving keys still work.
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => (seen.at(-1) as { index?: number } | null)?.index).toBe(0);
  });
});
