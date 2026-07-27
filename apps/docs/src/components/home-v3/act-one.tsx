import { HeroSentence } from "./hero-sentence";
import { HeroActions } from "./actions";
import { ScrollCue } from "./scroll-cue";

/** The four properties of the mark that hold whatever type is on screen — each
 *  one a thing only a chart has, which is also why no other product's page could
 *  run this act.
 *
 *  "arrow keys, one tab stop" and not just "one tab stop": the bare version
 *  stated a fact and left the reader to work out why it mattered. The point is
 *  that the whole chart is ONE stop no matter how many values are in it — a mark
 *  with a DOM node per point would hand you 105 of them — and that arrow keys
 *  move between values once you are there. Both halves, and exactly 24
 *  characters, which is the column cap the fan is built to (see `.fan-lab`).
 *
 *  The fifth callout is the type's WEIGHT, and it is not here: it changes with
 *  the specimen, so `HeroSentence` prepends it from the active frame. Hard-coding
 *  one chart's kB beside a mark that becomes four other charts is exactly the
 *  drift this page's tests exist to catch. */
const CALLOUTS = [
  { text: "0 dependencies", row: 1 },
  { text: 'role="img"', row: 0 },
  { text: "arrow keys, one tab stop", row: 1 },
  { text: "name generated from data", row: 0 },
] as const;

/**
 * Act I — it sits in a sentence.
 *
 * Claim → artifact → annotation → action, all on one left axis. It is not the
 * banned headline-subhead-two-buttons slab, because the "subhead" is a live chart
 * inside real prose with hairline callouts naming its own properties.
 *
 * Provenance is not a step here — not as a footnote under the tree, and not as a
 * link on the median figure. Both were tried; both cited `.size-limit.json` from
 * the fold, which is the act where nobody has doubted anything yet. Act III is
 * where size is the argument, and it carries the one citation of that file on the
 * page. A number stated in the fold and receipted in the act that argues it is one
 * chain, not a gap.
 */
export function ActOne() {
  return (
    <section
      aria-labelledby="act1"
      // Near-symmetric: `--sp-beat` bottom, and a tenth more on top.
      //
      // The arithmetic says these gaps are unequal — the section below adds
      // `--sp-act - --sp-beat` of its own, so the space under the install row
      // measures 70px more than the space above the headline. Closing that gap
      // properly was tried, by raising padding-top to the full `--sp-act`, and it
      // looked worse: the fold's content already overflows its height cap, so
      // padding-top translates straight into pushing the claim DOWN, and a
      // headline sitting 70px low is far more visible than a gap being 70px
      // short. The same mechanism at a tenth of the size reads as air rather than
      // as a drop, which is the whole difference between the two attempts.
      //
      // The height is capped rather than `100svh`: a full-height fold on a tall
      // window strands the claim in the middle of a void with no sign there is a
      // page under it, and the leftover slack lands at the bottom, which is what
      // made the two gaps unequal in the first place. Centring inside a 44rem cap
      // fills a laptop, never strands, and is identical on a 1600px-tall screen.
      //
      // (The accent wash under this fold is a page-level layer in `V3Shell`, not a
      // child of this section: parented here it would start below the sticky rail
      // and seam against it.)
      className="relative flex flex-col justify-center"
      style={{
        minHeight: "min(calc(100svh - var(--hdr, 56px)), 44rem)",
        paddingTop: "calc(var(--sp-beat) * 1.1)",
        paddingBottom: "var(--sp-beat)",
      }}
    >
      <div className="shell relative">
        {/* The claim is WHERE it goes, not what it weighs. Size is the answer to
            "can I really put one there", so it belongs in the line under the
            headline, not in it. */}
        <h1 id="act1" className="d1">
          Charts that fit in a sentence.
        </h1>

        <HeroSentence callouts={CALLOUTS} />

        {/* Not "that mark" and no longer "that line". `mark` is this codebase's
            word and a reader has no idea what it points at; "line" was true when
            the specimen was one Sparkline, and became wrong the moment it started
            rotating through a rug, a segmented bar, bars and a heat strip. "The
            chart up there" is the one referent that stays accurate on all five
            frames and needs no vocabulary.

            The data is deliberately not attributed to anyone. Each frame plots a
            measured fact about this library, not the reader's numbers, so the
            capability is stated as an imperative about the component rather than
            as a claim about what is currently on screen.

            "An array", not "an array of numbers". The line has to be true for
            whichever of the four claims is on screen, and three of them plot
            `number[]` while SegmentedBar takes `{ label, value }[]` — so "of
            numbers" would be quietly wrong one rotation in four. What all four DO
            share is that they take one array, and that `data` is their only
            required prop, which is what makes "the whole setup" exact rather than
            a flourish.

            No count here either. `106` was printed in this paragraph AND on the
            door directly under it, and two of the rotating claims say it as well,
            so the fold could show the same figure three times in one screen. The
            door is the one that earns it: there, the number is what you are being
            offered rather than a fact being restated.

            Nothing else here repeats the tree above or the section below. "0
            dependencies" is already a callout, and the places one can sit are the
            point of the four frames that follow. */}
        <p className="prose mt-8 sm:mt-12" style={{ maxWidth: "var(--m-prose)" }}>
          The chart up there is a React component. Pass it an array and that&rsquo;s the whole
          setup.
        </p>

        <HeroActions />
      </div>

      {/* The scroll cue. Out of flow, and that is load-bearing: the fold is
          height-capped and centres its content, so a cue in normal flow would add
          ~60px and either push the claim off-centre or overflow the cap on a short
          laptop. It watches the section below and hides as soon as any of it is on
          screen — see `scroll-cue.tsx`. */}
      <ScrollCue watch="#four-places" label="more below" />
    </section>
  );
}
