import type { Metadata } from "next";
import Link from "next/link";
import { CATALOG } from "@/lib/docs-facts";
import { SITE } from "@/lib/site";
import { ActOne } from "@/components/home-v3/act-one";
import { FourPlaces } from "@/components/home-v3/four-places";
import { PaperInversion } from "@/components/home-v3/paper-inversion";
import { GrammarRows } from "@/components/home-v3/grammar-rows";
import { FenceBeat } from "@/components/home-v3/fence-beat";
import { GlyphSpecimen } from "@/components/home-v3/glyph-specimen";
import { LeftOut } from "@/components/home-v3/left-out";
import { BillField } from "@/components/home-v3/bill-field";
import { GiveUpTable } from "@/components/home-v3/give-up-table";
import { Degradation } from "@/components/home-v3/degradation";
import { AppPlates } from "@/components/home-v3/app-plates";
import { PresetScopeStyle } from "@/components/home-v3/preset-scope-style";
import { DefineThemeLine } from "@/components/home-v3/define-theme-line";
import { ClosingActions } from "@/components/home-v3/actions";

/**
 * The v3 homepage candidate, running in parallel with `/`.
 *
 * Four acts and a colophon, and nothing else — the sections cut from earlier
 * drafts (a simulated assistant reply with prompt chips, a 37-tool register, a
 * five-card accessibility grid, a "build the eighth app" card) stay cut.
 *
 *   I    it sits in a sentence   — one chart, inside one sentence, annotated
 *   II   106 marks               — one grammar, one specimen sheet, one fence
 *   III  the bill                — what it costs, counted, and what you give up
 *   IV   wear it                 — seven real apps, seven presets at once
 *
 * Every figure on the page resolves from measured data (`docs-facts`,
 * `chart-sizes.json`, `competitor-facts`, `showcase`), every mark is a real
 * component from the library, and there is no `<img>`, `<picture>` or `<video>`
 * anywhere in the route — `home-v3.test.tsx` holds all three lines.
 *
 * **The head is `/`'s head.** This route is a candidate for the same page, so
 * everything a machine reads has to be what `/` serves: title, description,
 * keywords, canonical, icons, Open Graph, Twitter, theme-color and all four
 * JSON-LD blocks. All of it comes from the root layout, and the way to keep it
 * identical is to override as little as possible here.
 *
 * That is why there is no `title` and no `description` on this object. Both were
 * set once — `title: "Put a chart in a sentence"` rendered
 * "Put a chart in a sentence · microcharts" through the root template, so the
 * candidate and the page it is competing with disagreed in the one place a
 * search result and a browser tab actually show. Omitted, the root `default`
 * applies and the two are identical by construction rather than by copying.
 *
 * `alternates` still has to be spelled out in full. Next REPLACES the key rather
 * than merging it, so declaring `canonical` alone silently dropped the RSS and
 * llms.txt `<link rel="alternate">` tags that every other route on the site
 * carries.
 *
 * The ONE deliberate difference is `robots`. It argues the same product as `/`,
 * and two indexed pages making one argument is a duplicate, not a choice — the
 * canonical points home and the crawler is told to stay away. When this route
 * becomes `/`, delete the `robots` and `alternates.canonical` overrides and the
 * head is already correct.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": [{ url: "/rss.xml", title: `${SITE.name} releases` }],
      "text/plain": [{ url: "/llms.txt", title: `${SITE.name} for LLMs` }],
    },
  },
};

/** Above this, a micro chart stops being a micro chart. */
const CEILING_PX = 200;

