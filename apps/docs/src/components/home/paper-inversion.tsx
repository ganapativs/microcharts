import Link from "next/link";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { MicroBox } from "@microcharts/react/micro-box";
import { BOOKINGS_WEEKS } from "./home-data";

/**
 * The one inversion that closes Act I. It flips with the theme, so the act always
 * ends on the opposite surface.
 *
 * A page of PROSE with three different encodings set into it like words — the
 * table-cell beat already happened in `four-places`, so this sheet demonstrates a
 * sentence instead. STATIC entries throughout, because a printed page has no
 * hover; there is no `'use client'` here at all.
 *
 * "no images" in the note is literally true of the whole route, and
 * `home.test.ts` asserts it.
 */

/** All three marks read this. See `home-data.ts` for why it is one array. */
const WEEKS = [...BOOKINGS_WEEKS];

export function PaperInversion() {
  return (
    <figure
      data-invert
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
        &mdash; the same components the rest of this page uses,{" "}
        {/* The underline takes the sheet's own rule colour, or it would draw in
            the screen's hairline on paper stock. */}
        <Link
          prefetch={false}
          href="/docs/composition"
          className="ulink"
          style={{ textDecorationColor: "var(--paper-rule)" }}
        >
          set like words
        </Link>
        .
      </p>

      <div
        className="mt-10 border-t pt-3 font-mono text-[11px] leading-[1.5] tracking-[-0.02em] sm:mt-14"
        style={{ borderColor: "var(--paper-rule)", color: "var(--paper-faint)" }}
      >
        three components, rendered on the server · no JavaScript, no images
      </div>

      {/* The folio, centred on the sheet rather than the text column. */}
      <div
        className="mt-8 text-center font-mono text-[11px] tracking-[0.24em] sm:mt-12"
        style={{ color: "var(--paper-faint)" }}
      >
        1
      </div>
    </figure>
  );
}
