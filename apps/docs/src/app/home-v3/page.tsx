import type { Metadata } from "next";
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
 * It is `noindex` while it is a candidate: it argues the same product as `/`, and
 * two indexed pages making one argument is a duplicate, not a choice.
 */
export const metadata: Metadata = {
  title: "Put a chart in a sentence",
  description: SITE.description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
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
      <ActOne catalogTotal={total} />

      <section aria-labelledby="four-places">
        <div className="shell">
          <h2 id="four-places" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            The same component in four places, unchanged.
          </h2>
          <FourPlaces />
        </div>
      </section>

      <section className="beat">
        <div className="shell">
          <PaperInversion />
        </div>
      </section>

      {/* ─────────── ACT II · 106 marks ─────────── */}
      <section aria-labelledby="act2" className="act">
        <div className="shell">
          <h2 id="act2" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            Once you can write one of these, you can write all{" "}
            <span className="font-mono text-[0.86em] font-medium tracking-[-0.05em]">{total}</span>.
          </h2>
          <p className="prose mt-6" style={{ maxWidth: "var(--m-prose)" }}>
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

      <section aria-label="Every chart type" className="beat">
        <div className="shell">
          <GlyphSpecimen />
        </div>
      </section>

      <LeftOut ceilingPx={CEILING_PX} />

      {/* ─────────── ACT III · the bill ─────────── */}
      <section aria-labelledby="act3" className="act">
        <div className="shell">
          <h2 id="act3" className="d2" style={{ maxWidth: "var(--m-head)" }}>
            It has to be small enough that nobody argues about it.
          </h2>
          <p className="prose mt-6" style={{ maxWidth: "var(--m-prose)" }}>
            Recharts is a toolkit and 106 kB is a fair price for what it carries: tree-shaking drops
            the chart types you don&rsquo;t use, but the shared kernel comes along. On a page that
            is mostly chart, that&rsquo;s the right trade. Inside a table cell, it&rsquo;s the
            entire budget.
          </p>
        </div>

        <BillField />
        <GiveUpTable />
        <Degradation />
      </section>

      {/* ─────────── ACT IV · wear it ─────────── */}
      <section aria-labelledby="act4" className="act">
        <div className="shell">
          <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
            Give <code className="font-mono text-[0.78em]">defineTheme</code> one color and it works
            out the rest: a color-blind-safe scale and a hand-tuned dark version of it. Positive
            stays green and negative stays vermillion whatever you pass, because those two carry
            meaning. The palette control in the masthead runs it on this page.
          </p>
          <DefineThemeLine />

          <h2
            id="act4"
            className="d2 mt-14 sm:mt-20 lg:mt-24"
            style={{ maxWidth: "var(--m-head)" }}
          >
            Seven example apps you can open. Between them they use all{" "}
            <span className="font-mono text-[0.86em] font-medium tracking-[-0.05em]">{total}</span>{" "}
            types.
          </h2>
          <p className="prose mt-6" style={{ maxWidth: "var(--m-prose)" }}>
            Each one lives in this repo and installs{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">{SITE.pkg}</code> from npm
            the way you would. They are all deployed, and the source sits next to the running site.
          </p>
          {/* Only where the plates actually differ in width. Below the grid
              breakpoint they stack full-width, and a note about plate size would
              be describing a layout the reader cannot see. The per-app count
              stays on every plate at every width. */}
          <p
            className="mt-5 hidden font-mono text-[12px] leading-[1.6] tracking-[-0.03em] lg:block"
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
