"use client";
import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { HERO_APPS, HERO_COLLECTIONS, HERO_SIZES, HERO_SVG_BYTES } from "./v3-data";

/**
 * The four things the fold says, each with the chart that proves it.
 *
 * The rotating unit is the SENTENCE, not the mark. An earlier pass swapped only
 * the chart and left one sentence about kilobytes underneath it, so three frames
 * out of four sat inside a line that had nothing to do with them — the mark
 * changed and the words did not, which reads as decoration. Now each frame is a
 * claim and the mark inside it is that claim's evidence.
 *
 * The rules the set is held to:
 *
 * - **No repeated chart type.** Four claims drawn four ways is the catalog's own
 *   argument made in the first fold, before the page has claimed anything.
 * - **No repeated fact.** Size, composition, real usage, render output. A library
 *   comparison was drafted and cut: the fold should say what this thing IS, and
 *   every other sentence here stands on its own without a foil.
 * - **Every figure measured.** All of them resolve from `v3-data.ts`, which is
 *   checked against `chart-sizes.json`, `entries.generated.json`, `showcase.ts`
 *   and `bench-summary.json` by `home-v3.test.ts`.
 *
 * `kb` is each TYPE's own interactive gzip, and the fan's first callout shows it.
 * That is the second argument the rotation makes for free: four types spanning
 * 4.77–6.75 kB demonstrate the range the first sentence claims.
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
          {/* A RUG, not a line. Sorted sizes drawn as a Sparkline are an ogive: a
              shallow ramp hugging the top of the box that reads as a line with
              nothing to say, because sorting threw away the only thing worth
              seeing. A rug puts all 105 charts at their own size on one axis and
              lets the ink pile up, so the dense band at 4.7–5.5 kB IS the median
              the sentence quotes, and the two outliers are visible at the ends. */}
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
          {/* This one EARNS the line. Sorted, the 106 values sweep 238 → 7,505
              with a real curve: flat through the glyph-class charts, then a knee
              where the grid and matrix types start emitting a node per cell. */}
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
