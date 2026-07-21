import { CHART_GZIP } from "@/lib/stats";
import { CATALOG, SIZE, SIZE_MARKETING } from "@/lib/docs-facts";
import { CHART_JS, RECHARTS } from "@/lib/competitor-facts";

/** Live catalog count — use in prose so MDX never hard-codes N. */
export function CatalogTotal() {
  return <span className="tabular-nums">{CATALOG.total}</span>;
}

/** CI-measured gzip for one chart slug (static / interactive / both). */
export function ChartSize({
  slug,
  which = "both",
}: {
  slug: string;
  which?: "static" | "interactive" | "both";
}) {
  const row = CHART_GZIP[slug];
  if (!row) return null;
  if (which === "static") return <span className="tabular-nums">{row.static} kB</span>;
  if (which === "interactive") return <span className="tabular-nums">{row.interactive} kB</span>;
  return (
    <span className="tabular-nums">
      {row.static} kB static · {row.interactive} kB interactive
    </span>
  );
}

export function SizeMarketing() {
  return <span>{SIZE_MARKETING}</span>;
}

/** Orientation table — complementary niches, not a scoreboard. */
export function VsRechartsTable() {
  const spark = CHART_GZIP.sparkline;
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium" scope="col">
              Signal
            </th>
            <th className="py-2 pr-4 font-medium" scope="col">
              Recharts {RECHARTS.version}
            </th>
            <th className="py-2 font-medium" scope="col">
              microcharts Sparkline
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums text-fd-muted-foreground">
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Gzip for one chart
            </th>
            <td className="py-2 pr-4">~{RECHARTS.oneChartGzipKb} kB (tree-shaken LineChart)</td>
            <td className="py-2">
              {spark?.static} kB static · {spark?.interactive} kB interactive
            </td>
          </tr>
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Whole package (gzip)
            </th>
            <td className="py-2 pr-4">~{RECHARTS.packageGzipKb} kB</td>
            <td className="py-2">one subpath; catalog median {SIZE.median} kB static</td>
          </tr>
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Runtime dependencies
            </th>
            <td className="py-2 pr-4">{RECHARTS.runtimeDeps}</td>
            <td className="py-2">0 (React is a peer)</td>
          </tr>
          <tr>
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Typical job
            </th>
            <td className="py-2 pr-4">Full chart surfaces (axes, legends, tooltips)</td>
            <td className="py-2">Word-sized marks inside UI / prose / RSC</td>
          </tr>
        </tbody>
      </table>
      <p className="mono-label mt-3 opacity-70">
        Orientation only — different jobs. Recharts package via bundlephobia {RECHARTS.measuredAt};
        one-chart via esbuild tree-shake {RECHARTS.measuredAt}. microcharts from .size-limit.json
        (CI).
      </p>
    </div>
  );
}

export function VsChartJsTable() {
  const spark = CHART_GZIP.sparkline;
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium" scope="col">
              Signal
            </th>
            <th className="py-2 pr-4 font-medium" scope="col">
              Chart.js {CHART_JS.version} + {CHART_JS.wrapper}
            </th>
            <th className="py-2 font-medium" scope="col">
              microcharts Sparkline
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums text-fd-muted-foreground">
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Gzip (library)
            </th>
            <td className="py-2 pr-4">
              ~{CHART_JS.packageGzipKb} kB (+ ~{CHART_JS.wrapperGzipKb} kB wrapper)
            </td>
            <td className="py-2">
              {spark?.static} kB static · {spark?.interactive} kB interactive
            </td>
          </tr>
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Renderer
            </th>
            <td className="py-2 pr-4">Canvas</td>
            <td className="py-2">SVG</td>
          </tr>
          <tr className="border-b border-hairline">
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Runtime dependencies
            </th>
            <td className="py-2 pr-4">{CHART_JS.runtimeDeps} (in chart.js)</td>
            <td className="py-2">0 (React is a peer)</td>
          </tr>
          <tr>
            <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
              Typical job
            </th>
            <td className="py-2 pr-4">Dashboard / report canvases, Chart.js plugins</td>
            <td className="py-2">Inline marks; static RSC with zero client JS</td>
          </tr>
        </tbody>
      </table>
      <p className="mono-label mt-3 opacity-70">
        Orientation only — different jobs. Chart.js via bundlephobia {CHART_JS.measuredAt}.
        microcharts from .size-limit.json (CI).
      </p>
    </div>
  );
}
