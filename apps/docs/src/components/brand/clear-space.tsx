import { Brandmark } from "@/components/brandmark";
import { Reveal } from "@/components/ui/reveal";
import { markInner, SectionMark } from "@/components/brand/shared";

export function BrandClearSpace() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="03">Clear space &amp; size</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          One cell of air. Sixteen pixels floor.
        </h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Keep clear space of at least one cell-width on every side. Below 16 px the grade collapses
          — never go smaller.
        </p>
      </Reveal>
      <div className="grid gap-3 lg:grid-cols-2">
        <Reveal className="panel flex flex-col items-center justify-center gap-5 p-8">
          <svg
            viewBox="0 0 56 56"
            width="188"
            height="188"
            role="img"
            aria-label="Clear space: one cell-width on every side"
          >
            <rect
              x="4"
              y="4"
              width="48"
              height="48"
              rx="4"
              fill="none"
              stroke="var(--accent)"
              strokeOpacity="0.4"
              strokeDasharray="2 2.5"
            />
            <g transform="translate(12 12)">{markInner("var(--accent)")}</g>
          </svg>
          <p className="mono-label text-center opacity-70">dashed field = reserved space</p>
        </Reveal>
        <Reveal delay={80} className="panel flex flex-col justify-center gap-8 p-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { px: 16, label: "16 px", role: "Favicon · minimum" },
              { px: 24, label: "24 px", role: "Inline · UI" },
              { px: 40, label: "40 px", role: "Comfortable" },
            ].map((s) => (
              <div key={s.px} className="flex flex-col items-center gap-3">
                <div className="flex h-10 items-end justify-center">
                  <Brandmark size={s.px} />
                </div>
                <div className="text-center">
                  <div className="font-mono text-xs leading-5 tabular-nums text-fd-foreground">
                    {s.label}
                  </div>
                  <div className="mono-label leading-5 opacity-70">{s.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-hairline pt-5 text-sm leading-relaxed text-fd-muted-foreground">
            The SVG scales cleanly above 16 px to any size. Prefer the adaptive mark when the host
            theme can flip.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
