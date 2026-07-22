import type { ReactNode } from "react";

// Server-safe presentational helpers (no "use client").

export function Topbar({
  title,
  crumb,
  badge,
  window = "Last 30 days",
}: {
  title: string;
  crumb?: string;
  badge?: ReactNode;
  window?: string;
}) {
  return (
    <header className="topbar">
      <span className="topbar-title">
        {crumb && (
          <>
            <span className="topbar-crumb">{crumb}</span>
            <span className="topbar-sep" aria-hidden>
              /
            </span>
          </>
        )}
        {title}
      </span>
      <div className="topbar-actions">
        {badge}
        <span className="pill">{window}</span>
      </div>
    </header>
  );
}

export function PageHead({
  index,
  eyebrow,
  title,
  sub,
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="page-head">
      {(index || eyebrow) && (
        <div className="page-head-top">
          {index && <span className="page-index">{index}</span>}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </div>
      )}
      <h1>{title}</h1>
      <p className="lead">{sub}</p>
      <div className="page-rule" aria-hidden />
    </div>
  );
}

export function SectionHead({
  index,
  title,
  sub,
}: {
  index?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="section-head">
      {index && <span className="section-index">{index}</span>}
      <h2>{title}</h2>
      {sub && <span className="section-note">{sub}</span>}
      <span className="rule-fill" aria-hidden />
    </div>
  );
}

export function Card({
  title,
  sub,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className ? `card ${className}` : "card"}>
      {(title || sub) && (
        <div className="card-head">
          {title && <span className="card-title">{title}</span>}
          {sub && <span className="card-sub">{sub}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label} className="legend-item">
          <span className="legend-swatch" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
