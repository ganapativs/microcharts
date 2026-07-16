import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";
import { Reveal } from "@/components/ui/reveal";
import { markInner, SectionMark } from "@/components/brand/shared";

const MISUSE = [
  {
    label: "Recolor the cells",
    svg: (
      <>
        <path d={SQUIRCLE_PATH} fill="var(--accent)" />
        {CELLS.map((c) => (
          <rect
            key={c.x}
            x={c.x}
            y={c.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={CELL_R}
            fill="#e11d48"
            opacity={c.o}
          />
        ))}
      </>
    ),
  },
  {
    label: "Invert fills",
    svg: markInner("var(--color-fd-foreground)", "var(--color-fd-foreground)"),
  },
  {
    label: "Rotate",
    svg: <g transform="rotate(18 16 16)">{markInner("var(--accent)")}</g>,
  },
  {
    label: "Stretch",
    svg: <g transform="translate(0 5) scale(1 0.68)">{markInner("var(--accent)")}</g>,
  },
  {
    label: "Add effects",
    svg: (
      <>
        <defs>
          <filter id="dropbad" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodOpacity="0.5" />
          </filter>
        </defs>
        <g filter="url(#dropbad)">{markInner("var(--accent)")}</g>
      </>
    ),
  },
  {
    label: "Reflow the grid",
    svg: (
      <>
        <path d={SQUIRCLE_PATH} fill="var(--accent)" />
        {[
          { x: 8, y: 8, o: 0.4 },
          { x: 20, y: 12, o: 0.7 },
          { x: 12, y: 20, o: 1 },
        ].map((c) => (
          <rect
            key={c.x}
            x={c.x}
            y={c.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={CELL_R}
            fill={CELL_FILL}
            opacity={c.o}
          />
        ))}
      </>
    ),
  },
];

export function BrandMisuse() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="04">Don’t</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">Protect the read.</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Recolor cells, invert fills, rotate, stretch, add effects, or reflow the grid. Each one
          breaks the encoding the mark shares with the charts.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {MISUSE.map((d, i) => (
          <Reveal key={d.label} delay={i * 35} className="glass flex flex-col overflow-hidden">
            <div className="bk-stage relative min-h-[6.5rem]" data-tile="light">
              <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden>
                {d.svg}
              </svg>
              <span aria-hidden className="bk-badge absolute right-2 top-2">
                ×
              </span>
            </div>
            <div className="border-t border-hairline px-3 py-2.5 text-center">
              <span className="text-xs text-fd-muted-foreground">{d.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
