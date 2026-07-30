"use client";
import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";

/**
 * The four things the fold says, each with the chart that proves it. The rotating
 * unit is the SENTENCE, so the mark inside it is always that claim's evidence.
 *
 * Three rules hold the set together: no repeated chart type, no repeated fact
 * (size, composition, real usage, render output), and every figure measured.
 *
 * Nothing here is typed by hand. `hero-data.ts` reads `chart-sizes.json`,
 * `bench-summary.json`, the entries registry and `showcase.ts` on the SERVER and
 * hands the numbers down as props — this module stays a client component without
 * pulling `entries.generated.json` (~236 kB) into the bundle with it. Every
 * figure in the prose is computed from the series drawn beside it, so a sentence
 * cannot quote a median its own mark does not plot.
 */

/** Everything the fold states, measured. Built by `heroData()` on the server. */
export type HeroData = {
  /** Interactive gzip kB for every interactive entry in the stable catalog, ascending. */
  sizes: readonly number[];
  /** Bytes of SVG each stable chart renders for the bench's 24-point series, ascending. */
  svgBytes: readonly number[];
  /** The stable catalog split by collection, in catalog order. */
  collections: readonly { label: string; value: number }[];
  /** Chart types imported by each example app, in showcase order. */
  apps: readonly number[];
  /** Stable chart types in the catalog. */
  total: number;
  /** Each frame's OWN type, interactive gzip kB — what the fan's first callout shows. */
  kb: { rugStrip: number; segmentedBar: number; sparkBar: number; sparkline: number };
};

export type HeroFrame = {
  id: string;
  /** The type's own interactive gzip kB, from `chart-sizes.json`. */
  kb: number;
  /** Names this frame for the dot rail's assistive label. */
  name: string;
  /** The claim, with its own mark set inside it. */
  sentence: ReactNode;
};

/** Every frame draws at exactly this size. A frame one pixel wider re-wraps its
 *  own sentence, and since all four sentences share one grid cell, it would
 *  re-size the box that holds all of them. */
const W = 132;
const H = 30;

/** The mark, seated on the text baseline by the library's own `.mc-inline` rule.
 *  `.hero-mark` only widens the air either side: half these types are full-bleed
 *  and touch the words at `.mc-inline`'s default `.2em`. */
function Mark({ children }: { children: ReactNode }) {
  return <span className="mc-inline hero-mark">{children}</span>;
}

/** A mono figure inside the serif sentence, matching the page's rule that every
 *  rendered number is Iosevka with its unit. */
function Fig({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.72em] tracking-[-0.04em]">{children}</span>;
}

/** The middle value of a sorted series — the same rule `docs-facts` uses, applied
 *  to the array the mark beside the sentence actually draws. */
const median = (xs: readonly number[]) => xs[Math.floor(xs.length / 2)] ?? 0;

export function heroFrames(d: HeroData): readonly HeroFrame[] {
  const max = d.sizes[d.sizes.length - 1] ?? 0;
  const ceiling = Math.ceil(max);
  // "< 7 kB" holds while every measured size is strictly under the whole number.
  // A size that lands ON it states itself instead: sparkline measures 6,995 B,
  // which `sync-sizes` rounds to 7.00 kB, and "< 7" beside a specimen sheet
  // reading 7 kB is a contradiction a reader can see.
  const biggest = max < ceiling ? `< ${ceiling} kB` : `${max} kB`;
  const largest = [...d.collections].sort((a, b) => b.value - a.value)[0] ?? {
    label: "",
    value: 0,
  };

  return [
    {
      id: "sizes",
      kb: d.kb.rugStrip,
      name: "Every chart in the catalog, by size",
      sentence: (
        <>
          It&rsquo;s small in the bundle too: the median chart is <Fig>{median(d.sizes)} kB</Fig>{" "}
          <Mark>
            {/* A rug, not a line: sorted sizes drawn as a Sparkline are an ogive
                that says nothing. Piling the ink up on one axis makes the dense
                band around the median the sentence quotes. */}
            <RugStrip
              data={d.sizes}
              width={W}
              height={H}
              title={`Interactive gzip size of all ${d.sizes.length} interactive charts, kilobytes`}
            />
          </Mark>{" "}
          and the biggest is <Fig>{biggest}</Fig>.
        </>
      ),
    },
    {
      id: "collections",
      kb: d.kb.segmentedBar,
      name: "The catalog, split into four collections",
      sentence: (
        <>
          There are <Fig>{d.total}</Fig> of them{" "}
          <Mark>
            <SegmentedBar
              data={d.collections}
              // No in-bar labels: at 132×30 a figure inside a 23-unit segment would
              // be smaller than anything else this page sets, and the sentence
              // around it already reads the four numbers out.
              label="none"
              order="data"
              width={W}
              height={H}
              title={`The ${d.total} stable charts split across ${d.collections.length} collections`}
            />
          </Mark>{" "}
          in four collections, the largest being the <Fig>{largest.value}</Fig>{" "}
          {`in ${largest.label}.`}
        </>
      ),
    },
    {
      id: "apps",
      kb: d.kb.sparkBar,
      name: "Chart types used by each of the seven example apps",
      sentence: (
        <>
          Seven example apps ship with it{" "}
          <Mark>
            <SparkBar
              data={d.apps}
              width={W}
              height={H}
              title={`Chart types used by each of the ${d.apps.length} example apps`}
            />
          </Mark>{" "}
          and between them they use all <Fig>{d.total}</Fig> types.
        </>
      ),
    },
    {
      id: "svg",
      kb: d.kb.sparkline,
      name: "SVG each chart renders, in bytes",
      sentence: (
        <>
          On the page it stays just as light{" "}
          <Mark>
            {/* This one earns the line: sorted, the values sweep two orders of
                magnitude with a real knee where the grid types start emitting a
                node per cell. */}
            <Sparkline
              data={d.svgBytes}
              curve="smooth"
              width={W}
              height={H}
              dots="auto"
              title={`Bytes of SVG each of the ${d.svgBytes.length} charts renders for a 24-point series, smallest to largest`}
            />
          </Mark>{" "}
          and the median one draws <Fig>{median(d.svgBytes).toLocaleString("en-US")}</Fig> bytes of
          SVG.
        </>
      ),
    },
  ];
}
