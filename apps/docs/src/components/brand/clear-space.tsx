import { Brandmark } from "@/components/brandmark";
import { markInner } from "@/components/brand/shared";

export function BrandClearSpace() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Clear space and minimum size
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Keep at least one cell-width of air on every side, and don&rsquo;t render the mark below
          16&nbsp;px, where the grade between the cells stops reading.
        </p>
        <div className="u-block grid gap-3 lg:grid-cols-2">
          <div className="plate flex flex-col items-center justify-center gap-5 p-8">
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
                stroke="var(--mc-accent)"
                strokeOpacity="0.4"
                strokeDasharray="2 2.5"
              />
              <g transform="translate(12 12)">{markInner("var(--mc-accent)")}</g>
            </svg>
            <p className="kicker text-center">dashed field = reserved space</p>
          </div>
          <div className="plate flex flex-col justify-center gap-8 p-8">
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
                    <div className="mono tabular-nums" style={{ color: "var(--ink)" }}>
                      {s.label}
                    </div>
                    <div className="kicker mt-1.5">{s.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="prose u-ruled text-[0.92rem]">
              The SVG scales cleanly above 16 px to any size. Prefer the adaptive mark when the host
              theme can flip.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
