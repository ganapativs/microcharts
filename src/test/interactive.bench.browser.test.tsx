// Interactive-path bench. The bench/ suite measures STATIC SSR only, so nothing
// covered the client entries — mount cost, pointer-scrub cost, and how many
// React renders a scrub actually costs. That is exactly where the interaction
// kernel lives, so "no perf regression" was previously unfalsifiable there.
//
// Opt-in (it is a measurement, not an assertion — it must never gate CI or add
// time to `pnpm test`):
//
//   VITE_MC_BENCH=1 pnpm vitest run --project browser src/test/interactive.bench.browser.test.tsx
//
// (Vite only exposes VITE_-prefixed vars to browser code, hence the prefix.)
//
// Numbers are only comparable within one run on a quiet machine. Take the BEST
// window, never the mean: GC and scheduler noise are one-sided (see
// bench/run.mjs, which had a bimodal-median bug for exactly this reason).
import { memo, useState } from "react";
import { flushSync } from "react-dom";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Sparkline } from "../charts/sparkline/client.js";
import { Sparkline as StaticSparkline } from "../charts/sparkline/index.js";

const RUN = Boolean(
  (import.meta as unknown as { env: Record<string, string> }).env["VITE_MC_BENCH"],
);
const DATA = Array.from({ length: 24 }, (_, i) => Math.sin(i / 3) * 10 + i);
/** Collected measurements (see the print note in the mount test). */
const REPORT: string[] = [];

/** Best (fastest) of `reps` timed windows. Warm once first. */
function best(reps: number, fn: () => void): number {
  fn();
  let b = Infinity;
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now();
    fn();
    b = Math.min(b, performance.now() - t0);
  }
  return b;
}

describe.skipIf(!RUN)("interactive bench", () => {
  test("pointer scrub — cost per move, and renders per sweep", async () => {
    let activeChanges = 0;
    const screen = await render(
      <Sparkline data={DATA} width={240} height={40} onActive={() => activeChanges++} />,
    );
    const host = screen.container.querySelector("span") as HTMLElement;
    const r = host.getBoundingClientRect();

    // A full left→right sweep — a realistic mouse path across the chart.
    const MOVES = 120;
    const sweep = (): void => {
      for (let i = 0; i < MOVES; i++) {
        host.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: r.left + (r.width * i) / MOVES,
            clientY: r.top + r.height / 2,
            bubbles: true,
          }),
        );
      }
    };

    const ms = best(5, sweep);
    activeChanges = 0;
    sweep();

    REPORT.push(
      `scrub ${MOVES} moves: ${ms.toFixed(2)}ms total, ${((ms / MOVES) * 1000).toFixed(1)}us/move, ${activeChanges} unit-changes`,
    );

    // The kernel's core perf property: a scrub costs one render per unit
    // crossed, never one per pointer move. 24 points → at most 24 changes.
    expect(activeChanges).toBeLessThanOrEqual(DATA.length);
  });

  // The scenario that bites at scale: a parent re-renders (some unrelated state
  // changed) with N charts mounted and every chart's props REFERENTIALLY
  // IDENTICAL. Static components are hook-free by mandate, so they cannot
  // memoize internally — geometry recomputes on every render. Question: does
  // wrapping in React.memo pay for itself?
  //
  // Both arms below use a STABLE `data` reference, i.e. memo's BEST case. Real
  // consumers often write `data={[1,2,3]}` inline or pass JSX children, which
  // makes memo miss every time and become pure overhead — so treat the memo
  // number here as an upper bound on the benefit, never the expected one.
  test("parent re-render — N charts, props unchanged", async () => {
    const MemoStatic = memo(StaticSparkline);

    // Arms run in one process, so a later arm inherits JIT state warmed by
    // earlier ones — measured at ~2.6x, enough to invert the ranking (running
    // this list in both orders swapped which arm looked fastest). So: mount and
    // warm EVERY arm first, then time them all. Same lesson as bench/run.mjs.
    const arms: { label: string; bump: (n: number) => void }[] = [];
    for (const [label, C, unstable] of [
      // The case that decides it: a consumer writing `data={[1,2,3]}` inline (or
      // passing JSX children) hands memo a new reference every render, so it
      // misses every time and its shallow compare is pure overhead.
      ["memo MISS  ", MemoStatic, true],
      ["memo hit   ", MemoStatic, false],
      ["plain      ", StaticSparkline, false],
    ] as const) {
      let bump: (n: number) => void = () => {};
      function Harness(): React.ReactNode {
        const [n, setN] = useState(0);
        // The harness hands its setter out so the bench can drive re-renders.
        // oxlint-disable-next-line react/globals
        bump = setN;
        return (
          <div data-n={n}>
            {Array.from({ length: 100 }, (_, i) => (
              <C key={i} data={unstable ? [...DATA] : DATA} />
            ))}
          </div>
        );
      }
      await render(<Harness />);
      arms.push({ label, bump });
    }

    // Warm every arm (flushSync per iteration: React 18 auto-batches, so a plain
    // loop of setState calls would collapse into ONE render and time nothing).
    for (let w = 1; w <= 6; w++) for (const a of arms) flushSync(() => a.bump(-w));

    // Best-of-N per arm, interleaved so any drift hits all arms equally.
    const REPS = 12;
    const best = new Map(arms.map((a) => [a.label, Infinity]));
    for (let r = 1; r <= REPS; r++) {
      for (const a of arms) {
        const t0 = performance.now();
        flushSync(() => a.bump(r));
        const ms = performance.now() - t0;
        if (ms < (best.get(a.label) ?? Infinity)) best.set(a.label, ms);
      }
    }
    for (const [label, ms] of best) {
      REPORT.push(`re-render 100 ${label}: ${ms.toFixed(2)}ms/parent-render`);
    }
    expect(REPORT.length).toBeGreaterThan(0);
  });

  test("mount cost — N interactive charts", async () => {
    for (const n of [25, 100]) {
      const t0 = performance.now();
      await render(
        <div>
          {Array.from({ length: n }, (_, i) => (
            <Sparkline key={i} data={DATA} />
          ))}
        </div>,
      );
      const ms = performance.now() - t0;
      REPORT.push(`mount ${n} charts: ${ms.toFixed(1)}ms total, ${(ms / n).toFixed(3)}ms/chart`);
    }
    // Browser-context console.log is not forwarded by this reporter, so the
    // numbers ride out on an assertion message. Set VITE_MC_BENCH_PRINT=1 to
    // make this fail deliberately and print them.
    if ((import.meta as unknown as { env: Record<string, string> }).env["VITE_MC_BENCH_PRINT"]) {
      expect(REPORT.join(" | ")).toBe("PRINT");
    }
    expect(REPORT.length).toBeGreaterThan(0);
  });
});
