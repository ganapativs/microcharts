import { SITE } from "@/lib/site";
import { SIZE } from "@/lib/docs-facts";
import { CEILING_CLAIM } from "@/lib/release-sizes";
import { HeroSentence } from "./hero-sentence";
import { HeroActions } from "./actions";

const SIZE_LIMIT = `${SITE.repo}/blob/main/.size-limit.json`;

/** Five properties of the mark in the sentence above — each one a thing only a
 *  chart has, which is also why no other product's page could run this act. */
const CALLOUTS = [
  { text: `${SIZE.interactiveMax} kB`, row: 0 },
  { text: "0 dependencies", row: 1 },
  { text: 'role="img"', row: 0 },
  { text: "one tab stop", row: 1 },
  { text: "name generated from data", row: 0 },
] as const;

/**
 * Act I — it sits in a sentence.
 *
 * Claim → artifact → annotation → provenance → action, all on one left axis. It
 * is not the banned headline-subhead-two-buttons slab, because the "subhead" is
 * a live chart inside real prose with hairline callouts naming its own
 * properties.
 */
export function ActOne({ catalogTotal }: { catalogTotal: number }) {
  return (
    <section
      aria-labelledby="act1"
      // EQUAL padding top and bottom, and the beat that follows adds no gap of
      // its own — so the space between the rail and "Five kilobytes." is the same
      // space that sits under the install row. That symmetry is the whole reason
      // the padding lives here rather than being split across two sections.
      //
      // The height is capped rather than `100svh`: a full-height fold on a tall
      // window strands the claim in the middle of a void with no sign there is a
      // page under it, and the leftover slack lands at the bottom, which is what
      // made the two gaps unequal in the first place. Centring inside a 44rem cap
      // fills a laptop, never strands, and is identical on a 1600px-tall screen.
      //
      // (The ember wash under this fold is a page-level layer in `V3Shell`, not a
      // child of this section: parented here it would start below the sticky rail
      // and seam against it.)
      className="relative flex flex-col justify-center"
      style={{
        minHeight: "min(calc(100svh - var(--hdr, 56px)), 44rem)",
        paddingBlock: "var(--sp-beat)",
      }}
    >
      <div className="shell relative">
        <h1 id="act1" className="d1">
          Five kilobytes.
        </h1>

        <HeroSentence
          median={SIZE.interactiveMedian}
          ceilingClaim={CEILING_CLAIM}
          callouts={CALLOUTS}
          sizeLimitHref={SIZE_LIMIT}
        />

        <p className="mono-s mt-5" style={{ maxWidth: "var(--m-note)", color: "var(--ink-3)" }}>
          Every size here is measured on the built package. CI{" "}
          <a href={`${SITE.repo}/actions`} target="_blank" rel="noreferrer noopener" className="u">
            fails the build if one grows
          </a>
          .
        </p>

        <p className="prose mt-8 sm:mt-12" style={{ maxWidth: "var(--m-prose)" }}>
          That mark inside the sentence is a React component, drawn from your numbers. There are{" "}
          <span className="fig">{catalogTotal}</span> like it,{" "}
          <span className="fig">{Math.floor(SIZE.interactiveMin)}</span> to{" "}
          <span className="fig">{Math.ceil(SIZE.interactiveMax)}</span> kB each, and it has no
          dependencies.
        </p>

        <HeroActions catalogTotal={catalogTotal} />
      </div>
    </section>
  );
}
