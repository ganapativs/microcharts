import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { MicroBox } from "@microcharts/react/micro-box";
import { BOOKINGS_WEEKS } from "./v3-data";

/**
 * The one inversion that closes Act I. It flips with the theme, so the mechanic
 * survives in both modes: the act always ends on the opposite surface.
 *
 * It is a page of PROSE with marks set into it, not a table. An earlier pass put
 * a two-row table with sparkline cells on this sheet — which is the beat that
 * already happened two frames earlier in `four-places` ("in a table cell"), on
 * the same inverted stock, with the same mark. Two sheets making one point read as
 * one point made twice and neither landing. This sheet does the thing the table
 * cannot: three DIFFERENT encodings, set inline like words, in a line of real
 * prose. The table demonstrates a cell; this demonstrates a sentence.
 *
 * Its claim — "Nothing here is an image" — is literally true of the whole route,
 * and `home-v3.test.ts` asserts it: no `<img>`, `<picture>` or `<video>` anywhere.
 * These are the STATIC entries, hook-free and listener-free, because a printed
 * page has no hover; the interactive twins appear everywhere the surface is a
 * screen. There is no `'use client'` here at all — the sheet is server HTML.
 */

/** All three marks read this. See `v3-data.ts` for why it is one array. */
const WEEKS = [...BOOKINGS_WEEKS];

export function PaperInversion() {
  return (
    <figure
      data-v3-invert
      className="relative max-w-[64rem] rounded-[2px] px-6 pb-8 pt-10 sm:px-12 sm:pb-10 sm:pt-16 lg:px-24 lg:pb-14 lg:pt-24"
    >
      <p
        className="text-[clamp(18px,0.95rem+0.7vw,26px)] leading-[1.68] text-pretty"
        style={{ maxWidth: "var(--m-prose)", fontFamily: "var(--fr)" }}
      >
        A reader shouldn&rsquo;t have to leave the sentence to understand the number. Here are
        thirteen weeks of bookings as a line
        <span className="mc-inline">
          <Sparkline curve="smooth" data={WEEKS} width={112} height={24} title="Bookings by week" />
        </span>
        {", as bars"}
        <span className="mc-inline">
          <SparkBar data={WEEKS} width={92} height={22} title="Bookings by week" />
        </span>
        and as a spread
        <span className="mc-inline">
          <MicroBox data={WEEKS} width={96} height={20} title="Spread of weekly bookings" />
        </span>
        &mdash; the same components the rest of this page uses, set like words. Nothing here is an
        image.
      </p>

      {/* The one rule on the sheet, and it earns itself: it separates the prose
          from the note about the prose. */}
      <div
        className="mt-10 border-t pt-3 font-mono text-[11px] leading-[1.5] tracking-[-0.02em] sm:mt-14"
        style={{ borderColor: "var(--paper-rule)", color: "var(--paper-faint)" }}
      >
        three components, rendered on the server · no JavaScript, no images
      </div>

      {/* The folio. Centred on the sheet, not on the text column: it is the page
          number of a page, which is the whole conceit. */}
      <div
        className="mt-8 text-center font-mono text-[11px] tracking-[0.24em] sm:mt-12"
        style={{ color: "var(--paper-faint)" }}
      >
        1
      </div>
    </figure>
  );
}
