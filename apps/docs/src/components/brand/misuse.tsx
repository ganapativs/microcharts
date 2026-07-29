import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";
import { markInner } from "@/components/brand/shared";

const MISUSE = [
  {
    label: "Recolor the cells",
    svg: (
      <>
        <path d={SQUIRCLE_PATH} fill="var(--mc-accent)" />
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
    svg: <g transform="rotate(18 16 16)">{markInner("var(--mc-accent)")}</g>,
  },
  {
    label: "Stretch",
    svg: <g transform="translate(0 5) scale(1 0.68)">{markInner("var(--mc-accent)")}</g>,
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
        <g filter="url(#dropbad)">{markInner("var(--mc-accent)")}</g>
      </>
    ),
  },
  {
    label: "Reflow the grid",
    svg: (
      <>
        <path d={SQUIRCLE_PATH} fill="var(--mc-accent)" />
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
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          What not to do with it
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          The grade across the three cells is an encoding, the same kind the charts use. Every one
          of these breaks it.
        </p>
        <div className="u-block grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MISUSE.map((d) => (
            <div key={d.label} className="plate flex flex-col overflow-hidden">
              <div className="bk-stage relative min-h-[6.5rem]" data-tile="light">
                <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden>
                  {d.svg}
                </svg>
                <span aria-hidden className="bk-badge absolute right-2 top-2">
                  ×
                </span>
              </div>
              <p className="kicker px-3 pb-3 pt-3 text-center">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
