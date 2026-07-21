"use client";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { INTERACTIVE_SIZES, SIZE } from "@/lib/docs-facts";

/** The size-distribution receipt, interactive: hover a bin to read how many
 *  charts land at that weight — the real measured interactive distribution. */
export function ReceiptsSizeHistogram() {
  return (
    <HistogramStrip
      data={[...INTERACTIVE_SIZES]}
      width={150}
      height={30}
      summary={`Distribution of measured interactive gzip sizes across ${SIZE.interactiveCount} charts, from ${SIZE.interactiveMin} to ${SIZE.interactiveMax} kB.`}
    />
  );
}
