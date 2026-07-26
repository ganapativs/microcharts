import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { QuantileDots } from "./client.js";
import { QuantileDots as StaticQuantileDots } from "./index.js";

const UNIFORM = Array.from({ length: 20 }, (_, i) => i + 1); // 1..20

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <QuantileDots>", () => {
  it("idle with a prop threshold paints the odds label, not a sticky chip", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    expect(wrap.querySelector(".mc-spark-readout")).toBeNull();
    expect(wrap.querySelector('text[data-mc-ink="label"]')?.textContent).toBe("5 in 20");
  });

  // At rest this entry must paint what the static paints — the gallery swaps one
  // for the other in place, and a different box there is a visible jump.
  it("renders the static's own box for the same props", async () => {
    const props = { data: UNIFORM, threshold: 15, side: "above", width: 120 } as const;
    const live = await render(<QuantileDots {...props} />);
    const stat = await render(<StaticQuantileDots {...props} />);
    const vb = (root: HTMLElement) => root.querySelector("svg")!.getAttribute("viewBox");
    expect(vb(live.container)).toBe(vb(stat.container));
  });

  it("the probe: hovering recomputes the count past the live threshold", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const r = svg.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * 0.9,
        clientY: r.top + r.height / 2,
      }),
    );
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^\d+ in 20 chances above /);
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/^\d+ in 20 above \d+/);
    // The painted odds label tracks the live threshold too.
    expect(wrap.querySelector('text[data-mc-ink="label"]')?.textContent).toMatch(/^\d+ in 20$/);
  });

  // The gutter reserves the WIDEST odds string ("20 in 20"), so the count can
  // change under the cursor without the box resizing around it.
  it("viewBox width never changes while probing (no gutter reflow)", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" width={120} title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const vb = () => Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const idle = vb();
    expect(idle).toBeGreaterThan(120); // plot + reserved odds gutter

    const sr = svg.getBoundingClientRect();
    const at = (frac: number) =>
      wrap.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: sr.left + sr.width * frac,
          clientY: sr.top + sr.height / 2,
        }),
      );
    at(0.2);
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    expect(vb()).toBe(idle);
    at(0.85);
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")?.textContent).toMatch(/above/);
    expect(vb()).toBe(idle);
  });

  it("readout chip and crosshair line share the viewBox width basis", async () => {
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} side="above" width={120} title="Bus wait" />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    const svg = wrap.querySelector("svg")!;
    const sr = svg.getBoundingClientRect();
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: sr.left + sr.width * 0.4,
        clientY: sr.top + sr.height / 2,
      }),
    );
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();

    const vbWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const line = wrap.querySelector('line[data-mc-ink="muted"]') as SVGLineElement;
    const lineFrac = Number(line.getAttribute("x1")) / vbWidth;
    // Compare the AUTHORED anchor, not a measured box: this spec does not load
    // styles.css, so the chip has no `position: absolute` here and its rect
    // would describe normal flow rather than where it paints in a product.
    const chip = wrap.querySelector(".mc-spark-readout") as HTMLElement;
    const chipFrac = parseFloat(chip.style.left) / 100;
    expect(Math.abs(lineFrac - chipFrac)).toBeLessThan(0.02);
    expect(vbWidth).toBeGreaterThan(120); // the chip is anchored in the FULL box
  });

  it("Escape returns the probe to the prop threshold", async () => {
    const screen = await render(<QuantileDots data={UNIFORM} threshold={15} title="Wait" />);
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowLeft");
    key(wrap, "Escape");
    expect(wrap.querySelector('text[data-mc-ink="label"]')?.textContent).toBe("5 in 20");
  });

  it("onActive reports the focused quantile bin (column index + mass); null once cleared", async () => {
    const seen: { index: number; value: number | null }[] = [];
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} onActive={(d) => seen.push(d as never)} />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0 });
    expect(seen.at(-1)!.value).toBeGreaterThan(0);
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bin: fires onSelect + pins a threshold line", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <QuantileDots data={UNIFORM} threshold={15} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-quantile-dots-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1 });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-ink="accent"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the threshold line without focus", async () => {
    const screen = await render(<QuantileDots data={UNIFORM} threshold={15} selectedIndex={3} />);
    expect(screen.container.querySelector('line[data-mc-ink="accent"]')).not.toBeNull();
  });
});
