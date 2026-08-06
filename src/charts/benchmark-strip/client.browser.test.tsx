import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { BenchmarkStrip } from "./client.js";

const PEERS = Array.from({ length: 40 }, (_, i) => i + 1);

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <BenchmarkStrip>", () => {
  it("arrow keys step the quantile edges with named announcements", async () => {
    const screen = await render(
      <BenchmarkStrip
        data={PEERS}
        value={20}
        format={{ maximumFractionDigits: 0 }}
        title="Latency"
      />,
    );
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("p5: 3.");
    key(wrap, "End");
    await expect.poll(() => live.textContent).toBe("p95: 38.");
    // crosshair overlay present
    expect(wrap.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(2);
  });

  it("hover snaps to the nearest edge", async () => {
    const screen = await render(<BenchmarkStrip data={PEERS} value={20} />);
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => document.querySelector(".mc-spark-readout")?.textContent).toBeTruthy();
  });

  it("onActive reports the focused edge (index + value + name); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <BenchmarkStrip data={PEERS} value={20} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: expect.any(Number), label: "p5" });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active edge: fires onSelect + pins a tick that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <BenchmarkStrip data={PEERS} value={20} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: expect.any(Number), label: "p5" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("label='value' keeps the readout anchored to the static's viewBox", async () => {
    // The gutter a long readout reserves widens the viewBox, and the client
    // computes its own copy of the geometry. Both entries must reserve the
    // same gutter: the chip's `left` is a percentage of the client's
    // totalWidth, so a stale hardcoded 4 would park it off its own tick.
    const screen = await render(
      <BenchmarkStrip
        data={[-1e6, -2e6, -3e6, -4e6, -5e6, -6e6, -7e6, -8e6]}
        value={-1234567.89}
        label="value"
      />,
    );
    const wrap = screen.container.querySelector(".mc-benchmark-strip-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    await expect.poll(() => document.querySelector(".mc-spark-readout")).not.toBeNull();
    const chip = document.querySelector(".mc-spark-readout") as HTMLElement;
    // The tick is carried on a transform so it can glide to the edge it names,
    // so its painted x is `x1` plus that translation — reading `x1` alone would
    // report 0 and pass against a chip pinned to the left edge.
    const line = wrap.querySelector("svg line[data-mc-ink='accent']") as SVGLineElement;
    const dx = /translateX\(([-\d.]+)px\)/.exec(line.style.transform);
    const tickX = Number(line.getAttribute("x1")) + (dx ? Number(dx[1]) : 0);
    const vbWidth = Number(wrap.querySelector("svg")!.getAttribute("viewBox")!.split(" ")[2]);
    // Placement moved into styles.css so the chip can be clamped to the screen
    // (shared/interactive.ts records why); this file renders without the
    // stylesheet, so what stays testable is that the chip ships no inline
    // positional style, and the tick it names is still inside the viewBox.
    expect(chip.style.left).toBe("");
    expect(chip.style.transform).toBe("");
    expect(tickX).toBeGreaterThanOrEqual(0);
    expect(tickX).toBeLessThanOrEqual(vbWidth);
  });

  it("controlled selectedIndex pins the tick without focus", async () => {
    const screen = await render(<BenchmarkStrip data={PEERS} value={20} selectedIndex={2} />);
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});
