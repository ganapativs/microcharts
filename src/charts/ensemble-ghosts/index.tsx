// <EnsembleGhosts> — what could happen, across the simulated futures? A faint
// bundle of member paths + one emphasised representative, because a mean line
// hides that futures disagree in SHAPE, not just endpoint. Ghost
// selection + emphasis are DETERMINISTIC (endpoint-rank quantiles) — nothing
// varies between renders of the same data. A static frame is NOT a HOP (the loop
// lives only in the interactive entry). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { EN_ENSEMBLE, type EnsembleStrings } from "../../core/strings-ensemble.js";
import { ensembleGeometry, PAD, type EnsembleGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Factual ensemble summary. Shared with the interactive entry. */
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

  const fmt = makeFormatter(format, locale);
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
        // Empty stands on the same padded floor a drawn bundle would.
        seat={{ mode: "floor", bottom: height - PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => ensembleSummary(geo, fmt, strings));
  const accent = color ?? "var(--mc-accent)";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A bundle of traces over one fitted domain takes the seat a single
      // sparkline takes — it stands on the plot's padded floor. The bundle's
      // own extent is data and changes shape run to run; the frame does not.
      seat={{ mode: "floor", bottom: height - PAD }}
      className={cls}
      style={style}
    >
      {/* the faint member bundle — the spread of possible futures */}
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
      {/* optional endpoint dots — the final-value spread, countable */}
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
      {/* the emphasised representative — accent, on top */}
      <path
        d={geo.emphasisPath.d}
        data-mc-ink="data"
        fill="none"
        style={{ stroke: accent, strokeWidth: "var(--mc-stroke-width)" }}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </Chart>
  );
}
