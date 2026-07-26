// <EnsembleGhosts> — what could happen, across the simulated futures? A faint
// bundle of member paths + one emphasised representative, because a mean line
// hides that futures disagree in SHAPE, not just endpoint. Ghost
// selection + emphasis are DETERMINISTIC (endpoint-rank quantiles) — nothing
// varies between renders of the same data. A static frame is NOT a HOP (the loop
// lives only in the interactive entry).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { EN_ENSEMBLE, type EnsembleStrings } from "../../core/strings-ensemble.js";
import { ensembleEndLabel, ensembleGeometry, PAD, type EnsembleGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { labelFont, labelFitsY } from "../../core/labels.js";

export function ensembleSummary(
  geo: EnsembleGeometry,
  fmt: (v: number) => string,
  strings: EnsembleStrings,
): string {
  if (geo.memberCount === 1) return strings.ensembleSingle(fmt(geo.typicalEnd));
  return strings.ensemble(
    geo.memberCount,
    fmt(geo.spread.lastLo),
    fmt(geo.spread.lastHi),
    fmt(geo.typicalEnd),
  );
}

export interface EnsembleGhostsProps {
  /** Ensemble members (2–50 simulated paths). */
  data: readonly (readonly number[])[];
  /** Rendered member count (deterministic endpoint-rank selection). Default 8, cap 12. */
  ghosts?: number | undefined;
  /** `"nearest-median"` (a real member), `"median"` (synthetic), or a pinned member index. */
  emphasis?: "nearest-median" | "median" | number | undefined;
  /** Ghost endpoint dots — makes the final-value spread countable. */
  endpoints?: boolean | undefined;
  /** `"end"` (default) states the emphasised path's endpoint in a right gutter. */
  label?: "end" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: EnsembleStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function EnsembleGhosts(props: EnsembleGhostsProps): ReactNode {
  const {
    data,
    ghosts = 8,
    emphasis = "nearest-median",
    endpoints = false,
    label = "end",
    domain,
    format,
    locale,
    width = 80,
    height = 20,
    color,
    strings = EN_ENSEMBLE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((m) => m.some((v) => !Number.isFinite(v))))
    devWarn(
      "EnsembleGhosts: members with non-finite values are excluded from selection and median.",
    );

  const cls = className ? `mc-ensemble-ghosts ${className}` : "mc-ensemble-ghosts";
  const geo = ensembleGeometry({ width, height, data, ghosts, emphasis, domain });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "floor", bottom: height - PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const fmt = makeFormatter(format, locale);
  const FONT = label === "end" ? labelFont(height) : 0;
  const showLabel = FONT > 0 && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(geo.landing.value) : "";
  const box = ensembleEndLabel(width, height, geo.landing.y, labelText, FONT);

  const accName = resolveSummary(summary, () => ensembleSummary(geo, fmt, strings));
  const accent = color ?? "var(--mc-accent)";
  const rootStyle = showLabel
    ? ({ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties)
    : style;

  const ann = children
    ? resolveAnnotations(children, {
        x: (i) => geo.xFor(Math.round(i)),
        y: geo.yFor,
        width,
        height,
        fontSize: annotationFontSize(height),
      })
    : { under: null, over: null, rest: null };

  return (
    <Chart
      width={box.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      seat={{ mode: "floor", bottom: height - PAD }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {geo.ghostPaths.map((g) => (
        <path
          key={g.member}
          d={g.d}
          data-mc-ink="ghost"
          fill="none"
          stroke="var(--mc-neutral)"
          strokeOpacity={0.34}
          data-mc-w="hair"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {endpoints
        ? geo.ghostEnds.map((e) => (
            <circle
              key={`${e.x},${e.y}`}
              cx={e.x}
              cy={e.y}
              r={0.9}
              data-mc-ink="ghost"
              style={{ fill: "var(--mc-neutral)", fillOpacity: 0.5 }}
            />
          ))
        : null}
      <path
        d={geo.emphasisPath.d}
        data-mc-ink="data"
        fill="none"
        style={{ stroke: accent, strokeWidth: "var(--mc-sw)" }}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {showLabel ? (
        <text
          x={box.labelX}
          y={box.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
