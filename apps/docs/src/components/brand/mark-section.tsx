import { SPECS } from "@/components/brand/shared";

export function BrandMarkSection() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Where the mark comes from
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          The three cells climb bottom-left to top-right, fill grading faint to solid. That grade is
          the same honest encoding the charts use: value carried by weight, not decoration.
        </p>
        {/* One rule between rows, none around them. A four-cell spec table ringed
            on every side is sixteen edges for four facts. */}
        <dl className="u-block grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {SPECS.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <dt className="kicker">{k}</dt>
              <dd className="mono" style={{ color: "var(--ink)" }}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
