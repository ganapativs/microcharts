// <Hypnogram> — which discrete state the system was in over time, and how choppy
// the transitions were. Static, hook-free, RSC-safe.
// A categorical step strip that REFUSES interpolation: no diagonals, no curves,
// ever — a state is a fact, not a sample of a continuum (the anti-line-chart).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { round2 } from "../../core/types.js";
import { EN_HYPNOGRAM, type HypnogramStrings } from "../../core/strings-hypnogram.js";
import {
  firstAppearance,
  hypnogramGeometry,
  hypnogramLabels,
  mergeRuns,
  type HypnoEntry,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { maxOf } from "../../core/scale.js";

export type HypnogramDatum = HypnoEntry;

export interface HypnogramProps {
  data: readonly HypnogramDatum[];
  /** Row order top→bottom; ordinal semantics live here. Default first-appearance. */
  states?: readonly string[] | undefined;
  /** Accents one state (e.g. Deep, or "incident") — the decision read. */
  emphasis?: string | undefined;
  /** Vertical transition strokes; off for ultra-dense strips. */
  connectors?: boolean | undefined;
  /** Left-gutter state names (default: on when width ≥ 96). */
  labels?: boolean | undefined;
  /** `"lanes"` renders nominal states as filled blocks — no implied rank.
   * */
  mode?: "steps" | "lanes" | undefined;
  /** Per-state lane colours (`"lanes"` mode), cycled; overrides `--mc-cat-N`. */
  colors?: readonly string[] | undefined;
  /** Time extent; the last state holds to `domain[1]`. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  strings?: HypnogramStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const CAT_N = 6; // --mc-cat-1 … --mc-cat-6 via data-mc-cat roles

/** Default domain: [firstT, lastT + one median step] so the last state shows. */
export function resolveDomain(data: readonly HypnogramDatum[]): readonly [number, number] {
  const ts = data
    .map((d) => d.t)
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (ts.length === 0) return [0, 1];
  if (ts.length === 1) return [ts[0]!, ts[0]! + 1];
  const gaps: number[] = [];
  for (let i = 1; i < ts.length; i++) gaps.push(ts[i]! - ts[i - 1]!);
  gaps.sort((a, b) => a - b);
  const step = gaps[Math.floor(gaps.length / 2)] || 1;
  return [ts[0]!, ts[ts.length - 1]! + step];
}

/** Shared summary — transitions, state count, the longest run. */
export function hypnogramSummary(
  data: readonly HypnogramDatum[],
  states: readonly string[],
  domain: readonly [number, number],
  strings: HypnogramStrings,
): string {
  const merged = mergeRuns(data, domain[1]);
  if (merged.length === 0) return strings.noData;
  if (merged.length === 1) return strings.hypnogramFlat(merged[0]!.state);
  let longest = merged[0]!.state;
  let longestDur = -1;
  merged.forEach((e, i) => {
    const end = i + 1 < merged.length ? merged[i + 1]!.t : domain[1];
    const dur = end - e.t;
    if (dur > longestDur) {
      longestDur = dur;
      longest = e.state;
    }
  });
  return strings.hypnogram(merged.length - 1, states.length, longest);
}

export function Hypnogram(props: HypnogramProps): ReactNode {
  const {
    data,
    states: statesProp,
    emphasis,
    connectors = true,
    mode = "steps",
    colors,
    labels: labelsProp,
    domain: domainProp,
    width = 140,
    height: heightProp,
    strings = EN_HYPNOGRAM,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const appearance = firstAppearance(data);
  const states = statesProp ?? appearance;
  // states referenced in data but missing from an explicit order → appended
  const extra = statesProp ? appearance.filter((s) => !statesProp.includes(s)) : [];
  if (extra.length > 0)
    devWarn(`<Hypnogram> states not in \`states\`: ${extra.join(", ")} (appended).`);
  const rowStates = [...states, ...extra];

  const rowsN = Math.max(1, rowStates.length);
  // one legible row per state — the strip grows with the state count, never crushes
  const height = heightProp ?? Math.max(36, rowsN * 13);
  // Row names are seat-gated: they drop (and hand their gutter back to the runs)
  // once the row pitch is under one em or the widest name outgrows its share of
  // the width — see `hypnogramLabels`, the one place both entries derive this.
  const {
    show: labels,
    gutter,
    fontSize,
  } = hypnogramLabels({
    labels: labelsProp ?? width >= 96,
    width,
    height,
    rows: rowsN,
    maxChars: maxOf(
      rowStates.map((s) => s.length),
      1,
    ),
  });

  const domain = domainProp ?? resolveDomain(data);
  const geo = hypnogramGeometry({
    data,
    states: rowStates,
    domain,
    width,
    height,
    style: mode,
    gutter,
  });
  const accName = resolveSummary(summary, () => hypnogramSummary(data, rowStates, domain, strings));

  const normalRuns = geo.runs.filter((r) => r.state !== emphasis);
  const emphRuns = emphasis ? geo.runs.filter((r) => r.state === emphasis) : [];
  const hPath = (rs: typeof geo.runs) => rs.map((r) => `M${r.x0} ${r.y}H${r.x1}`).join("");

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Rows are states, so the lowest row is a category, never a zero — the
      // stack centres on the cap band. `labels` opens a LEFT gutter only, so the
      // vertical box holds whether or not the state names are drawn.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-hypno ${className}` : "mc-hypno"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {rowStates.map((s, r) => {
        const y = geo.rowY[r] ?? geo.rowHeight * (r + 0.5) + 1;
        return (
          <g key={s}>
            <line
              x1={round2(gutter + 1)}
              x2={width - 1}
              y1={y}
              y2={y}
              stroke="var(--mc-neutral)"
              strokeOpacity={0.16}
              data-mc-w="hair"
              vectorEffect="non-scaling-stroke"
            />
            {labels ? (
              <text
                x={round2(gutter - 3)}
                y={y}
                dominantBaseline="central"
                textAnchor="end"
                fontSize={fontSize}
                data-mc-ink="label"
              >
                {s}
              </text>
            ) : null}
          </g>
        );
      })}

      {mode === "lanes" ? (
        geo.runs.map((r, i) => {
          const active = emphasis ? r.state === emphasis : true;
          return (
            <rect
              key={i}
              x={r.x0}
              y={r.y + 0.4}
              width={Math.max(0, r.x1 - r.x0)}
              height={Math.max(0.5, geo.rowHeight - 0.8)}
              rx={0.5}
              shapeRendering="crispEdges"
              data-mc-ink={emphasis ? (active ? "accent" : "neutral") : undefined}
              data-mc-cat={emphasis ? undefined : (r.row % CAT_N) + 1}
              style={{
                fillOpacity: emphasis && !active ? 0.35 : 0.9,
                ...(colors && !emphasis ? { fill: colors[r.row % colors.length] } : null),
              }}
            />
          );
        })
      ) : (
        <>
          {connectors && geo.connectors ? (
            <path
              d={geo.connectors}
              fill="none"
              stroke="var(--mc-neutral)"
              strokeOpacity={0.5}
              data-mc-w="tick"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={hPath(normalRuns)}
            data-mc-ink={emphasis ? "muted" : "data"}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: "calc(var(--mc-sw) * 1.35)" }}
          />
          {emphasis && emphRuns.length > 0 ? (
            <path
              d={hPath(emphRuns)}
              fill="none"
              stroke="var(--mc-accent)"
              strokeLinecap="round"
              style={{ strokeWidth: "calc(var(--mc-sw) * 1.4)" }}
            />
          ) : null}
        </>
      )}
      {children}
    </Chart>
  );
}