export default function HomeV3Page() {
  const total = CATALOG.total;

  return (
    <>
      {/* Element-scoped presets (Act IV's wall) and the inverted sheet's ink,
          both generated from the library's own token maps. First in the body so
          Act I's inverted frame is themed on its first paint. */}
      <PresetScopeStyle />

      {/* ─────────── ACT I · it sits in a sentence ─────────── */}
      <ActOne />

      <section aria-labelledby="four-places" className="act-after-fold">
        <div className="shell">
          <h2 id="four-places" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            Here it is in four places.
          </h2>
          <FourPlaces />
        </div>
      </section>

      <section className="act">
        <div className="shell">
          <PaperInversion />
        </div>
      </section>

      {/* ─────────── ACT II · 106 marks ─────────── */}
      <section aria-labelledby="act2" className="act">
        <div className="shell">
          <h2 id="act2" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            All{" "}
            <span className="font-mono text-[0.86em] font-medium tracking-[-0.05em]">{total}</span>{" "}
            work the same way.
          </h2>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            Pass <code className="font-mono text-[0.82em] text-[var(--ink)]">data</code> and you get
            something correct. After that,{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">domain</code>,{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">color</code> and{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">title</code> mean the same
            thing in every chart. The catalog is typed, so an editor or an agent completes it
            without guessing.
          </p>

          <GrammarRows />
          <FenceBeat />
        </div>
      </section>

      <section aria-label="Every chart type" className="act">
        <div className="shell">
          <GlyphSpecimen />
        </div>
      </section>

      <LeftOut ceilingPx={CEILING_PX} />

      {/* ─────────── ACT III · the bill ─────────── */}
      <section aria-labelledby="act3" className="act">
        <div className="shell">
          <h2 id="act3" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            What you trade for that.
          </h2>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            Recharts is a toolkit and 106 kB is a fair price for what it carries: tree-shaking drops
            the chart types you don&rsquo;t use, but the shared kernel comes along either way.
            That&rsquo;s a fine trade on a page that is mostly chart. In a table cell it&rsquo;s the
            whole budget.
          </p>
        </div>

        <BillField />
        <GiveUpTable />
        <Degradation />
      </section>

      {/* ─────────── ACT IV · wear it ─────────── */}
      <section aria-labelledby="act4" className="act">
        <div className="shell">
          {/* Short sentences, ordinary words, in the register the rest of the page
              uses ("Both columns are honest.", "Bad data renders anyway."). Two
              earlier drafts failed the same way in opposite directions: the first
              ended each claim with an explanation of itself ("...because those two
              carry meaning"), and the second reached for a voice ("a dark mode
              somebody sat down and tuned", "up is up and down is down"). Both read
              as written-up rather than said. The rule for this page: if you would
              not say it to someone at a desk, it does not go on the page.

              The link is on `defineTheme` itself, and it goes to the section of
              the theming page about that one function. A trailing "read more about
              theming" line would be a second element saying what the first element
              already said.

              Text after a JSX expression must be a template literal when it spans
              a newline and carries a typographic apostrophe — SWC glues the words
              together in SSR otherwise (swc-ssr-spaces.test.ts). */}
          <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
            Give{" "}
            <Link prefetch={false} href="/docs/theming#build-a-theme-from-one-colour" className="u">
              <code className="font-mono text-[0.78em]">defineTheme</code>
            </Link>
            {` one color. It works out the rest: a color-blind-safe scale, and a dark version tuned by hand. Green stays positive and vermillion stays negative whatever color you pass. The palette control at the top of the page runs it. Change the accent and the line below changes too.`}
          </p>
          <DefineThemeLine />

          <h2 id="act4" className="d2 u-sub" style={{ maxWidth: "var(--m-head)" }}>
            Seven apps, and every chart type between them.
          </h2>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            Each one lives in this repo and installs{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">{SITE.pkg}</code> from npm
            the way you would. They are all deployed, and the source sits next to the running site.
          </p>
          {/* Only where the plates actually differ in width. Below the grid
              breakpoint they stack full-width, and a note about plate size would
              be describing a layout the reader cannot see. The per-app count
              stays on every plate at every width. */}
          <p
            className="u-lede hidden font-mono text-[12px] leading-[1.6] tracking-[-0.03em] lg:block"
            style={{ color: "var(--ink-3)" }}
          >
            plate width follows how many of the {total} types each example uses
          </p>

          <AppPlates catalogTotal={total} />
        </div>
      </section>

      {/* ─────────── colophon ─────────── */}
      {/* No rule above the colophon. It used to carry a full-bleed `border-t`, and
          with a display line that size directly under it the rule read as a lid on
          the page rather than a boundary — space already separates the acts
          everywhere else, and the footer draws its own edge below. */}
      <section className="act">
        <div className="shell">
          <h2 className="d1" style={{ maxWidth: "var(--m-head)" }}>
            Put a chart in a sentence.
          </h2>
          {/* No licence line and no author here: the footer directly below already
              carries "Zero deps · MIT" and the name, and printing them twice within
              200px of each other made the close look like a template that had run
              out of things to say. This is a door, not a colophon. */}
          <ClosingActions />
        </div>
      </section>
    </>
  );
}
