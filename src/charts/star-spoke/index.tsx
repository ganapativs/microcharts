// <StarSpoke> — an entity's profile across a few metrics, and which entity in a
// set is the odd one out. Static, hook-free, RSC-safe.
// Spokes only — NO contour polygon, ever (a `polygon` prop will never exist):
// the enclosed area lies about magnitude and axis order, and contour-free wins
// for outlier tasks. Faint guides are the read-back scaffold.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter } from "../../core/format.js";
import { EN_STAR_SPOKE, type StarSpokeStrings } from "../../core/strings-star-spoke.js";
import { starSpokeGeometry } from "./geometry.js";

export interface StarSpokeDatum {
  label: string;
  value: number;
}

export interface StarSpokeProps {
  data: readonly StarSpokeDatum[];
  /** `"tips"` draws endpoint dots to sharpen the outlier read at larger sizes; `"none"` (default) omits them. */
  dots?: "tips" | "none" | undefined;
  /** Hairline full-length guide spokes (the read-back scaffold). */
  guides?: boolean | undefined;
  /** Same-length baseline values as muted ghost spokes — profile vs baseline. */
  compare?: readonly number[] | undefined;
  /** Spoke labels at the tips (drop out below 48-unit size). */
  labels?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
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
    dots = "none",
    guides = true,
    compare,
    labels = true,
    domain = [0, 1],
    size = 80,
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

  const showLabels = labels && size >= 44;
  const fontSize = showLabels ? labelFont(size, 0.1) : labelFont(size, 0.14);
  // reserve a label ring when labels are shown, so tip text stays inside
  const pad = showLabels ? Math.max(fontSize * 2, size * 0.22) : 2;
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
  // fmt (an Intl.NumberFormat lookup) is only needed for the auto summary — skip
  // it entirely when summary is explicitly off (SSR hot path: bench).
  const accName =
    summary === false
      ? false
      : (summary ?? starSpokeSummary(data, strings, makeFormatter(format, locale)));

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
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.22}
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
      {dots === "tips" ? (
        <path
          d={circlesPath(
            geo.spokes.map((s) => ({ x: s.tx, y: s.ty })),
            Math.max(0.8, size * 0.045),
          )}
          data-mc-ink="point"
          style={{ fill: "var(--mc-accent)" }}
        />
      ) : null}
      {showLabels
        ? geo.spokes.flatMap((s, i) => {
            const label = data[i]!.label;
            const dx = Math.cos(s.angle);
            const dy = Math.sin(s.angle);
            const anchor = dx > 0.3 ? "start" : dx < -0.3 ? "end" : "middle";
            const est = 0.62 * fontSize * label.length;
            // Seat at the RIM (fixed radius), not the value tip — otherwise a
            // low-value spoke pulls its label into the hub and labels collide.
            const naturalX = s.rx + dx * (fontSize * 0.5);
            // Drop only a label too wide for the whole chart; otherwise CLAMP it
            // into the reserved ring. Rim labels sit at distinct angles, so
            // clamping toward an edge keeps them apart rather than dropping them —
            // identity still comes from the fixed clock order + guides.
            if (est > size - 2) return [];
            // Keep the text box inside the viewBox for its anchor side.
            const minX = anchor === "start" ? 0.5 : anchor === "end" ? est + 0.5 : est / 2 + 0.5;
            const maxX =
              anchor === "start"
                ? size - est - 0.5
                : anchor === "end"
                  ? size - 0.5
                  : size - est / 2 - 0.5;
            const x = Math.max(minX, Math.min(maxX, naturalX));
            const y = Math.max(
              fontSize * 0.6,
              Math.min(size - fontSize * 0.4, s.ry + dy * (fontSize * 0.5)),
            );
            return [
              <text
                key={label}
                x={round2(x)}
                y={round2(y)}
                dominantBaseline="central"
                textAnchor={anchor}
                fontSize={fontSize}
                data-mc-ink="label"
              >
                {label}
              </text>,
            ];
          })
        : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
