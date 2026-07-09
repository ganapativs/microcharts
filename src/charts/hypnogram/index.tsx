// <Hypnogram> — which discrete state the system was in over time, and how choppy
// the transitions were (plan/25 §2, plan/17 F8). Static, hook-free, RSC-safe.
// A categorical step strip that REFUSES interpolation: no diagonals, no curves,
// ever — a state is a fact, not a sample of a continuum (the anti-line-chart).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { round2 } from "../../core/types.js";
import { labelFont } from "../../core/labels.js";
import { EN_HYPNOGRAM, type HypnogramStrings } from "../../core/strings-hypnogram.js";
import { firstAppearance, hypnogramGeometry, mergeRuns, type HypnoEntry } from "./geometry.js";

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
   *  (plan/21 §3 names this `style`; React reserves that for CSS — logged.) */
  variant?: "steps" | "lanes" | undefined;
  /** Time extent; the last state holds to `domain[1]`. */
  domain?: [number, number] | undefined;
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

const CAT_TOKENS = [
  "--mc-cat-1",
  "--mc-cat-2",
  "--mc-cat-3",
  "--mc-cat-4",
  "--mc-cat-5",
  "--mc-cat-6",
];

/** Default domain: [firstT, lastT + one median step] so the last state shows. */
export function resolveDomain(data: readonly HypnogramDatum[]): [number, number] {
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
  domain: [number, number],
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
    variant = "steps",
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
  const labels = labelsProp ?? width >= 96;
  const fontSize = labelFont(height / rowsN, 0.62);
  const gutter = labels
    ? Math.min(width * 0.4, Math.max(...rowStates.map((s) => s.length), 1) * fontSize * 0.6 + 4)
    : 0;

  const domain = domainProp ?? resolveDomain(data);
  const geo = hypnogramGeometry({
    data,
    states: rowStates,
    domain,
    width,
    height,
    style: variant,
    gutter,
  });
  const accName =
    summary === false ? false : (summary ?? hypnogramSummary(data, rowStates, domain, strings));

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
      className={className ? `mc-hypno ${className}` : "mc-hypno"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* faint row guides + state names — a read-back scaffold, quieter than the data */}
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
              strokeWidth={0.5}
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

      {variant === "lanes" ? (
        geo.runs.map((r, i) => {
          const active = emphasis ? r.state === emphasis : true;
          const fill = emphasis
            ? active
              ? "var(--mc-accent)"
              : "var(--mc-neutral)"
            : `var(${CAT_TOKENS[r.row % CAT_TOKENS.length]})`;
          return (
            <rect
              key={i}
              x={r.x0}
              y={r.y + 0.4}
              width={Math.max(0, r.x1 - r.x0)}
              height={Math.max(0.5, geo.rowHeight - 0.8)}
              rx={0.5}
              shapeRendering="crispEdges"
              style={{ fill, fillOpacity: emphasis && !active ? 0.35 : 0.9 }}
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
              strokeWidth={0.75}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={hPath(normalRuns)}
            data-mc-ink={emphasis ? "muted" : "data"}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.35)" }}
          />
          {emphasis && emphRuns.length > 0 ? (
            <path
              d={hPath(emphRuns)}
              fill="none"
              stroke="var(--mc-accent)"
              strokeLinecap="round"
              style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.4)" }}
            />
          ) : null}
        </>
      )}
      {children}
    </Chart>
  );
}
