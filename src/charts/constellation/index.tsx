// <Constellation> — when rare events happened, and how big (plan/24 #16, S1
// points). Position is the channel: x = time, y = value; optional magnitude sets
// area-true dot size. A hairline chronology line connects the events in time
// order. When no values are given, vertical position is deterministic jitter that
// encodes NOTHING (the docs and this file say so; the summary never reads it).
// Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_CONSTELLATION, type ConstellationStrings } from "../../core/strings-constellation.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { constellationGeometry } from "./geometry.js";

export interface ConstellationPoint {
  /** Time (the x axis; required, never jittered). */
  x: number;
  /** Value (the y axis). Omit on every point to fall back to jittered layout. */
  y?: number | undefined;
  /** Magnitude → area-true dot size (r ∝ √m). Omit for uniform dots. */
  m?: number | undefined;
}

export interface ConstellationProps {
  data: readonly ConstellationPoint[];
  /** The faint chronology line. Default `true`; off for a pure scatter. */
  connect?: boolean | undefined;
  /** Numeral at the largest event (`max`), or none (default). */
  label?: "max" | "none" | undefined;
  /** Value (y) extent. Default: data extent. */
  domain?: readonly [number, number] | undefined;
  /** Time (x) extent. Default: data extent. */
  xDomain?: readonly [number, number] | undefined;
  /** Formats x for the summary / labels (e.g. a month name). Default: numeric. */
  xFormat?: ((x: number) => string) | undefined;
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  rBase?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ConstellationStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function constellationSummary(
  data: readonly ConstellationPoint[],
  opts: {
    xFormat?: ((x: number) => string) | undefined;
    strings?: ConstellationStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { strings = EN_CONSTELLATION, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  const xFmt = opts.xFormat ?? ((x: number) => fmt(x));
  const pts = data.filter((p) => Number.isFinite(p.x));
  if (pts.length === 0) return strings.noData;

  let first = pts[0]!;
  let last = pts[0]!;
  for (const p of pts) {
    if (p.x < first.x) first = p;
    if (p.x > last.x) last = p;
  }

  // Largest = max magnitude, else max value, else the last event.
  const mags = pts.filter((p) => typeof p.m === "number" && Number.isFinite(p.m));
  const vals = pts.filter((p) => typeof p.y === "number" && Number.isFinite(p.y));
  let largest = last;
  if (mags.length) {
    largest = mags.reduce((a, b) => (b.m! > a.m! ? b : a));
  } else if (vals.length) {
    largest = vals.reduce((a, b) => (b.y! > a.y! ? b : a));
  }

  if (pts.length === 1) return strings.constellationOne(xFmt(first.x));
  return strings.constellation(pts.length, xFmt(first.x), xFmt(last.x), xFmt(largest.x));
}

export function Constellation(props: ConstellationProps): ReactNode {
  const {
    data,
    connect = true,
    label = "none",
    domain,
    xDomain,
    xFormat,
    color,
    width = 60,
    height = 20,
    rBase = 1.6,
    fontSize = 6,
    format,
    locale,
    strings = EN_CONSTELLATION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = constellationGeometry({
    points: data,
    width,
    height,
    domain,
    xDomain,
    connect,
    rBase,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? constellationSummary(data, { xFormat, strings, format, locale }));
  const fill = color ?? "var(--mc-stroke)";
  const fmt = makeFormatter(format, locale);

  // label="max": one numeral BESIDE the largest event (its magnitude, else
  // value). Placed to the right, flipped left near the edge, and vertically
  // centered so it never sits on its own mark (craft TEXT-ON-MARK gate).
  let maxLabel: { x: number; y: number; text: string; anchor: "start" | "end" } | null = null;
  if (label === "max" && geo.largestIndex >= 0) {
    const star = geo.stars.find((s) => s.index === geo.largestIndex);
    if (star) {
      const n = Number.isFinite(star.m) ? star.m : star.value;
      if (Number.isFinite(n)) {
        const t = fmt(n);
        const textW = t.length * 0.62 * fontSize;
        const rightX = star.cx + star.r + 1;
        const fitsRight = rightX + textW <= geo.width - PAD;
        const anchor = fitsRight ? "start" : "end";
        const x = fitsRight ? rightX : star.cx - star.r - 1;
        const y = Math.min(
          Math.max(star.cy + fontSize * 0.32, fontSize),
          geo.height - fontSize * 0.3,
        );
        maxLabel = { x, y, text: t, anchor };
      }
    }
  }

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-constellation ${className}` : "mc-constellation"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {geo.connectorPath ? (
        <path d={geo.connectorPath} data-mc-ink="ghost" style={{ strokeWidth: 0.75 }} />
      ) : null}
      {geo.stars.map((s) => (
        <circle key={`s${s.index}`} cx={s.cx} cy={s.cy} r={s.r} style={{ fill }} />
      ))}
      {maxLabel ? (
        <text
          x={maxLabel.x}
          y={maxLabel.y}
          fontSize={fontSize}
          textAnchor={maxLabel.anchor}
          data-mc-ink="label"
        >
          {maxLabel.text}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
