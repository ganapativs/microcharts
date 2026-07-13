import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { CATALOG, SIZE, BENCH, FLAGSHIP, STATIC_SIZES, sizeRow } from "@/lib/docs-facts";
import { getChart } from "@/lib/catalog";

/** Perf-page figures from measured `docs-facts` (build + bench). */

// ── Size distribution — the library charting its own gzip footprint ──────────
export function SizeDistribution() {
  return (
    <figure className="not-prose my-6 panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-hairline px-4 py-2.5">
        <span className="mono-label">static gzip · {SIZE.count} charts</span>
        <span className="mono-label whitespace-nowrap opacity-70">
          {SIZE.min}–{SIZE.max} kB · median {SIZE.median} kB
        </span>
      </div>
      <div className="flex items-center justify-center px-6 py-8">
        <HistogramStrip
          data={STATIC_SIZES}
          markValue={3}
          width={340}
          height={72}
          format={{ maximumFractionDigits: 1, style: "unit", unit: "kilobyte" }}
          title={`Static gzip size of all ${SIZE.count} charts`}
        />
      </div>
      <figcaption className="border-t border-hairline px-4 py-2.5 text-[0.82rem] leading-relaxed text-fd-muted-foreground">
        {SIZE.under2} of {SIZE.count} charts ship under 2 kB; {SIZE.under3} under 3 kB. The two
        above the line —{" "}
        {SIZE.over3.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && ", "}
            <span className="text-fd-foreground">{c.name}</span> ({c.kB} kB)
          </span>
        ))}{" "}
        — carry the most geometry. The mark sits at the 3 kB reference.
      </figcaption>
    </figure>
  );
}

// ── Flagship size table — static / interactive per subpath ───────────────────
export function SizeTable() {
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Chart</th>
            <th className="py-2 pr-4 font-medium text-fd-muted-foreground">Static</th>
            <th className="py-2 font-medium text-fd-muted-foreground">Interactive</th>
          </tr>
        </thead>
        <tbody>
          {FLAGSHIP.map((slug) => {
            const r = sizeRow(slug);
            const name = getChart(slug)?.name ?? slug;
            return (
              <tr key={slug} className="border-b border-hairline/50 last:border-0">
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

// ── SSR scaling table — N sparklines → SVG string, from the real run ─────────
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

// ── Catalog-wide throughput summary ──────────────────────────────────────────
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

// ── Catalog facts — inline chips reused on Intro / All charts ────────────────
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
