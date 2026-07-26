import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { PictogramRow } from "./client.js";

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <PictogramRow>", () => {
  it("wrapper owns naming; quiet on mount; announces value changes", async () => {
    const screen = await render(<PictogramRow value={5} total={8} title="Seats" />);
    const wrap = screen.container.querySelector(".mc-pictogram-live")!;
    expect(wrap.getAttribute("aria-label")).toBe("Seats. 5 of 8.");
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("");
    await screen.rerender(<PictogramRow value={6} total={8} title="Seats" />);
    await expect.poll(() => live.textContent).toBe("6 of 8.");
  });

  it("live={false} → the live region stays mounted but says nothing", async () => {
    const screen = await render(<PictogramRow value={5} total={8} live={false} />);
    // The region is the inline-seat host (shared/live-region.tsx), so it must
    // never be unmounted to silence a chart — silence is empty children.
    const region = screen.container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe("");
  });

  it("onActive reports the focused unit (value = its fill fraction); null once cleared", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <PictogramRow value={5.5} total={8} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight"); // unit 0 — filled
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 1 });
    key(wrap, "End"); // last unit — empty
    expect(seen.at(-1)).toMatchObject({ index: 7, value: 0 });
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight"); // unit 5 — the partial one
    expect(seen.at(-1)).toMatchObject({ index: 5, value: 0.5 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active unit: fires onSelect + pins a ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <PictogramRow value={5} total={8} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 1 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("roving announces each unit — filled, empty, and the partly-filled one", async () => {
    const screen = await render(<PictogramRow value={5.5} total={8} title="Seats" />);
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    key(wrap, "Home"); // unit 0 — filled
    await expect.poll(() => live.textContent).toBe("Unit 1 of 8 — filled.");
    key(wrap, "End"); // unit 7 — empty
    await expect.poll(() => live.textContent).toBe("Unit 8 of 8 — empty.");
    key(wrap, "Home");
    for (let i = 0; i < 5; i++) key(wrap, "ArrowRight"); // unit 5 — half filled
    await expect.poll(() => live.textContent).toBe("Unit 6 of 8 — 50% filled.");
  });

  it("clearing the roving falls back to the value-change announcement", async () => {
    const screen = await render(<PictogramRow value={5} total={8} title="Seats" />);
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => live.textContent).toBe("Unit 1 of 8 — filled.");
    key(wrap, "Escape");
    await expect.poll(() => live.textContent).toBe("");
  });

  it("a custom `strings` owns the unit announcement (no hardcoded English)", async () => {
    const screen = await render(
      <PictogramRow
        value={5}
        total={8}
        strings={{
          noData: "Aucune donnée.",
          scalarDir: (dir, amt) => `${dir} ${amt}.`,
          flatChange: "Aucun changement.",
          status: (s) => `${s}.`,
          level: (v, l, s) => `${v} ${l}/${s}.`,
          levelChip: (v, l, s) => `${v} ${l}/${s}`,
          progress: (p) => `${p}.`,
          remaining: (p) => `${p}.`,
          stepsDone: (d, t) => `${d}/${t}.`,
          countOf: (v, t) => `${v} sur ${t}.`,
          pictogramUnit: (i, n, fill) => `Unité ${i} sur ${n} — ${fill}.`,
          pictogramChip: (i, n, fill) => `${i} sur ${n} — ${fill}`,
        }}
      />,
    );
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    const live = document.querySelector('[aria-live="polite"]')!;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => live.textContent).toBe("Unité 1 sur 8 — full.");
    // The VISIBLE chip is translated too — no English leaks into the painted UI.
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("1 sur 8 — full");
  });

  it("controlled selectedIndex pins the ring without focus", async () => {
    const screen = await render(<PictogramRow value={5} total={8} selectedIndex={2} />);
    expect(screen.container.querySelectorAll('circle[data-mc-w="tick"]')).toHaveLength(1);
  });

  // Full, empty and the partly-filled unit each read out — the partial one is
  // the whole reason this chart's chip cannot just be "filled/empty".
  it("roving paints the unit's reading as a chip; `formatted` mirrors it", async () => {
    const seen: { formatted?: string | undefined }[] = [];
    const screen = await render(
      <PictogramRow value={5.4} total={8} onActive={(d) => d && seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    const chip = () => screen.container.querySelector(".mc-spark-readout")?.textContent;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(chip).toBe("1 of 8 — filled");
    expect(seen.at(-1)?.formatted).toBe("1 of 8 — filled");
    for (let i = 0; i < 5; i++) key(wrap, "ArrowRight");
    await expect.poll(chip).toBe("6 of 8 — 40%");
    key(wrap, "End");
    await expect.poll(chip).toBe("8 of 8 — empty");
  });

  it("readout={false} drops the chip and keeps the ring + callback", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <PictogramRow value={5} total={8} readout={false} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pictogram-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => seen.at(-1)).toMatchObject({ formatted: "1 of 8 — filled" });
    expect(screen.container.querySelector('circle[data-mc-w="full"]')).not.toBeNull();
    expect(screen.container.querySelector(".mc-spark-readout")).toBeNull();
  });
});
