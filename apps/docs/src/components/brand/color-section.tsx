import { ColorSwatch } from "@/components/brand/color-swatch";
import { ACCENTS } from "@/components/brand/shared";
import { BRAND_COLORS } from "@/lib/brand-assets";

// The page shows the values the kit ships. colors.json, the site tokens and
// these swatches are one set — brand-assets.test.ts holds them together.
const { cell, ink, paper, semantic } = BRAND_COLORS;

export function BrandColorSection() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Six accents, one token
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          One token drives the chrome, the links and the chart emphasis. Cobalt is the default and
          the other five swap in from the picker in the nav. Click a chip to copy its hex.
        </p>

        <div className="u-block grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCENTS.map((a) => (
            <div key={a.name} className="grid grid-cols-2 gap-2">
              <ColorSwatch hex={a.light} name={a.name} role="Light" />
              <ColorSwatch hex={a.dark} name={a.name} role="Dark" />
            </div>
          ))}
        </div>

        <div className="u-sub grid gap-8 md:grid-cols-2">
          <div>
            <p className="kicker">Neutrals</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ColorSwatch hex={paper.light} name="Paper" role="Light" ring />
              <ColorSwatch hex={ink.light} name="Ink" role="Light" />
              <ColorSwatch hex={paper.dark} name="Paper" role="Dark" />
              <ColorSwatch hex={ink.dark} name="Ink" role="Dark" ring />
              <ColorSwatch hex={cell} name="Cell fill" role="Mark" ring />
            </div>
          </div>
          <div>
            <p className="kicker">Semantic, never color alone</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ColorSwatch hex={semantic.positive.light} name="Positive" role="Light" />
              <ColorSwatch hex={semantic.positive.dark} name="Positive" role="Dark" />
              <ColorSwatch hex={semantic.negative.light} name="Negative" role="Light" />
              <ColorSwatch hex={semantic.negative.dark} name="Negative" role="Dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
