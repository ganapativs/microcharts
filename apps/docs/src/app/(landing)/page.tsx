import Link from "next/link";
import { CATALOG } from "@/lib/docs-facts";
import { SITE } from "@/lib/site";
import { ActOne } from "@/components/home/act-one";
import { FourPlaces } from "@/components/home/four-places";
import { PaperInversion } from "@/components/home/paper-inversion";
import { GrammarRows } from "@/components/home/grammar-rows";
import { FenceBeat } from "@/components/home/fence-beat";
import { GlyphSpecimen } from "@/components/home/glyph-specimen";
import { LeftOut } from "@/components/home/left-out";
import { BillField } from "@/components/home/bill-field";
import { GiveUpTable } from "@/components/home/give-up-table";
import { Degradation } from "@/components/home/degradation";
import { AppPlates } from "@/components/home/app-plates";
import { PresetScopeStyle } from "@/components/home/preset-scope-style";
import { DefineThemeLine } from "@/components/home/define-theme-line";
import { ClosingActions } from "@/components/home/actions";

/**
 * The home page. Four acts and a close:
 *
 *   I    it sits in a sentence   — one chart, inside one sentence, annotated
 *   II   106 marks               — one grammar, one specimen sheet, one fence
 *   III  the bill                — what it costs, counted, and what you give up
 *   IV   wear it                 — seven real apps, seven presets at once
 *
 * Every figure resolves from measured data (`docs-facts`, `chart-sizes.json`,
 * `competitor-facts`, `showcase`), every mark is a real component from the
 * library, and there is no `<img>`, `<picture>` or `<video>` in the route —
 * `home.test.ts` holds all three lines.
 *
 * No `metadata` export: this is `/`, so the root layout's head — title,
 * description, keywords, canonical, icons, Open Graph, Twitter, theme-color and
 * the four JSON-LD blocks — is already the right one. Overriding any of it here
 * would only let the two drift.
 */

/** Above this, a micro chart stops being a micro chart. */
const CEILING_PX = 200;

export default function HomePage() {
  const total = CATALOG.total;

  return (
    <>
      {/* Element-scoped presets (Act IV's wall) and the inverted sheet's ink, both
          generated from the library's token maps. First in the body so Act I's
          inverted frame is themed on its first paint. */}
      <PresetScopeStyle />

      {/* ─────────── ACT I · it sits in a sentence ─────────── */}
      <ActOne />

      <section aria-labelledby="four-places" className="act-after-fold">
        <div className="shell">
          <h2 id="four-places" className="display-2" style={{ maxWidth: "var(--m-head)" }}>
            The same sparkline in four places.
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
          <h2 id="act2" className="display-2" style={{ maxWidth: "var(--m-head)" }}>
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
          <h2 id="act3" className="display-2" style={{ maxWidth: "var(--m-head)" }}>
            How big is it?
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

      {/* ─────────── ACT IV · wear it ───────────
          Two sections, not one: a heading has to open the landmark it names, and
          the theming beat sits above this act's heading. */}
      <section aria-label="Theming" className="act">
        <div className="shell">
          {/* Text after a JSX expression must be a template literal when it spans
              a newline and carries a typographic apostrophe — SWC glues the words
              together in SSR otherwise (swc-ssr-spaces.test.ts). */}
          <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
            Give{" "}
            <Link
              prefetch={false}
              href="/docs/theming#build-a-theme-from-one-colour"
              className="ulink"
            >
              <code className="font-mono text-[0.78em]">defineTheme</code>
            </Link>
            {` one color. It works out the rest: a color-blind-safe scale, and a dark version tuned by hand. Green stays positive and vermillion stays negative whatever color you pass. The palette control at the top of the page runs it. Change the accent and the line below changes too.`}
          </p>
          <DefineThemeLine />
        </div>
      </section>

      <section aria-labelledby="act4" className="act">
        <div className="shell">
          <h2 id="act4" className="display-2" style={{ maxWidth: "var(--m-head)" }}>
            Seven example apps, every chart type between them.
          </h2>
          <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
            Each one lives in this repo and installs{" "}
            <code className="font-mono text-[0.82em] text-[var(--ink)]">{SITE.pkg}</code> from npm
            the way you would. They are all deployed, and the source sits next to the running site.
          </p>
          {/* Hidden below the grid breakpoint, where the plates stack full-width
              and this would describe a layout the reader cannot see. */}
          <p
            className="u-lede hidden font-mono text-[12px] leading-[1.6] tracking-[-0.03em] lg:block"
            style={{ color: "var(--ink-3)" }}
          >
            plate width follows how many of the {total} types each example uses
          </p>

          <AppPlates catalogTotal={total} />
        </div>
      </section>

      {/* ─────────── the close ─────────── */}
      <section className="act">
        <div className="shell">
          <h2 className="display-1" style={{ maxWidth: "var(--m-head)" }}>
            Put a chart in a sentence.
          </h2>
          <ClosingActions />
        </div>
      </section>
    </>
  );
}
