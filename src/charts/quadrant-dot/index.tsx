// <QuadrantDot> — where does this item sit in the 2×2, against the field?
// A focal dot placed by 2-D position, a hairline cross at the
// split (default = domain midpoints, always overridable, NEVER hidden), a faint
// tint on the focal's quadrant, and tiny muted ghost dots for the peers. No
// in-chart text at glyph scale — axis meaning lives in `title` + summary, so
// skipping them is the documented anti-pattern. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_QUADRANT, type QuadrantStrings } from "../../core/strings-quadrant.js";
import { quadrantDotGeometry, type QuadrantDotGeometry } from "./geometry.js";

export type QuadrantNames = readonly [string, string, string, string];

/** Focal quadrant name — an explicit `quadrants` tuple wins, else axis-relative. */
function quadName(
  geo: QuadrantDotGeometry,
  xLabel: string,
  yLabel: string,
  quadrants: QuadrantNames | undefined,
  strings: QuadrantStrings,
): string {
  return quadrants
    ? quadrants[geo.quadrant]
    : strings.quadrantName(geo.yHigh, yLabel, geo.xHigh, xLabel);
}

/** Factual quadrant summary. Shared with the interactive entry. */
export function quadrantSummary(
  geo: QuadrantDotGeometry,
  opts: { xLabel: string; yLabel: string; quadrants?: QuadrantNames | undefined },
  fmt: (v: number) => string,
  strings: QuadrantStrings,
): string {
  const name = quadName(geo, opts.xLabel, opts.yLabel, opts.quadrants, strings);
  const yv = fmt(geo.dot.vy);
  const xv = fmt(geo.dot.vx);
  return geo.fieldCount > 0
    ? strings.quadrant(opts.yLabel, yv, opts.xLabel, xv, name, geo.peersInQuadrant, geo.fieldCount)
    : strings.quadrantLone(opts.yLabel, yv, opts.xLabel, xv, name);
}

export interface QuadrantDotProps {
  /** The focal item's 2-D position. */
  data: { x: number; y: number };
  /** The peer set — omit for a lone glyph. */
  field?: readonly { x: number; y: number }[] | undefined;
  /** x-axis domain (`domain` stays the y-axis per grammar). */
  xDomain?: readonly [number, number] | undefined;
  domain?: readonly [number, number] | undefined;
  /** Quadrant boundary — default domain midpoints. Never hidden. */
  split?: readonly [number, number] | undefined;
  /** Names in reading order (TL, TR, BL, BR) — summaries only, never rendered. */
  quadrants?: QuadrantNames | undefined;
  /** Axis nouns for the summary (default "x"/"y" — pass them, it's the point). */
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  /** `false` drops the quadrant tint (dense grids). */
  region?: boolean | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: QuadrantStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function QuadrantDot(props: QuadrantDotProps): ReactNode {
  const {
    data,
    field,
    xDomain,
    domain,
    split,
    quadrants,
    xLabel = "x",
    yLabel = "y",
    region = true,
    format,
    locale,
    width = 24,
    height = 24,
    color,
    strings = EN_QUADRANT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-quadrant-dot ${className}` : "mc-quadrant-dot";
  const geo = quadrantDotGeometry({ width, height, data, field, xDomain, domain, split });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName =
    summary === false
      ? false
      : (summary ?? quadrantSummary(geo, { xLabel, yLabel, quadrants }, fmt, strings));
  const accent = color ?? "var(--mc-accent)";
  const focalR = Math.max(1.6, Math.min(width, height) * 0.1);
  const ghostR = Math.max(1, focalR * 0.52);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={style}
    >
      {/* faint tint on the focal's quadrant */}
      {region ? (
        <rect
          x={geo.region.x}
          y={geo.region.y}
          width={geo.region.width}
          height={geo.region.height}
          data-mc-ink="region"
        />
      ) : null}
      {/* the split cross — always where the split truly is */}
      {geo.cross.x !== null ? (
        <line
          x1={geo.cross.x}
          y1={0}
          x2={geo.cross.x}
          y2={height}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.cross.y !== null ? (
        <line
          x1={0}
          y1={geo.cross.y}
          x2={width}
          y2={geo.cross.y}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* peer field — small, muted, behind the focal (0.42 so peers read on
          dark; the role's 0.18 is tuned for large area marks, not tiny dots) */}
      {geo.ghosts.map((g) => (
        <circle
          key={`${g.vx}:${g.vy}`}
          cx={g.x}
          cy={g.y}
          r={ghostR}
          data-mc-ink="ghost"
          fillOpacity={0.42}
        />
      ))}
      {/* the focal item — accent, larger, on top, over a soft accent glow (a
          FILLED disc, not a hollow ring: a ring lets the cross line show as a
          chord through it) so it is unmistakable against the peer cloud */}
      <circle
        cx={geo.dot.x}
        cy={geo.dot.y}
        r={focalR + 1.4}
        style={{ fill: accent, fillOpacity: 0.18 }}
      />
      <circle
        cx={geo.dot.x}
        cy={geo.dot.y}
        r={focalR}
        data-mc-ink="data"
        style={{ fill: accent }}
      />
      {children}
    </Chart>
  );
}
