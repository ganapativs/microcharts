// <EtaBar> — how long is this actually going to take, given how it has actually
// been going. Static, hook-free, RSC-safe. The bar's
// x-axis is TIME: solid = elapsed share of the predicted total, the muted
// remainder is sized by the observed rate — the download bar, told truthfully.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, textGutter } from "../../core/labels.js";
import { EN_ETA_BAR, type EtaBarStrings } from "../../core/strings-eta-bar.js";
import { etaBarGeometry, hatchPath } from "./geometry.js";

export interface EtaBarProps {
  /** Completed fraction 0–1. */
  progress: number;
  /** Time spent, any consistent unit. */
  elapsed: number;
  /** Progress-per-time-unit; pass a recent-window rate for the honest forecast. */
  rate?: number | undefined;
  /** `"eta"` (the product) · `"percent"` · `"none"`. */
  label?: "eta" | "percent" | "none" | undefined;
  /** Unit-bearing ETA label ("2 min") — the caller owns units. */
  etaFormat?: ((t: number) => string) | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: EtaBarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the remainder is always hedged with "at the current rate". */
export function etaBarSummary(
  opts: {
    progress: number;
    elapsed: number;
    rate: number | null;
    etaFormat?: ((t: number) => string) | undefined;
    fmt: (n: number) => string;
  },
  strings: EtaBarStrings,
): string {
  const geo = etaBarGeometry({ ...opts, width: 80, height: 8 });
  const pct = `${Math.round(Math.max(0, Math.min(1, opts.progress || 0)) * 100)}%`;
  if (opts.progress >= 1) return strings.etaBarDone;
  if (geo.indeterminate || geo.remainingTime == null) return strings.etaBarStalled(pct);
  const rem = opts.etaFormat ? opts.etaFormat(geo.remainingTime) : opts.fmt(geo.remainingTime);
  return strings.etaBar(pct, rem);
}

export function EtaBar(props: EtaBarProps): ReactNode {
  const {
    progress,
    elapsed,
    rate,
    label = "eta",
    etaFormat,
    width = 80,
    height = 8,
    format,
    locale,
    strings = EN_ETA_BAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const fontSize = labelFont(height, 0.62);

  // preliminary geometry to know remaining time for the label
  const pre = etaBarGeometry({ progress, elapsed, rate: rate ?? null, width, height });
  const etaText =
    label === "none" || height < 9
      ? undefined
      : label === "percent"
        ? `${Math.round(p * 100)}%`
        : pre.indeterminate || pre.remainingTime == null
          ? undefined
          : etaFormat
            ? etaFormat(pre.remainingTime)
            : fmt(pre.remainingTime);

  const gutter = etaText ? Math.min(width * 0.5, textGutter(etaText.length, fontSize, 4)) : 0;
  const barWidth = width - gutter;
  const geo = etaBarGeometry({ progress, elapsed, rate: rate ?? null, width: barWidth, height });

  const accName =
    summary === false
      ? false
      : (summary ??
        etaBarSummary({ progress, elapsed, rate: rate ?? null, etaFormat, fmt }, strings));

  const dividerX = geo.done.x + geo.done.width;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The bar's axis is time, running left to right — nothing rises off a
      // bottom edge — so the track band centres on the cap band. The band is the
      // inset rect every branch of the geometry shares; the ETA numeral sits in a
      // gutter beside it, which never moves the mark off the line.
      seat={{ mode: "center", top: geo.done.y, bottom: geo.done.y + geo.done.height }}
      className={className ? `mc-eta ${className}` : "mc-eta"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <rect
        x={geo.done.x}
        y={geo.done.y}
        width={Math.max(0, barWidth - 2)}
        height={geo.done.height}
        rx={geo.done.height / 2}
        style={{ fill: "var(--mc-neutral)", fillOpacity: 0.14 }}
      />
      <rect
        x={geo.done.x}
        y={geo.done.y}
        width={geo.done.width}
        height={geo.done.height}
        rx={geo.done.height / 2}
        data-mc-ink="accent"
      />
      {geo.indeterminate && geo.remaining ? (
        <path
          d={hatchPath(geo.remaining)}
          stroke="var(--mc-neutral)"
          strokeOpacity={0.5}
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.remaining ? (
        <line
          x1={dividerX}
          x2={dividerX}
          y1={geo.done.y - 0.5}
          y2={geo.done.y + geo.done.height + 0.5}
          stroke="var(--mc-stroke)"
          data-mc-w="tick"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.overflow ? (
        <path
          d={`M${round2(barWidth - 3)} ${round2(geo.done.y + 1)}L${round2(barWidth - 1)} ${round2(height / 2)}L${round2(barWidth - 3)} ${round2(geo.done.y + geo.done.height - 1)}`}
          fill="none"
          stroke="var(--mc-neutral)"
          data-mc-w="tick"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {etaText ? (
        <text
          x={width}
          y={height / 2}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {etaText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
