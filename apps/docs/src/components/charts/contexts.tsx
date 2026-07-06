import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { getChart, type ChartEntry } from "@/lib/catalog";

/** A tiny chart sized for a given slug, reused across the four contexts. */
function Mark({
  chart,
  data,
  width,
  height,
}: {
  chart: ChartEntry;
  data: number[];
  width?: number;
  height?: number;
}) {
  const summary = false as const; // decorative here; the surrounding text explains it
  switch (chart.slug) {
    case "sparkline":
      return <Sparkline data={data} width={width ?? 64} height={height ?? 18} summary={summary} />;
    case "sparkbar":
      return <SparkBar data={data} width={width ?? 64} height={height ?? 18} summary={summary} />;
    case "delta":
      return <Delta value={0.124} summary={summary} />;
    case "bullet":
      return (
        <Bullet
          value={72}
          target={80}
          bands={[50, 90]}
          width={width ?? 90}
          height={height ?? 16}
          summary={summary}
        />
      );
    case "activity-grid":
      return <ActivityGrid data={data} layout="strip" cell={7} summary={summary} />;
    default:
      return null;
  }
}

const box =
  "rounded-lg border border-fd-border bg-fd-card p-4 flex flex-col gap-2 justify-between min-h-full";
const tag = "mono-label";

export function FourContexts({ slug }: { slug: string }) {
  const chart = getChart(slug);
  if (!chart) return null;
  const data = chart.demo;
  const last = [...data].reverse().find((n) => Number.isFinite(n)) ?? 0;

  return (
    <div className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* 1 — in a sentence */}
      <div className={box}>
        <span className={tag}>In a sentence</span>
        <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
          Signups held steady{" "}
          <span className="inline-flex translate-y-[0.15em] align-middle">
            <Mark chart={chart} data={data} />
          </span>{" "}
          through the quarter, closing at <span className="font-mono tabular-nums">{last}</span>.
        </p>
      </div>

      {/* 2 — in a table cell */}
      <div className={box}>
        <span className={tag}>In a table cell</span>
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {[
              ["Acme", data],
              ["Globex", [...data].reverse()],
            ].map(([name, series]) => (
              <tr key={name as string} className="border-t border-fd-border/60 first:border-0">
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{name as string}</td>
                <td className="py-1.5">
                  <Mark chart={chart} data={series as number[]} width={72} height={16} />
                </td>
                <td className="py-1.5 pl-3 text-right">
                  <Delta value={0.08} summary={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3 — in a KPI card */}
      <div className={box}>
        <span className={tag}>In a KPI card</span>
        <div>
          <div className="text-fd-muted-foreground text-xs">Weekly active</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">{last}k</span>
            <span className="mb-1">
              <Delta value={0.124} summary={false} />
            </span>
          </div>
        </div>
        <Mark chart={chart} data={data} width={200} height={36} />
      </div>

      {/* 4 — in a tab header */}
      <div className={box}>
        <span className={tag}>In a tab header</span>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Revenue", data],
            ["Users", [...data].reverse()],
          ].map(([name, series], i) => (
            <span
              key={name as string}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                i === 0
                  ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                  : "border-fd-border text-fd-muted-foreground"
              }`}
            >
              {name as string}
              <Mark chart={chart} data={series as number[]} width={44} height={14} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
