// <TraceFold> — where did the latency go: which spans, at which depth, on the
// path that actually determined the total. One rect per span (x = start, width = duration, row =
// depth); the critical path is accented so "which spans mattered" reads at once.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_TRACE_FOLD, type TraceFoldStrings } from "../../core/strings-trace-fold.js";
import { traceFoldGeometry, traceFoldHeight, type Span } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type TraceFoldDatum = Span;

export interface TraceFoldProps {
  data: readonly TraceFoldDatum[];
  /** `"none"` renders spans uniformly for a structure-only audit. */
  emphasis?: "critical" | "none" | undefined;
  /** Width-gated in-rect labels. */
  labels?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
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
  const height = heightProp ?? traceFoldHeight(depthCount);
  const rowGap = 1.2;
  const fmt = makeFormatter(format, locale);
  const fontSize = labelFont(height / depthCount, 0.6);

  const geo = traceFoldGeometry({ data, width, height, rowGap });
  const accName = resolveSummary(summary, () => traceFoldSummary(geo, strings, fmt));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Depth rows are lanes, not columns: the bottom row is the deepest nesting,
      // not a zero, so there is nothing to stand on. The rows tile the box's
      // 1-unit inset exactly, which makes the block symmetric and the viewBox
      // frame the same midpoint the geometry would hand back.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-trace ${className}` : "mc-trace"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.rects.flatMap((r, i) => {
        // width 0 = the geometry could not place this span on the wall clock.
        // Drawing nothing is the honest read; a real span always clears the
        // 1-unit floor.
        if (r.width <= 0) return [];
        const active = emphasis === "none" ? true : r.critical;
        // fills/shape via ink roles + .mc-trace rules in styles.css — flat
        // siblings, minimal attributes: the span list is this chart's SSR hot
        // path (bench floor 15 charts/ms). fontSize stays an attribute (the
        // craft gate + containment estimates read it).
        const ink = emphasis === "none" ? "bar" : r.critical ? "accent" : "neutral";
        const opacity = emphasis === "none" ? 0.85 : r.critical ? undefined : 0.62;
        // a label must SEAT: wide enough for the text AND a row tall enough to
        // hold the floor font without bleeding onto neighbor rows — otherwise
        // it drops out and the strip reads clean (inline/tab sizes)
        const fits =
          labels && r.height >= fontSize + 0.8 && r.width >= r.label.length * fontSize * 0.6 + 2;
        const nodes = [
          <rect
            key={`r${i}`}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            data-mc-ink={ink}
            fillOpacity={opacity}
          />,
        ];
        if (fits)
          nodes.push(
            <text
              key={`t${i}`}
              x={round2(r.x + r.width / 2)}
              y={round2(r.y + r.height / 2)}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={fontSize}
              data-mc-dim={active ? undefined : ""}
            >
              {r.label}
            </text>,
          );
        return nodes;
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
