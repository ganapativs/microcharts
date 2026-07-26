import { SizeFootprintCard } from "@/components/home/size-footprint-card";
import { CATALOG, SIZE, BENCH, SIZE_SPAN, sizeRow } from "@/lib/docs-facts";
import { getChart } from "@/lib/catalog";

export function SizeDistribution() {
  return (
    <figure className="not-prose my-6">
      <SizeFootprintCard />
      {SIZE.over3.length > 0 ? (
        <figcaption className="mt-3 text-[0.82rem] leading-relaxed text-fd-muted-foreground">
          Interactive median {SIZE.interactiveMedian} kB across {SIZE.interactiveCount} entries. On
          the static twin, {SIZE.under2} of {SIZE.count} charts ship under 2 kB; {SIZE.under3} under
          3 kB. Above the 3 kB static mark —{" "}
          {SIZE.over3.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && ", "}
              <span className="text-fd-foreground">{c.name}</span> ({c.kB} kB)
            </span>
          ))}
          .
        </figcaption>
      ) : null}
    </figure>
  );
}

export function SizeTable() {
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">
              Across all {SIZE.count} charts
            </th>
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Chart</th>
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Static</th>
            <th className="py-2 font-medium text-fd-muted-foreground">Interactive</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_SPAN.map(({ slug, role }) => {
            const r = sizeRow(slug);
            const name = getChart(slug)?.name ?? slug;
            return (
              <tr key={slug} className="border-b border-hairline/50 last:border-0">
                <td className="py-2 pr-4 text-fd-muted-foreground">{role}</td>
                <td className="py-2 pr-4 text-fd-foreground">{name}</td>
                <td className="py-2 pr-4">{r.static?.toFixed(2)} kB</td>
                <td className="py-2">{r.interactive?.toFixed(2)} kB</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ScalingTable() {
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Charts</th>
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Time</th>
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Per chart</th>
            <th className="py-2 font-medium text-fd-muted-foreground">Payload</th>
          </tr>
        </thead>
        <tbody>
          {BENCH.scenarios.map((s) => (
            <tr key={s.count} className="border-b border-hairline/50 last:border-0">
              <td className="py-2 pr-4 text-fd-foreground">{s.count}</td>
              <td className="py-2 pr-4">{s.ms} ms</td>
              <td className="py-2 pr-4">{s.msPer} ms</td>
              <td className="py-2">~{s.avgBytes} B</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ThroughputSummary() {
  return (
    <div className="not-prose my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { k: "chart types", v: BENCH.count },
        { k: "median / chart", v: `${BENCH.medianMsPer} ms` },
        { k: "fastest", v: `${BENCH.fastest.rowsPerMs}/ms` },
        { k: "runtime deps", v: 0 },
      ].map((s) => (
        <div key={s.k} className="panel px-4 py-3">
          <div className="display text-2xl tabular-nums text-fd-foreground">{s.v}</div>
          <div className="mono-label mt-0.5 opacity-70">{s.k}</div>
        </div>
      ))}
    </div>
  );
}

export function CatalogFacts() {
  const c = CATALOG.collections;
  return (
    <div className="not-prose my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { k: "chart types", v: CATALOG.total },
        { k: "core", v: c.core },
        { k: "decision", v: c.decision },
        { k: "expressive · frontier", v: `${c.expressive} · ${c.frontier}` },
      ].map((s) => (
        <div key={s.k} className="panel px-4 py-3">
          <div className="display text-2xl tabular-nums text-fd-foreground">{s.v}</div>
          <div className="mono-label mt-0.5 opacity-70">{s.k}</div>
        </div>
      ))}
    </div>
  );
}
