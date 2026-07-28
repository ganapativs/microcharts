"use client";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { CHECKOUT_P95 } from "./home-data";

/**
 * Act I's third frame — the same `<Sparkline>` on a KPI card, using the pattern
 * the library documents for this: `readout={false}` so the chart stops painting
 * its own chip, and the reading taken off `onActive`, where `datum.formatted` is
 * the exact string the chip would have shown.
 *
 * Two rules the card must keep. The reading falls back to the current value when
 * the pointer leaves, and while a PAST point is being read the kicker names the
 * day — a card showing day 2 under a label that means "now" is a lie.
 *
 * `onActive` fires for pointer and keyboard roving alike, so arrow keys work with
 * no extra wiring.
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
