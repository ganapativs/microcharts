import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
// the stylesheet is loaded on purpose: the ink roles are what paint the
// valence ticks, and only a real cascade can tell a stroked mark from a
// wiped one (`[data-mc-ink="negative"]` sets `stroke: none` for filled marks —
// the literal `fill="none"` is what opts a tick path back into a stroke)
import "../../../styles.css";
import { Seismogram as StaticSeismogram } from "./index.js";
import { Seismogram } from "./client.js";

const DATA = [0, 3, 0, 8, 0];

const none = (v: string) => v === "none" || v === "rgba(0, 0, 0, 0)";

describe("interactive <Seismogram>", () => {
  it('arrow keys step slots; a quiet slot announces its zero, not "no data"', async () => {
    const screen = await render(<Seismogram data={DATA} title="Bursts" />);
    const wrap = screen.container.querySelector(".mc-seismo-live") as HTMLElement;
    wrap.focus();
    const live = document.querySelector('[aria-live="polite"]')!;
    // First Arrow now focuses unit 0 (the old skip-to-1 quirk was removed).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 1 of 5: 0.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 2 of 5: 3.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 3 of 5: 0.");
  });

  it("Home/End jump to the first/last EVENT", async () => {
    const screen = await render(<Seismogram data={DATA} />);
    const wrap = screen.container.querySelector(".mc-seismo-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("Point 4 of 5: 8.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("Point 2 of 5: 3.");
  });

  it("onActive reports the focused slot datum (slot index + value); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(<Seismogram data={DATA} onActive={(d) => seen.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    // Home jumps to the first event (slot 1, value 3).
    await userEvent.keyboard("{Home}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 3 });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active slot: fires onSelect + pins a persistent mark", async () => {
    const picks: unknown[] = [];
    const screen = await render(<Seismogram data={DATA} onSelect={(d) => picks.push(d)} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 3 });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('line[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  it("controlled selectedIndex pins the mark with no interaction", async () => {
    const screen = await render(<Seismogram data={DATA} selectedIndex={3} />);
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('line[stroke="var(--mc-accent)"]')).not.toBeNull();
  });

  it("valence + anomaly ticks stroke from their ink role, and stay distinct", async () => {
    const screen = await render(
      <StaticSeismogram data={[4, -2, 9]} positive="up" anomaly={8} width={60} height={16} />,
    );
    const paths = [...screen.container.querySelectorAll("path")];
    expect(paths.length).toBe(3); // up, down, flagged
    for (const p of paths) {
      const cs = getComputedStyle(p);
      expect(none(cs.stroke)).toBe(false);
      // Chrome hands back `calc(1.5px)` — the token chain, unresolved
      expect(cs.strokeWidth).not.toMatch(/^0(px)?$/);
      expect(cs.strokeLinecap).toBe("round"); // same tick end as plain data ink
      // Every subpath is a bare vertical, so the valence family's `fill` has no
      // area to land on — the mark is its stroke. (The literal `fill="none"` is
      // still what the stroked-valence rule selects on, and what the
      // forced-colors safety net reads.)
      expect(p.getAttribute("d")).toMatch(/^(M[\d.]+ [\d.]+V[\d.]+)+$/);
    }
    const [up, down] = paths.map((p) => getComputedStyle(p).stroke);
    expect(up).not.toBe(down);
  });
});
