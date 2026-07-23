import type { ReactNode } from "react";
import { CHART_GZIP } from "@/lib/stats";
import { CATALOG, SIZE, SIZE_MARKETING } from "@/lib/docs-facts";
import {
  CHART_JS,
  MUI_X_CHARTS,
  REACT_SPARKLINES_LEGACY,
  RECHARTS,
  VISX,
} from "@/lib/competitor-facts";

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

/** Shared two-column comparison table shell — same markup as the hand-written
 *  Vs tables below so every comparison page reads identically. */
function CompareTable({
  competitor,
  rows,
  note,
}: {
  competitor: string;
  rows: { signal: string; them: ReactNode; us: ReactNode }[];
  note: string;
}) {
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            <th className="py-2 pr-4 font-medium" scope="col">
              Signal
            </th>
            <th className="py-2 pr-4 font-medium" scope="col">
              {competitor}
            </th>
            <th className="py-2 font-medium" scope="col">
              microcharts Sparkline
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums text-fd-muted-foreground">
          {rows.map((r, i) => (
            <tr key={r.signal} className={i < rows.length - 1 ? "border-b border-hairline" : ""}>
              <th className="py-2 pr-4 text-left font-normal text-fd-foreground" scope="row">
                {r.signal}
              </th>
              <td className="py-2 pr-4">{r.them}</td>
              <td className="py-2">{r.us}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mono-label mt-3 opacity-70">{note}</p>
    </div>
  );
}

/** Orientation table for /docs/vs-react-sparklines — context, not a pile-on. */
export function VsReactSparklinesTable() {
  const spark = CHART_GZIP.sparkline;
  const rs = REACT_SPARKLINES_LEGACY;
  return (
    <CompareTable
      competitor={`react-sparklines ${rs.version}`}
      rows={[
        {
          signal: "Gzip (react external)",
          them: `${rs.packageGzipKb} kB`,
          us: `${spark?.static} kB static · ${spark?.interactive} kB interactive`,
        },
        {
          signal: "Last npm publish",
          them: rs.lastPublish,
          us: "actively maintained",
        },
        {
          signal: "Runtime dependencies",
          them: rs.runtimeDeps.join(", "),
          us: "0 (React is a peer)",
        },
        {
          signal: "Accessible name",
          them: "none by default (bare <svg>)",
          us: 'role="img" + summary from the data',
        },
        {
          signal: "Server Components",
          them: "class components — need a client boundary",
          us: "static entry renders in RSC, zero client JS",
        },
      ]}
      note={`react-sparklines gzip via esbuild minify+gzip ${rs.measuredAt}; last publish + deps from npm. microcharts from .size-limit.json (CI).`}
    />
  );
}

/** Orientation table for /docs/vs-mui-x-sparkline — complementary stacks. */
export function VsMuiXTable() {
  const spark = CHART_GZIP.sparkline;
  const mui = MUI_X_CHARTS;
  return (
    <CompareTable
      competitor={`MUI X SparkLineChart ${mui.version}`}
      rows={[
        {
          signal: "Gzip in an app already on MUI",
          them: `~${mui.sparklineInMuiAppGzipKb} kB (MUI peers external)`,
          us: `${spark?.static} kB static · ${spark?.interactive} kB interactive`,
        },
        {
          signal: "Gzip without MUI in the bundle",
          them: `~${mui.sparklineStandaloneGzipKb} kB (only react external)`,
          us: "same — no other packages involved",
        },
        {
          signal: "Runtime dependencies",
          them: `${mui.runtimeDeps}, plus required @mui/material + @mui/system peers`,
          us: "0 (React is a peer)",
        },
        {
          signal: "Server Components",
          them: "'use client' — renders on the client, ships its JS",
          us: "static entry renders in RSC, zero client JS",
        },
        {
          signal: "Default accessible name",
          them: 'none — the chart SVG is aria-hidden="true"',
          us: 'role="img" + summary from the data',
        },
      ]}
      note={`MUI X sizes via esbuild tree-shake of @mui/x-charts/SparkLineChart, minify+gzip ${mui.measuredAt}; directive + default markup verified against the published package. microcharts from .size-limit.json (CI).`}
    />
  );
}

/** Orientation table for /docs/vs-visx — primitives vs finished marks. */
export function VsVisxTable() {
  const spark = CHART_GZIP.sparkline;
  return (
    <CompareTable
      competitor={`visx ${VISX.version} (minimal sparkline)`}
      rows={[
        {
          signal: "Gzip for one sparkline",
          them: `~${VISX.minimalSparklineGzipKb} kB (@visx/shape + @visx/scale)`,
          us: `${spark?.static} kB static · ${spark?.interactive} kB interactive`,
        },
        {
          signal: "What you get",
          them: "primitives — you compose the chart",
          us: "a finished, opinionated mark",
        },
        {
          signal: "Runtime dependencies",
          them: `${VISX.shapeRuntimeDeps} in @visx/shape (incl. vendored d3)`,
          us: "0 (React is a peer)",
        },
        {
          signal: "Accessible name",
          them: "yours to author (LinePath renders a bare <path>)",
          us: 'role="img" + summary from the data',
        },
        {
          signal: "Design decisions",
          them: "all yours — full control",
          us: "made for you — word-sized defaults",
        },
      ]}
      note={`visx size via esbuild bundle of LinePath + scaleLinear, react external, minify+gzip ${VISX.measuredAt}. microcharts from .size-limit.json (CI).`}
    />
  );
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
