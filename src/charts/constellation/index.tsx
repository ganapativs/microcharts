// <Constellation> — when rare events happened, and how big (S1 points).
// Position is the channel: x = time, y = value; optional magnitude sets
// area-true dot size. A hairline chronology line connects the events in time
// order. When no values are given, vertical position is deterministic jitter that
// encodes NOTHING (the docs and this file say so; the summary never reads it).
// Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_CONSTELLATION, type ConstellationStrings } from "../../core/strings-constellation.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { round2 } from "../../core/types.js";
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
  const fontSize = props.fontSize ?? labelFont(height);

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
  const fmt = makeFormatter(format, locale);

  const largest = geo.stars.find((s) => s.index === geo.largestIndex);

  // label="max": the magnitude numeral, centred over the brightest star and
  // lifted clear of its halo ring so it never sits on a mark (drops below when
  // the top edge is tight; nudged in horizontally at the sides).
  let maxLabel: { x: number; y: number; text: string; anchor: "middle" } | null = null;
  if (label === "max" && largest) {
    const n = Number.isFinite(largest.m) ? largest.m : largest.value;
    if (Number.isFinite(n)) {
      const t = fmt(n);
      const textW = t.length * 0.62 * fontSize;
      const haloR = largest.r + 1.6; // matches the halo circle below
      const gap = 1.5;
      // baseline above the halo; if the text would clip the top, put it below.
      // 0.95·em ascent (glyph caps run taller than a 0.8 estimate — a 0.8 gap let
      // the top of the numeral kiss the halo ring).
      const ascent = fontSize * 0.95;
      const above = largest.cy - haloR - gap;
      // Degrade, don't spill. Above is preferred. Below is the fallback, and it
      // used to be taken on faith — on a short box the numeral's descender line
      // ran straight out through the bottom edge, and `.mc-root` is
      // `overflow: visible`, so it landed in the page rather than clipping. So
      // the fallback is now pinned to the frame (`maxY` keeps the whole em-box
      // inside) and then CHECKED: it is only used if the pinned line still
      // clears the star's halo. On a box too short to hold both the star and a
      // numeral clear of it, the numeral is DROPPED — the halo already marks
      // which event is brightest, and the summary always carries the number.
      const maxY = geo.height - fontSize * 0.22;
      const pinned = Math.min(largest.cy + haloR + gap + ascent, maxY);
      const clears = pinned - fontSize * 0.78 >= largest.cy + haloR;
      const y = above - ascent >= PAD ? above : clears ? pinned : null;
      if (y !== null) {
        const x = Math.min(Math.max(largest.cx, PAD + textW / 2), geo.width - PAD - textW / 2);
        maxLabel = { x, y: round2(y), text: t, anchor: "middle" };
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
      // Scattered points with nothing resting on anything — no floor to stand
      // on — so the inset plot frame centres on the cap band. The frame is the
      // padded box, not the stars' extent, which moves with every event.
      seat={{ mode: "center", top: PAD, bottom: geo.height - PAD }}
      className={className ? `mc-constellation ${className}` : "mc-constellation"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.connectorPath ? (
        <path d={geo.connectorPath} data-mc-ink="ghost" data-mc-w="tick" />
      ) : null}
      {largest ? (
        <circle
          cx={largest.cx}
          cy={largest.cy}
          r={largest.r + 1.6}
          fill="none"
          stroke="var(--mc-accent)"
          data-mc-w="tick"
          strokeOpacity={0.4}
        />
      ) : null}
      {geo.stars.map((s) => {
        const isLargest = s.index === geo.largestIndex;
        return (
          <circle
            key={`s${s.index}`}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            data-mc-ink={isLargest ? "accent" : color ? undefined : "point"}
            style={!isLargest && color ? { fill: color } : undefined}
          />
        );
      })}
      {maxLabel ? (
        <text
          x={maxLabel.x}
          y={maxLabel.y}
          fontSize={fontSize}
          textAnchor={maxLabel.anchor}
          data-mc-ink="accent"
        >
          {maxLabel.text}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
