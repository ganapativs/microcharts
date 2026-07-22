import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  span,
  hover = true,
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  span?: 2 | 3 | 4 | 6;
  hover?: boolean;
  accent?: boolean;
}) {
  const cls = ["card", hover && "hover", accent && "accent", span && `col-${span}`, className]
    .filter(Boolean)
    .join(" ");
  return <section className={cls}>{children}</section>;
}

export function CardHead({ title, sub, tag }: { title: string; sub?: string; tag?: ReactNode }) {
  return (
    <header className="card-head">
      <div style={{ minWidth: 0 }}>
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {tag && <span className="card-tag">{tag}</span>}
    </header>
  );
}

export function StatLine({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="statline">
      {items.map(([k, v]) => (
        <span key={k}>
          {k} <b>{v}</b>
        </span>
      ))}
    </div>
  );
}

/** Small accent dot used in tags/legends. */
export function Dot({ color = "var(--accent)" }: { color?: string }) {
  return <span className="swatch" style={{ background: color, borderRadius: 999 }} />;
}
