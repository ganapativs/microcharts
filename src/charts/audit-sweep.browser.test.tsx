import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ABStrips } from "./ab-strips/client.js";
import { DicePips } from "./dice-pips/client.js";
import { HeatCell } from "./heat-cell/client.js";
import { ConfusionGrid } from "./confusion-grid/client.js";
import { Waterfall } from "./waterfall/client.js";
import { TreeRings } from "./tree-rings/client.js";
import { ErrorBudget } from "./error-budget/client.js";
import { EtaBar } from "./eta-bar/client.js";
import { CitySkyline } from "./city-skyline/client.js";
import { GradeProfile } from "./grade-profile/client.js";
import { PercentileLadder } from "./percentile-ladder/client.js";

// Interactive half of the 2026-09 audit sweep: the readout, the live region and
// the `onActive` payload must say what the paint shows — never a fabricated
// finite value, never a raw non-finite one, never the other row's sign.

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
const live = () => document.querySelector('[aria-live="polite"]')!;

describe("audit sweep — readouts say what the paint shows", () => {
  it("<ABStrips> row A announces its own side of the median gap", async () => {
    const screen = await render(<ABStrips data={{ a: [10, 10, 10, 10], b: [15, 15, 15, 15] }} />);
    const wrap = screen.container.querySelector(".mc-ab-strips-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowUp");
    await expect.poll(() => live().textContent).toMatch(/^A median 10, 5 below B\.$/);
    key(wrap, "ArrowDown");
    await expect.poll(() => live().textContent).toMatch(/^B median 15, 5 above A\.$/);
  });

  it("<DicePips value={-3}> reports no face", async () => {
    const seen: { value?: number | null }[] = [];
    const screen = await render(<DicePips value={-3} onActive={(d) => d && seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-dice-live") as HTMLElement;
    wrap.focus();
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen.at(-1)?.value).toBeNull();
  });

  it("<HeatCell> hands the callback 'No data.' where the cell paints a gap", async () => {
    const seen: { formatted?: string | undefined }[] = [];
    const screen = await render(<HeatCell value={NaN} onActive={(d) => d && seen.push(d)} />);
    const wrap = screen.container.querySelector(".mc-heat-cell-live") as HTMLElement;
    await userEvent.hover(wrap);
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen.at(-1)?.formatted).toBe("No data.");
  });

  it("<ConfusionGrid> announces no share for an all-zero row", async () => {
    const screen = await render(
      <ConfusionGrid
        data={{
          labels: ["cat", "dog"],
          counts: [
            [0, 0],
            [3, 4],
          ],
        }}
        size={80}
      />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => live().textContent).toBe("Actual cat, predicted cat: — of cats (0).");
  });

  it("<Waterfall open={NaN}> names itself from 0 like the static", async () => {
    const screen = await render(<Waterfall data={[{ label: "a", value: 5 }]} open={NaN} />);
    const name = screen.container.querySelector("[aria-label]")!.getAttribute("aria-label")!;
    expect(name).not.toContain("NaN");
  });

  it("<TreeRings> announces '—' for a period the disc floored to nothing", async () => {
    const screen = await render(<TreeRings data={[5, NaN, -3, 4]} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(live().textContent).toBe("Period 2: —.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live().textContent).toBe("Period 3: —.");
    await userEvent.keyboard("{ArrowRight}");
    expect(live().textContent).toBe("Period 4: 4.");
  });

  it("<ErrorBudget window={NaN}> resolves the window like the static", async () => {
    const screen = await render(<ErrorBudget data={[1, 0.9, 0.8]} window={NaN} />);
    const name = screen.container.querySelector("[aria-label]")!.getAttribute("aria-label")!;
    expect(name).not.toContain("NaN");
    expect(screen.container.innerHTML).not.toContain("NaN");
  });

  it("<EtaBar> at its default 8-unit height prints the ETA once", async () => {
    const screen = await render(<EtaBar progress={0.4} elapsed={40} />);
    const wrap = screen.container.querySelector(".mc-eta-live") as HTMLElement;
    wrap.focus();
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("40%");
  });

  it("<CitySkyline> never hands NaN to onActive", async () => {
    const seen: { value?: number | null }[] = [];
    const screen = await render(
      <CitySkyline
        data={[
          { label: "a", value: 10 },
          { label: "b", value: NaN },
        ]}
        onActive={(d) => d && seen.push(d)}
      />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect.poll(() => seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)?.value).toBeNull();
  });

  it("<PercentileLadder> chip says '—' over a zero median", async () => {
    const screen = await render(<PercentileLadder data={[0, 0, 0, 0, 0, 0, 0, 0, 0, 10]} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{End}");
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toMatch(/\(—\)$/);
  });

  it("<GradeProfile> keeps naming an unrepresentable grade (regression guard stays)", async () => {
    const screen = await render(
      <GradeProfile
        data={[
          { d: 0, elev: 0 },
          { d: 5e-324, elev: 1 },
          { d: 1, elev: 1 },
        ]}
      />,
    );
    expect(screen.container.innerHTML).not.toContain("∞");
  });
});
