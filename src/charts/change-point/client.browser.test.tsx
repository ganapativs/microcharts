import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { ChangePoint } from "./client.js";

const STEP = [...Array(34).fill(32), ...Array(20).fill(48)];

// transient crosshair vs the persistent pin (static break markers are
// line[data-mc-w="tick"][data-mc-ink="flag"], so the overlay excludes ink)
const FOCUS = 'line[data-mc-w="tick"]:not([data-mc-ink])';
const PIN = 'line[data-mc-w="support"]';

describe("interactive <ChangePoint>", () => {
  it("←/→ step points, announcing value + regime; a readout chip shows the value", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} title="Error rate" />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toMatch(/^Point 0: 32 — regime 1 of 2, mean 32\.$/);
    // the chip goes through `strings.changePointRegime` — it was hardcoded
    // English, which no `strings` override could reach
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe("regime 1 of 2");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await expect.poll(() => live.textContent).toMatch(/regime 2 of 2, mean 48\.$/);
  });

  it("Tab cycles the breaks as first-class stops", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} title="Error rate" />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Break at point 34: mean 32 to 48 (+50%).");
  });

  it("Shift+Tab cycles the breaks backwards", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} title="Error rate" />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Break at point 34: mean 32 to 48 (+50%).");
  });

  it("onActive reports the focused datum (data index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 32 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent crosshair", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 32 });
    fig.blur();
    await expect.poll(() => fig.querySelector(PIN)).not.toBeNull();
    await expect.poll(() => fig.querySelector(FOCUS)).toBeNull();
  });

  it("a gap announces '—' and the chip mirrors `datum.formatted`", async () => {
    const seen: { formatted?: string | undefined }[] = [];
    const gappy = [...Array(10).fill(32), NaN, ...Array(10).fill(32), ...Array(20).fill(48)];
    const screen = await render(
      <ChangePoint data={gappy} width={200} height={32} onActive={(d) => d && seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    wrap.focus();
    await userEvent.keyboard(`{Home}${"{ArrowRight}".repeat(10)}`);
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 10: — — regime 1 of 2, mean 32.");
    await expect
      .poll(() => wrap.querySelector(".mc-spark-readout")?.textContent)
      .toBe(seen.at(-1)!.formatted);
  });

  it("controlled selectedIndex pins the crosshair with no interaction", async () => {
    const screen = await render(
      <ChangePoint data={STEP} width={200} height={32} selectedIndex={10} />,
    );
    const fig = screen.container.querySelector(".mc-change-point-live") as HTMLElement;
    expect(fig.querySelector(PIN)).not.toBeNull();
  });
});
