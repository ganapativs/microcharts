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
});
