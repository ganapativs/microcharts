"use client";
import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { HERO_APPS, HERO_COLLECTIONS, HERO_SIZES, HERO_SVG_BYTES } from "./home-data";

/**
 * The four things the fold says, each with the chart that proves it. The rotating
 * unit is the SENTENCE, so the mark inside it is always that claim's evidence.
 *
 * Three rules hold the set together: no repeated chart type, no repeated fact
 * (size, composition, real usage, render output), and every figure measured —
 * they all resolve from `home-data.ts`, which `home.test.ts` checks against
 * `chart-sizes.json`, `entries.generated.json`, `showcase.ts` and
 * `bench-summary.json`.
 *
 * `kb` is each TYPE's own interactive gzip and the fan's first callout shows it,
 * so the four frames also demonstrate the 4.77–6.75 kB range they claim.
 */

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
 *  rendered number is JetBrains Mono with its unit. */
function Fig({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.72em] tracking-[-0.04em]">{children}</span>;
}

export const HERO_FRAMES: readonly HeroFrame[] = [
  {
    id: "sizes",
    kb: 4.77,
    name: "Every chart in the catalog, by size",
    sentence: (
      <>
        It&rsquo;s small in the bundle too: the median chart is <Fig>5.07 kB</Fig>{" "}
        <Mark>
          {/* A rug, not a line: sorted sizes drawn as a Sparkline are an ogive
              that says nothing. Piling the ink up on one axis makes the dense
              band at 4.7–5.5 kB the median the sentence quotes. */}
          <RugStrip
            data={[...HERO_SIZES]}
            width={W}
            height={H}
            title="Interactive gzip size of all 105 interactive charts, kilobytes"
          />
        </Mark>{" "}
        and the biggest is <Fig>&lt; 7 kB</Fig>.
      </>
    ),
  },
  {
    id: "collections",
    kb: 5.1,
    name: "The catalog, split into four collections",
    sentence: (
      <>
        There are <Fig>106</Fig> of them{" "}
        <Mark>
          <SegmentedBar
            data={HERO_COLLECTIONS.map((c) => ({ ...c }))}
            // No in-bar labels: at 132×30 a figure inside a 23-unit segment would
            // be smaller than anything else this page sets, and the sentence
            // around it already reads the four numbers out.
            label="none"
            order="data"
            width={W}
            height={H}
            title="The 106 stable charts split across four collections"
          />
        </Mark>{" "}
        in four collections, the largest being the <Fig>34</Fig> in core.
      </>
    ),
  },
  {
    id: "apps",
    kb: 5.67,
    name: "Chart types used by each of the seven example apps",
    sentence: (
      <>
        Seven example apps ship with it{" "}
        <Mark>
          <SparkBar
            data={[...HERO_APPS]}
            width={W}
            height={H}
            title="Chart types used by each of the seven example apps"
          />
        </Mark>{" "}
        and between them they use all <Fig>106</Fig> types.
      </>
    ),
  },
  {
    id: "svg",
    kb: 6.75,
    name: "SVG each chart renders, in bytes",
    sentence: (
      <>
        On the page it stays just as light{" "}
        <Mark>
          {/* This one earns the line: sorted, the 106 values sweep 238 → 7,505
              with a real knee where the grid types start emitting a node per
              cell. */}
          <Sparkline
            data={[...HERO_SVG_BYTES]}
            curve="smooth"
            width={W}
            height={H}
            dots="auto"
            title="Bytes of SVG each of the 106 charts renders for a 24-point series, smallest to largest"
          />
        </Mark>{" "}
        and the median one draws <Fig>1,394</Fig> bytes of SVG.
      </>
    ),
  },
];
