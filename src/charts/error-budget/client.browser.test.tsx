import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ErrorBudget } from "./client.js";

const OBSERVED = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <ErrorBudget>", () => {
  it("arrow keys step; the live region states remaining + burn rate", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} unit="day" title="SLO" />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toBe("day 1 of 30: 100% budget remaining, burning at 0× steady rate.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect
      .poll(() => live.textContent)
      .toBe("day 12 of 30: 62% budget remaining, burning at 0.6× steady rate.");
    // a VISIBLE readout chip shows remaining · rate
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("62% · 0.6×");
  });

  // Regression: the crosshair line and readout chip must share the same
  // gutter-aware width basis. The static reserves a right gutter for the
  // "remaining" label (viewBox wider than `width`); if the client recomputes
  // geometry without that gutter, its `totalWidth` is short and the readout %
  // runs ahead of the viewBox-drawn crosshair.
  it("crosshair line and readout chip share the gutter-aware width basis", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} title="SLO" />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => wrap.querySelector(".mc-spark-readout")).not.toBeNull();
    const svg = wrap.querySelector("svg")!;
    const vbWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
    const line = [...svg.querySelectorAll("line")].find(
      (l) => l.getAttribute("x1") === l.getAttribute("x2"),
    )!; // the vertical crosshair
    // The crosshair rides a transformed group so it can glide to the point it
    // names, so its painted x is `x1` plus that group's translation. Reading
    // `x1` alone would report 0 and pass against a chip stuck at the left edge.
    const group = line.parentElement as unknown as SVGGElement;
    const dx = /translateX\(([-\d.]+)px\)/.exec(group.style?.transform ?? "");
    const lineFrac = (Number(line.getAttribute("x1")) + (dx ? Number(dx[1]) : 0)) / vbWidth;
    const chip = wrap.querySelector(".mc-spark-readout") as HTMLElement;
    // The chip carries no per-datum `left` any more: placement moved wholly into
    // styles.css so the engine can clamp it to the screen (shared/interactive.ts
    // records why). This file renders without the stylesheet, so the testable
    // half of that contract is the half that lives in the markup — the chip must
    // ship NO inline positional style, because an inline `left` is exactly what
    // outranked the anchored insets and pushed the chip off its chart. The
    // crosshair still carries the datum x, inside the plot.
    expect(chip.style.left).toBe("");
    expect(chip.style.top).toBe("");
    expect(chip.style.transform).toBe("");
    expect(lineFrac).toBeGreaterThanOrEqual(0);
    expect(lineFrac).toBeLessThanOrEqual(1);
  });

  it("rapid arrow presses don't drop (functional updater)", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} title="SLO" />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toContain("day 3 of 30");
  });

  it("onActive reports the focused datum (step index + remaining fraction); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <ErrorBudget data={OBSERVED} window={30} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 0.96 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active step: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <ErrorBudget data={OBSERVED} window={30} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    wrap.focus();
    key(wrap, "Home");
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 0.96 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect.poll(() => wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const screen = await render(<ErrorBudget data={OBSERVED} window={30} selectedIndex={0} />);
    const wrap = screen.container.querySelector(".mc-error-budget-live") as HTMLElement;
    expect(wrap.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
