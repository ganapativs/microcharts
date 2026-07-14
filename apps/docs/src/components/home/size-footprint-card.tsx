"use client";

import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { SIZE, STATIC_SIZES } from "@/lib/docs-facts";

const W = 520;
const H = 56;
/** Match HistogramStrip auto bins: min(12, ⌈√n⌉). */
const BIN_N = Math.min(12, Math.ceil(Math.sqrt(STATIC_SIZES.length)));

const LO = Math.min(...STATIC_SIZES);
const HI = Math.max(...STATIC_SIZES);
const STEP = (HI - LO) / BIN_N || 1;

function countsInBin(i: number): number {
  const hi = i === BIN_N - 1 ? HI : LO + (i + 1) * STEP;
  const lo = LO + i * STEP;
  let n = 0;
  for (const kB of STATIC_SIZES) {
    if (i === BIN_N - 1 ? kB >= lo && kB <= hi : kB >= lo && kB < hi) n++;
  }
  return n;
}

const fmt = (n: number) => n.toFixed(1);

export function SizeFootprintCard() {
  const [active, setActive] = useState<number | null>(null);

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const i = Math.floor(((e.clientX - r.left) / r.width) * BIN_N);
    setActive(i >= 0 && i < BIN_N ? i : null);
  }, []);

  const readout = useMemo(() => {
    if (active === null) {
      return {
        count: SIZE.count,
        countLabel: "charts",
        lo: SIZE.min,
        hi: SIZE.max,
        scope: "catalog" as const,
      };
    }
    const lo = LO + active * STEP;
    const hi = active === BIN_N - 1 ? HI : LO + (active + 1) * STEP;
    const count = countsInBin(active);
    return {
      count,
      countLabel: count === 1 ? "chart" : "charts",
      lo,
      hi,
      scope: "band" as const,
    };
  }, [active]);

  return (
    <div className="glass relative flex h-full flex-col justify-between gap-3 overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-paper opacity-40" />

      <div className="relative">
        <div className="mono-label mb-2 flex items-center justify-between gap-3 opacity-70">
          <span>static gzip · distribution</span>
          <span>mark 3 kB</span>
        </div>

        <div
          className="w-full [&_.mc-histogram-live]:block [&_.mc-histogram-live]:w-full [&_.mc-spark-readout]:hidden"
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
        >
          <HistogramStrip
            data={STATIC_SIZES}
            bins={BIN_N}
            markValue={3}
            width={W}
            height={H}
            animate
            format={{ maximumFractionDigits: 1, style: "unit", unit: "kilobyte" }}
            title={`Static gzip size of all ${SIZE.count} charts`}
            className="h-auto w-full"
          />
        </div>

        <div className="mt-1 flex justify-between font-mono text-[0.58rem] tabular-nums text-fd-muted-foreground">
          <span>{fmt(SIZE.min)}</span>
          <span>3.0</span>
          <span>{fmt(SIZE.max)} kB</span>
        </div>
      </div>

      <div
        className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-hairline pt-3"
        aria-live="polite"
      >
        <div>
          <div className="mono-label opacity-70">Count · {readout.scope}</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span
              className={`display text-2xl tabular-nums sm:text-3xl ${active !== null ? "text-fd-primary" : "text-fd-foreground"}`}
            >
              {readout.count}
            </span>
            <span className="text-[0.75rem] text-fd-muted-foreground">{readout.countLabel}</span>
          </div>
        </div>
        <div className="text-right sm:text-left">
          <div className="mono-label opacity-70">Size range</div>
          <div className="mt-0.5 flex items-baseline justify-end gap-1 sm:justify-start">
            <span
              className={`display text-2xl tabular-nums sm:text-3xl ${active !== null ? "text-fd-primary" : "text-fd-foreground"}`}
            >
              {fmt(readout.lo)}–{fmt(readout.hi)}
            </span>
            <span className="text-[0.75rem] text-fd-muted-foreground">kB</span>
          </div>
        </div>
        <div className="mono-label w-full opacity-55">
          median {SIZE.median} · {SIZE.under2}/{SIZE.count} under 2 kB
          {active === null ? " · hover" : ""}
        </div>
      </div>
    </div>
  );
}
