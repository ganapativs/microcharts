// <VolumeProfile> — at which LEVEL did activity concentrate, not when (plan/25
// §16, plan/17 F15). Static, hook-free, RSC-safe. A histogram perpendicular to
// the trend axis: y = level, bars extend horizontally by activity mass. The
// modal bin (POC) is accented and the value area is shaded — a stated 70%
// convention, never an implied confidence interval.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_VOLUME_PROFILE, type VolumeProfileStrings } from "../../core/strings-volume-profile.js";
import { volumeProfileGeometry, type LevelRow } from "./geometry.js";

export type VolumeProfileDatum = LevelRow | number;

export interface VolumeProfileProps {
  data: readonly VolumeProfileDatum[];
  /** Mass fraction defining the shaded value-area span. */
  valueArea?: number | undefined;
  /** Which way bars grow — pairs with a trend chart on the opposite side. */
  side?: "left" | "right" | undefined;
  /** The POC level, anchored beside the accent bar. */
  label?: "poc" | "none" | undefined;
  bins?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: VolumeProfileStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — where activity concentrates + the value-area span. */
export function volumeProfileSummary(
  geo: ReturnType<typeof volumeProfileGeometry>,
  valueArea: number,
  strings: VolumeProfileStrings,
  fmt: (n: number) => string,
): string {
  if (!geo.poc) return strings.noData;
  if (geo.even) return strings.volumeEven;
  return strings.volumeProfile(
    fmt(geo.poc.level),
    `${Math.round(valueArea * 100)}%`,
    fmt(geo.vaLo),
    fmt(geo.vaHi),
  );
}

export function VolumeProfile(props: VolumeProfileProps): ReactNode {
  const {
    data,
    valueArea = 0.7,
    side = "left",
    label = "poc",
    bins = 12,
    width = 48,
    height = 32,
    format,
    locale,
    strings = EN_VOLUME_PROFILE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.2), 7));
  // preliminary pass to size the POC-label gutter
  const pre = volumeProfileGeometry({ data, bins, valueArea, side, width, height, gutter: 0 });
  const pocText = label === "poc" && pre.poc ? fmt(pre.poc.level) : undefined;
  const gutter = pocText ? pocText.length * fontSize * 0.6 + 2 : 0;

  const geo = volumeProfileGeometry({ data, bins, valueArea, side, width, height, gutter });
  const accName =
    summary === false ? false : (summary ?? volumeProfileSummary(geo, valueArea, strings, fmt));

  const normal = geo.bars.filter((b) => !b.poc);
  const pocBar = geo.bars.find((b) => b.poc);
  const anchorLeft = side === "left";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-volprofile ${className}` : "mc-volprofile"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* value area band */}
      {geo.valueAreaRect ? (
        <rect
          x={geo.valueAreaRect.x}
          y={geo.valueAreaRect.y}
          width={geo.valueAreaRect.width}
          height={geo.valueAreaRect.height}
          data-mc-ink="band"
          style={{ fill: "var(--mc-accent)", fillOpacity: 0.1 }}
        />
      ) : null}
      {/* bars (one path) */}
      {normal.length > 0 ? (
        <path
          d={normal.map((b) => `M${b.x} ${b.y}h${b.width}v${b.height}h${-b.width}z`).join("")}
          data-mc-ink="bar"
        />
      ) : null}
      {/* POC bar accented */}
      {pocBar ? (
        <path
          d={`M${pocBar.x} ${pocBar.y}h${pocBar.width}v${pocBar.height}h${-pocBar.width}z`}
          style={{ fill: "var(--mc-accent)" }}
        />
      ) : null}
      {pocText && pocBar ? (
        <text
          x={
            anchorLeft
              ? Math.min(width - 0.5, pocBar.x + pocBar.width + 1)
              : Math.max(0.5, pocBar.x - 1)
          }
          y={round2(pocBar.y + pocBar.height / 2)}
          dominantBaseline="central"
          textAnchor={anchorLeft ? "start" : "end"}
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {pocText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
