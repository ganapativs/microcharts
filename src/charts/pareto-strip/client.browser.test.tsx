import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ParetoStrip } from "./client.js";

const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
];

describe("interactive <ParetoStrip>", () => {
  it("arrow keys step bars; each announces share + cumulative", async () => {
    const screen = await render(<ParetoStrip data={CAUSES} width={200} title="Causes" />);
    const wrap = screen.container.querySelector(".mc-pareto-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect
      .poll(() => live.textContent)
      .toMatch(/^Timeouts: \d+% of total, cumulative \d+%\.$/);
    // a VISIBLE readout chip pairs share · cumulative
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/%\s*·\s*.*%/);
  });

  it("T jumps to the threshold-crossing bar", async () => {
    const screen = await render(
      <ParetoStrip data={CAUSES} width={200} threshold={80} title="Causes" />,
    );
    const wrap = screen.container.querySelector(".mc-pareto-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "T", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/cumulative \d+%\.$/);
  });

  it("onActive reports the focused datum (bar index + value + label); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <ParetoStrip data={CAUSES} width={200} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pareto-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toEqual({ index: 0, value: 38, label: "Timeouts" });
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await expect.poll(() => seen.at(-1)).toBeNull();
  });

  it("Enter selects the active bar: fires onSelect + pins an outline that survives blur", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <ParetoStrip data={CAUSES} width={200} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-pareto-strip-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await expect.poll(() => picks.at(-1)).toEqual({ index: 0, value: 38, label: "Timeouts" });
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('rect[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("controlled selectedIndex pins the outline without focus", async () => {
    const screen = await render(<ParetoStrip data={CAUSES} width={200} selectedIndex={1} />);
    expect(screen.container.querySelector('rect[data-mc-w="tick"]')).not.toBeNull();
  });
});
