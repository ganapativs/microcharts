import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ABStrips } from "./client.js";

const A = Array.from({ length: 60 }, (_, i) => 130 + ((i * 7) % 30) - 15);
const B = Array.from({ length: 60 }, (_, i) => 118 + ((i * 7) % 30) - 15);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <ABStrips>", () => {
  it("arrows: ↓ picks row B, → steps edges; median announces the delta", async () => {
    const screen = await render(<ABStrips data={{ a: A, b: B }} title="A/B" />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    // ↓ picks row B and lands on the median edge by default
    key(wrap, "ArrowDown");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^B median [\d.]+, [\d.]+ below A\.$/);
    // readout chip present
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toBeTruthy();
  });

  it("a non-median edge announces the percentile", async () => {
    const screen = await render(<ABStrips data={{ a: A, b: B }} title="A/B" />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    for (let i = 0; i < 4; i++) key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^B p95: [\d.]+\.$/);
  });

  it("onActive reports the focused edge (row·edge index + quantile value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<ABStrips data={{ a: A, b: B }} onActive={(d) => seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    expect(seen.at(-1)).toMatchObject({ index: 7, label: "B p50" });
    expect((seen.at(-1) as { value: number }).value).toBeTypeOf("number");
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active edge: fires onSelect + pins a persistent dot", async () => {
    const picks: unknown[] = [];
    const screen = await render(<ABStrips data={{ a: A, b: B }} onSelect={(d) => picks.push(d)} />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 7, label: "B p50" });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("mirrors the static's tag drop, so the focus ring lands on the band", async () => {
    // Both entries gate the row tags through `abTagChars`. When a long identity
    // drops them, a client copy that kept reserving the lead would compute a
    // wider box than the composed static and slide every overlay off the marks.
    const screen = await render(
      <ABStrips
        data={{ a: A, b: B }}
        width={80}
        height={40}
        seriesLabels={["Control cohort 2024", "Treatment cohort"]}
      />,
    );
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowDown");
    key(wrap, "Home"); // row B, p5 — the left edge of B's outer band
    await expect
      .poll(() => screen.container.querySelector('circle[data-mc-w="support"]'))
      .not.toBeNull();
    const bOuter = [...screen.container.querySelectorAll("rect")].find(
      (r) => r.getAttribute("fill") === "var(--mc-accent)",
    )!;
    const ring = screen.container.querySelector('circle[data-mc-w="support"]')!;
    expect(screen.container.querySelectorAll("text").length).toBe(1); // delta only
    expect(Number(ring.getAttribute("cx"))).toBeCloseTo(Number(bOuter.getAttribute("x")), 2);
  });

  it("controlled selectedIndex pins the dot without focus", async () => {
    const screen = await render(<ABStrips data={{ a: A, b: B }} selectedIndex={2} />);
    expect(screen.container.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
