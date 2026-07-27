"use client";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { CHECKOUT_P95 } from "./v3-data";

/**
 * Act I's third frame — the same `<Sparkline>` on a KPI card.
 *
 * The card is the one place on this page where a chart drives something OUTSIDE
 * itself, and it is the pattern the library documents for exactly this: pass
 * `readout={false}` so the chart stops painting its own chip, and take the reading
 * off `onActive` — `datum.formatted` is the very string the chip would have shown,
 * so the number in the card and the number the chart announces cannot drift.
 *
 * Two things this deliberately does NOT do:
 *
 *  - It does not leave the hovered value in place after the pointer leaves. A KPI
 *    card that keeps reading 168 because someone brushed past it three minutes ago
 *    is a card that lies; the number falls back to the current reading, which is
 *    the last point.
 *  - It does not silently relabel. While a past point is being read, the kicker
 *    says which day it is — the figure is a historical one, and a card that shows
 *    day 2 under a label that means "now" is the same lie in slower motion.
 *
 * `onActive` fires for pointer AND keyboard roving, so the card follows arrow keys
 * as well as the cursor with no extra wiring.
 */

const DATA = [...CHECKOUT_P95];
const CURRENT = DATA[DATA.length - 1]!;

export function KpiCard() {
  const [reading, setReading] = useState<{ value: string; index: number } | null>(null);
  const past = reading !== null && reading.index !== DATA.length - 1;

  return (
    <div className="plate grid max-w-[20rem] gap-3.5 px-5 pb-4 pt-5">
      <div className="kicker">p95 latency{past ? ` · day ${reading.index + 1}` : ""}</div>
      <div className="flex items-end justify-between gap-4">
        {/* `tabular-nums` (the mono face already carries it) keeps the digits from
            shuffling the "ms" sideways as the reading changes width. */}
        <div
          className="font-mono text-[34px] leading-none tracking-[-0.05em]"
          style={{ color: "var(--ink)" }}
        >
          {reading?.value ?? String(CURRENT)}
          <span className="text-[15px]" style={{ color: "var(--ink-3)" }}>
            {" "}
            ms
          </span>
        </div>
        <Sparkline
          curve="smooth"
          data={DATA}
          width={100}
          height={30}
          readout={false}
          onActive={(d) =>
            setReading(
              d && d.formatted !== undefined ? { value: d.formatted, index: d.index } : null,
            )
          }
          title="Checkout p95 latency, weekly, milliseconds"
        />
      </div>
    </div>
  );
}
