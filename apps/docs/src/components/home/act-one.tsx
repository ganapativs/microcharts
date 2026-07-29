import { HeroSentence } from "./hero-sentence";
import { HeroActions } from "./actions";
import { ScrollCue } from "./scroll-cue";

/** The four properties of the mark that hold for whatever type is on screen.
 *  Each label is capped at 24 characters — the column width the fan is built to
 *  (see `.fan-lab`).
 *
 *  The fifth callout is the type's weight, and it is not here: it changes with
 *  the specimen, so `HeroSentence` prepends it from the active frame. */
const CALLOUTS = [
  { text: "0 dependencies", row: 1 },
  { text: 'role="img"', row: 0 },
  { text: "arrow keys, one tab stop", row: 1 },
  { text: "name generated from data", row: 0 },
] as const;

/**
 * Act I — it sits in a sentence. Claim → artifact → annotation → action, all on
 * one left axis, with the "subhead" a live chart inside real prose.
 *
 * The fold states figures and cites nothing: Act III is where size is the
 * argument, and it carries the page's one citation of `.size-limit.json`.
 */
export function ActOne() {
  return (
    <section
      aria-labelledby="act1"
      // Near-symmetric padding, and a height CAP rather than `100svh`: a
      // full-height fold on a tall window strands the claim in a void with no
      // sign there is a page under it. Raising padding-top to close the residual
      // gap only pushes the claim down, which reads far worse than the gap does.
      //
      // (The accent wash under this fold is a page-level layer in `HomeShell`:
      // parented here it would start below the sticky rail and seam against it.)
      className="relative flex flex-col justify-center"
      style={{
        minHeight: "min(calc(100svh - var(--hdr, 56px)), 44rem)",
        paddingTop: "calc(var(--sp-beat) * 1.1)",
        paddingBottom: "var(--sp-beat)",
      }}
    >
      <div className="shell relative">
        <h1 id="act1" className="display-1">
          Charts that fit in a sentence.
        </h1>

        <HeroSentence callouts={CALLOUTS} />

        {/* Every word here has to hold for all four rotating frames: "the chart
            up there" rather than "that line", and "an array" rather than "an
            array of numbers" — three frames plot `number[]`, SegmentedBar takes
            `{ label, value }[]`. */}
        <p className="prose mt-8 sm:mt-12" style={{ maxWidth: "var(--m-prose)" }}>
          The chart up there is a React component. Pass it an array and that&rsquo;s the whole
          setup.
        </p>

        <HeroActions />
      </div>

      {/* Out of flow, and that is load-bearing: the fold is height-capped and
          centres its content, so a cue in normal flow would push the claim
          off-centre or overflow the cap on a short laptop. */}
      <ScrollCue watch="#four-places" label="more below" />
    </section>
  );
}
