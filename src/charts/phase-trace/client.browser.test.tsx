import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { PhaseTrace } from "./client.js";

const TRAJ = [
  { x: 30, y: 80 },
  { x: 42, y: 95 },
  { x: 55, y: 115 },
  { x: 62, y: 130 },
];

describe("interactive <PhaseTrace>", () => {
  it("←/→ step time; announce the point by its index + named axes", async () => {
    const screen = await render(
      <PhaseTrace
        data={TRAJ}
        xLabel="CPU"
        yLabel="Latency"
        title="Phase"
        width={120}
        height={100}
      />,
    );
    const wrap = screen.container.querySelector(".mc-phase-live") as HTMLElement;
    wrap.focus();
    // First arrow from nothing lands on the FIRST point (kernel-consistent; the
    // old entry started from the end of the trail).
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("point 1 of 4: CPU 30, Latency 80.");
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await expect.poll(() => live.textContent).toBe("point 3 of 4: CPU 55, Latency 115.");
  });

  it("onActive reports the focused datum (y channel + paired x label); null on clear", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <PhaseTrace data={TRAJ} width={120} height={100} onActive={(d) => seen.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(seen.at(-1)).toMatchObject({ index: 1, value: 95, label: "42" });
    await userEvent.keyboard("{Escape}");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active point: fires onSelect + pins a persistent ring", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <PhaseTrace data={TRAJ} width={120} height={100} onSelect={(d) => picks.push(d)} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    fig.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{Enter}");
    expect(picks.at(-1)).toMatchObject({ index: 1, value: 95, label: "42" });
    // Pin survives blur (it is selection, not hover).
    fig.blur();
    await expect.poll(() => fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });

  it("the draw entrance targets the trajectory, never the quadrant grid", async () => {
    // Mirrors the `useEntrance` selector in client.tsx. The grid shares the
    // muted ink role (it needs the forced-colors mapping) and is told apart by
    // its width role, so dropping either attribute would silently restaff the
    // entrance — with chrome drawing on and the trail no longer animating.
    const SELECTOR =
      'path[data-mc-ink="muted"]:not([data-mc-w="hair"]), path[data-mc-ink="accent"]';
    const screen = await render(<PhaseTrace data={TRAJ} grid width={120} height={100} />);
    const svg = screen.container.querySelector("svg")!;
    expect(svg.querySelector('path[data-mc-w="hair"]')).not.toBeNull();
    const drawn = [...svg.querySelectorAll(SELECTOR)];
    expect(drawn.length).toBe(2); // trail + tail
    expect(drawn.some((el) => el.getAttribute("data-mc-w") === "hair")).toBe(false);
  });

  it("controlled selectedIndex pins the ring with no interaction", async () => {
    const screen = await render(
      <PhaseTrace data={TRAJ} width={120} height={100} selectedIndex={2} />,
    );
    const fig = screen.getByRole("img").element() as HTMLElement;
    expect(fig.querySelector('circle[data-mc-w="tick"]')).not.toBeNull();
  });
});
