// <Hypnogram> — which discrete state the system was in over time, and how choppy
// the transitions were.
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
  hypnoSpans,
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
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const CAT_N = 6; // --mc-cat-1 … --mc-cat-6 via data-mc-cat roles

/**
 * Default domain: [firstT, lastT + one median step] so the last state shows.
 *
 * An explicit `domain` survives only when it is a usable window. It reached the
 * scale unchecked before, and `span = d1 - d0 || 1` turned every unusable one
 * into a span of ONE: `[0, NaN]` painted the night ~8700 units wide in a
 * 140-unit box, `[5, 5]` painted it from −437 to 8203, and `[0, Infinity]`
 * emitted `NaN` coordinates — each time with a perfectly ordinary accessible
 * name attached. A reversed window is a typo rather than a request to run time
 * backwards, so it is swapped, the way `resolveRasterDomain` swaps one.
 */
export function resolveDomain(
  data: readonly HypnogramDatum[],
  domain?: readonly [number, number] | undefined,
): readonly [number, number] {
  if (domain) {
    const lo = Math.min(domain[0], domain[1]);
    const hi = Math.max(domain[0], domain[1]);
    // isFinite(hi - lo) rejects a span that overflows (e.g. [-1e308, 1e308]),
    // which is finite at both ends but has no finite slope.
    if (Number.isFinite(lo) && Number.isFinite(hi - lo) && hi > lo) return [lo, hi];
  }
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
  // the WINDOWED runs — the same list the strip paints, so a `domain` that
  // holds nothing announces "No data." instead of counting off-box transitions
  const spans = hypnoSpans(data, domain);
  if (spans.length === 0) return strings.noData;
  if (spans.length === 1) return strings.hypnogramFlat(spans[0]!.state);
  let longest = spans[0]!.state;
  let longestDur = -1;
  for (const s of spans) {
    const dur = s.t1 - s.t0;
    if (dur > longestDur) {
      longestDur = dur;
      longest = s.state;
    }
  }
  return strings.hypnogram(spans.length - 1, states.length, longest);
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
    labelSize,
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
    labelSize,
  });

  const domain = resolveDomain(data, domainProp);
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
  // one y per DRAWN row (geometry floors its own row count at 1, so it can be
  // one entry longer than `rowStates` when there are no states at all)
  const rowY = rowStates.map((_s, r) => geo.rowY[r] ?? round2(geo.rowHeight * (r + 0.5) + 1));

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
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {/* One path for the whole scaffold. Every row rule carries identical
          paint, so N <g>+<line> pairs were 2N nodes saying one thing; a
          many-state strip is the case this chart is FOR. The entrance is a
          whole-svg wipe with no per-mark selection, so nothing addresses these
          individually. */}
      {rowY.length > 0 ? (
        <path
          d={rowY.map((y) => `M${round2(gutter + 1)} ${y}H${width - 1}`).join("")}
          fill="none"
          stroke="var(--mc-neutral)"
          strokeOpacity={0.16}
          data-mc-w="hair"
        />
      ) : null}
      {labels
        ? rowStates.map((s, r) => (
            <text
              key={s}
              x={round2(gutter - 3)}
              y={rowY[r]}
              dominantBaseline="central"
              textAnchor="end"
              fontSize={fontSize}
              data-mc-ink="label"
            >
              {s}
            </text>
          ))
        : null}

      {mode === "lanes" ? (
        geo.runs.map((r, i) => {
          const active = emphasis ? r.state === emphasis : true;
          return (
            <rect
              key={i}
              x={r.x0}
              y={r.y + 0.4}
              // re-rounded: subtracting two 2-dp coords reintroduces float
              // noise (8.729999999999997), and every rendered number in this
              // library is 2-dp at generation
              width={round2(Math.max(0, r.x1 - r.x0))}
              height={round2(Math.max(0.5, geo.rowHeight - 0.8))}
              rx={0.5}
              shapeRendering="crispEdges"
              data-mc-ink={emphasis ? (active ? "accent" : "neutral") : undefined}
              data-mc-cat={emphasis ? undefined : (r.row % CAT_N) + 1}
              // attribute, not inline style (PartitionStrip's form): an inline
              // fill-opacity outranks every stylesheet rule, which flattened
              // the `[data-mc-cat]` LIGHTNESS ramp the forced-colors block
              // builds — six lanes reading as one CanvasText in High Contrast
              // Mode — and put the value out of a consumer's `:where()` reach.
              fillOpacity={emphasis && !active ? 0.35 : 0.9}
              style={colors && !emphasis ? { fill: colors[r.row % colors.length] } : undefined}
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
            />
          ) : null}
          <path
            d={hPath(normalRuns)}
            data-mc-ink={emphasis ? "muted" : "data"}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-mc-w="heavy"
          />
          {emphasis && emphRuns.length > 0 ? (
            <path
              d={hPath(emphRuns)}
              fill="none"
              stroke="var(--mc-accent)"
              strokeLinecap="round"
              data-mc-w="heavy"
            />
          ) : null}
        </>
      )}
      {children}
    </Chart>
  );
}
