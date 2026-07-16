"use client";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { SIZE, STATIC_SIZES } from "@/lib/docs-facts";

/** The size-distribution receipt, interactive: hover a bin to read how many
 *  charts land at that weight — the real measured distribution. */
export function ReceiptsSizeHistogram() {
  return (
    <HistogramStrip
      data={[...STATIC_SIZES]}
      width={150}
      height={30}
      summary={`Distribution of measured static gzip sizes across ${SIZE.count} charts, from ${SIZE.min} to ${SIZE.max} kB.`}
    />
  );
}
