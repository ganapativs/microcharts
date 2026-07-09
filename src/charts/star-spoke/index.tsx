// <StarSpoke> — an entity's profile across a few metrics, and which entity in a
// set is the odd one out (plan/25 §9, plan/17 F11). Static, hook-free, RSC-safe.
// Spokes only — NO contour polygon, ever (a `polygon` prop will never exist):
// the enclosed area lies about magnitude and axis order, and contour-free wins
// for outlier tasks. Faint guides are the read-back scaffold.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_STAR_SPOKE, type StarSpokeStrings } from "../../core/strings-star-spoke.js";
import { starSpokeGeometry } from "./geometry.js";

export interface StarSpokeDatum {
  label: string;
  value: number;
}

export interface StarSpokeProps {
  data: readonly StarSpokeDatum[];
  /** Endpoint dots sharpen the outlier read at larger sizes. */
  dots?: boolean | undefined;
  /** Hairline full-length guide spokes (the read-back scaffold). */
  guides?: boolean | undefined;
  /** Same-length baseline values as muted ghost spokes — profile vs baseline. */
  compare?: readonly number[] | undefined;
  /** Spoke labels at the tips (drop out below 48-unit size). */
  labels?: boolean | undefined;
  domain?: [number, number] | undefined;
  size?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: StarSpokeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the extremes of the profile (the outlier read). */
export function starSpokeSummary(
  data: readonly StarSpokeDatum[],
  strings: StarSpokeStrings,
  fmt: (n: number) => string,
): string {
  if (data.length === 0) return strings.noData;
  let hi = data[0]!;
  let lo = data[0]!;
  for (const d of data) {
    if (d.value > hi.value) hi = d;
    if (d.value < lo.value) lo = d;
  }
  return strings.starSpoke(data.length, hi.label, fmt(hi.value), lo.label, fmt(lo.value));
}

function circlesPath(pts: readonly { x: number; y: number }[], r: number): string {
  return pts
    .map(
      (p) =>
        `M${round2(p.x - r)} ${round2(p.y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`,
    )
    .join("");
}

export function StarSpoke(props: StarSpokeProps): ReactNode {
  const {
    data,
    dots = false,
    guides = true,
    compare,
    labels = false,
    domain = [0, 1],
    size = 32,
    format,
    locale,
    strings = EN_STAR_SPOKE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 0 && data.length < 3)
    devWarn("<StarSpoke> fewer than 3 metrics — use PairedBars/MiniBar for a cleaner read.");
  if (data.some((d) => d.value > domain[1] || d.value < domain[0]))
    devWarn("<StarSpoke> value outside domain — clamped.");

  const fmt = makeFormatter(format, locale);
  const showLabels = labels && size >= 48;
  // reserve a label ring when labels are shown, so tip text stays inside
  const pad = showLabels ? Math.max(10, size * 0.2) : 2;
  const geo = starSpokeGeometry({
    values: data.map((d) => d.value),
    domain,
    width: size,
    height: size,
    pad,
  });
  const cmp = compare
    ? starSpokeGeometry({
        values: compare.slice(0, data.length),
        domain,
        width: size,
        height: size,
        pad,
      })
    : null;
  const fontSize = showLabels
    ? Math.max(5, Math.min(Math.round(size * 0.1), 6))
    : Math.max(5, Math.min(Math.round(size * 0.14), 7));
  const accName = summary === false ? false : (summary ?? starSpokeSummary(data, strings, fmt));

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-star ${className}` : "mc-star"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {guides ? (
        <path
          d={geo.guidePath}
          fill="none"
          stroke="var(--mc-neutral)"
          strokeOpacity={0.22}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {cmp ? (
        <path
          d={cmp.spokePath}
          data-mc-ink="ghost"
          strokeLinecap="round"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.4)" }}
        />
      ) : null}
      <path
        d={geo.spokePath}
        data-mc-ink="data"
        fill="none"
        strokeLinecap="round"
        style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.2)" }}
      />
      {dots ? (
        <path
          d={circlesPath(
            geo.spokes.map((s) => ({ x: s.tx, y: s.ty })),
            Math.max(0.8, size * 0.045),
          )}
          style={{ fill: "var(--mc-accent)" }}
        />
      ) : null}
      {showLabels
        ? geo.spokes.map((s, i) => {
            const dx = Math.cos(s.angle);
            const anchor = dx > 0.3 ? "start" : dx < -0.3 ? "end" : "middle";
            return (
              <text
                key={data[i]!.label}
                x={round2(s.tx + dx * 1.5)}
                y={round2(s.ty + Math.sin(s.angle) * 1.5)}
                dominantBaseline="central"
                textAnchor={anchor}
                fontSize={fontSize}
                data-mc-ink="label"
              >
                {data[i]!.label}
              </text>
            );
          })
        : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
