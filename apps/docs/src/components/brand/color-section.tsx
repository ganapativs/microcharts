import { ColorSwatch } from "@/components/brand/color-swatch";
import { ACCENTS } from "@/components/brand/shared";

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
              <ColorSwatch hex="#e9edf4" name="Paper" role="Light" ring />
              <ColorSwatch hex="#12151d" name="Ink" role="Light" />
              <ColorSwatch hex="#0a0b0f" name="Paper" role="Dark" />
              <ColorSwatch hex="#e9e8e3" name="Ink" role="Dark" ring />
              <ColorSwatch hex="#faf7f1" name="Cell fill" role="Mark" ring />
            </div>
          </div>
          <div>
            <p className="kicker">Semantic, never color alone</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ColorSwatch hex="#077353" name="Positive" role="Light" />
              <ColorSwatch hex="#45a385" name="Positive" role="Dark" />
              <ColorSwatch hex="#ad4713" name="Negative" role="Light" />
              <ColorSwatch hex="#df7856" name="Negative" role="Dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
