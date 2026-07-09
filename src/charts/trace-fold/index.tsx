// <TraceFold> — where did the latency go: which spans, at which depth, on the
// path that actually determined the total (plan/25 §18, plan/17 F17). Static,
// hook-free, RSC-safe. One rect per span (x = start, width = duration, row =
// depth); the critical path is accented so "which spans mattered" reads at once.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter } from "../../core/format.js";
import { EN_TRACE_FOLD, type TraceFoldStrings } from "../../core/strings-trace-fold.js";
import { traceFoldGeometry, type Span } from "./geometry.js";

export type TraceFoldDatum = Span;

export interface TraceFoldProps {
  data: readonly TraceFoldDatum[];
  /** `"none"` renders spans uniformly for a structure-only audit. */
  emphasis?: "critical" | "none" | undefined;
  /** Width-gated in-rect labels. */
  labels?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: TraceFoldStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — span count, total, and the longest span + its path status. */
export function traceFoldSummary(
  geo: ReturnType<typeof traceFoldGeometry>,
  strings: TraceFoldStrings,
  fmt: (n: number) => string,
): string {
  if (geo.rects.length === 0 || !geo.longest) return strings.noData;
  return strings.traceFold(
    geo.rects.length,
    fmt(geo.total),
    geo.longest.label,
    fmt(geo.longest.duration),
    geo.longest.critical,
  );
}

export function TraceFold(props: TraceFoldProps): ReactNode {
  const {
    data,
    emphasis = "critical",
    labels = true,
    width = 120,
    height: heightProp,
    format,
    locale,
    strings = EN_TRACE_FOLD,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const depthCount = Math.max(1, new Set(data.slice(0, 40).map((s) => s.depth)).size);
  const height = heightProp ?? Math.min(48, Math.max(16, depthCount * 10));
  const rowGap = 1.2;
  const fmt = makeFormatter(format, locale);
  const fontSize = labelFont(height / depthCount, 0.5);

  const geo = traceFoldGeometry({ data, width, height, rowGap });
  const accName = summary === false ? false : (summary ?? traceFoldSummary(geo, strings, fmt));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-trace ${className}` : "mc-trace"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.rects.map((r, i) => {
        const active = emphasis === "none" ? true : r.critical;
        const fill =
          emphasis === "none"
            ? "var(--mc-stroke)"
            : r.critical
              ? "var(--mc-accent)"
              : "var(--mc-neutral)";
        const opacity = emphasis === "none" ? 0.85 : r.critical ? 1 : 0.4;
        const fits = labels && r.width >= r.label.length * fontSize * 0.6 + 2;
        return (
          <g key={`${r.label}-${i}`}>
            <rect
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              rx={0.5}
              shapeRendering="crispEdges"
              data-mc-ink="band"
              style={{ fill, fillOpacity: opacity }}
            />
            {fits ? (
              <text
                x={round2(r.x + r.width / 2)}
                y={round2(r.y + r.height / 2)}
                dominantBaseline="central"
                textAnchor="middle"
                fontSize={fontSize}
                style={{
                  fill: active ? "rgba(255,255,255,0.96)" : "var(--mc-surface, Canvas)",
                  fontWeight: 600,
                }}
              >
                {r.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
