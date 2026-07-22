import type { ReactNode } from "react";

/** Charts fill their container; viewBox keeps the aspect. */
export const fluid = { width: "100%", height: "auto" } as const;

export function Card({
  title,
  hint,
  span,
  className,
  children,
}: {
  title?: string;
  hint?: ReactNode;
  span?: "wide" | "narrow" | "full";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card${span ? ` card--${span}` : ""}${className ? ` ${className}` : ""}`}>
      {title && (
        <header className="card__head">
          <h3 className="card__title">{title}</h3>
          {hint && <span className="card__hint">{hint}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

/** A compact KPI tile: a label, a single chart, and a headline value. */
export function Kpi({
  label,
  value,
  sub,
  accent,
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <section className="kpi">
      <span className="kpi__label">{label}</span>
      <div className="kpi__chart">{children}</div>
      <span className="kpi__value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
      {sub && <span className="kpi__sub">{sub}</span>}
    </section>
  );
}

/** An editorial opener for a view: a kicker + one warm line of context. */
export function Lede({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <header className="lede">
      <p className="lede__kicker">{kicker}</p>
      <p className="lede__text">{children}</p>
    </header>
  );
}
