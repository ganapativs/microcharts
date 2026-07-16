import { ColorSwatch } from "@/components/brand/color-swatch";
import { Reveal } from "@/components/ui/reveal";
import { ACCENTS, SectionMark } from "@/components/brand/shared";

export function BrandColorSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="05">Color</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">One accent. Six tunings.</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          A single token drives chrome, links, and chart emphasis. Ember is the default; five
          siblings swap through the picker. Click any chip to copy its hex.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACCENTS.map((a) => (
          <div key={a.name} className="grid grid-cols-2 gap-2">
            <ColorSwatch hex={a.light} name={a.name} role="Light" />
            <ColorSwatch hex={a.dark} name={a.name} role="Dark" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="mono-label mb-3">Neutrals</div>
          <div className="grid grid-cols-2 gap-2">
            <ColorSwatch hex="#e9edf4" name="Paper" role="Light" ring />
            <ColorSwatch hex="#12151d" name="Ink" role="Light" />
            <ColorSwatch hex="#0a0b0f" name="Paper" role="Dark" />
            <ColorSwatch hex="#e9e8e3" name="Ink" role="Dark" ring />
            <ColorSwatch hex="#faf7f1" name="Cell fill" role="Mark" ring />
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="mono-label mb-3">Semantic — never color alone</div>
          <div className="grid grid-cols-2 gap-2">
            <ColorSwatch hex="#077353" name="Positive" role="Light" />
            <ColorSwatch hex="#45a385" name="Positive" role="Dark" />
            <ColorSwatch hex="#ad4713" name="Negative" role="Light" />
            <ColorSwatch hex="#df7856" name="Negative" role="Dark" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
