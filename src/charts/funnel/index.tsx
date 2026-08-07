// <Funnel> — where does the pipeline leak.
// Stepped columns over the classic silhouette: the silhouette is a shape, not
// a measurement. Non-monotonic stages render
// truthfully and the summary says so.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, makeUnitFormatter, type Format } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { funnelGeometry } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { resolveSummary } from "../../core/summary.js";

export type FunnelDatum = MiniBarDatum;

/**
 * Stages + overall conversion. Resolves each stage exactly as the plot does — a
 * missing or negative stage keeps its slot at zero — so the announced stage
 * count, endpoints and inversion positions are the ones on screen. Dropping
 * those stages instead made `[-5, 10]` paint two columns and announce "1 stage,
 * 10 to 10 — overall 100%", a conversion between a stage and itself.
 */
export function funnelSummary(
  data: readonly FunnelDatum[],
  fmt: (n: number) => string,
  pctFmt: (n: number) => string,
  strings: CompositionStrings,
): string {
  // "all slots empty" is still no data; a genuine zero stage is not.
  if (!data.some((d) => isFiniteValue(d.value) && d.value >= 0)) return strings.noData;
  const values = data.map((d) => (isFiniteValue(d.value) && d.value >= 0 ? d.value : 0));
  const first = values[0]!;
  const last = values.at(-1)!;
  const overall = first > 0 ? last / first : 0;
  let out = strings.funnel(values.length, fmt(first), fmt(last), pctFmt(overall));
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > values[i - 1]!) {
      out += ` ${strings.funnelInversion(i + 1, i)}`;
    }
  }
  return out;
}

export interface FunnelProps {
  /** Ordered stages. */
  data: readonly FunnelDatum[];
  /** `"rate"` renders each stage as % of the FIRST stage. */
  mode?: "absolute" | "rate" | undefined;
  /** Connector slats between stages (off for the tightest cells). */
  connectors?: boolean | undefined;
  /** `"percent"` (share of the first stage, default) | `"value"` | `"none"`
   *  above each column (deterministic drop-out). */
  label?: "none" | "percent" | "value" | undefined;
  /** Accent one stage — "the leak". */
  highlight?: number | string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CompositionStrings | undefined;
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

export function Funnel(props: FunnelProps): ReactNode {
  const {
    data,
    mode = "absolute",
    connectors = true,
    label = "percent",
    highlight,
    width = 60,
    height = 18,
    color,
    format,
    locale,
    strings = EN_COMPOSITION,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 6) {
    devWarn(`<Funnel> ${data.length} stages — past 6 the drops blur (documented cap).`);
  }

  // The box, and the label size that fits it, are resolved once in geometry —
  // the viewBox, the seat and the marks all have to agree on them.
  const geo = funnelGeometry({
    width,
    height,
    values: data.map((d) => d.value),
    mode,
    connectors,
    label,
  });
  const { fontSize } = geo;
  const fmt = makeFormatter(format, locale);
  const pctFmt = makeUnitFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const accName = resolveSummary(summary, () => funnelSummary(data, fmt, pctFmt, strings));

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle =
    fontSize > 0 ? { ...style, "--mc-label-px": `${fontSize}px` } : (style as CSSProperties);
  const slatPath = geo.slats.map((s) => s.d).join("");

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // Stage columns are zero-anchored and every one ends at the box floor,
      // slats included; the label gutter geometry reserves is at the TOP, so
      // nothing eats into the floor and the columns sit on the baseline.
      seat={{ mode: "floor", bottom: geo.height }}
      className={className ? `mc-funnel ${className}` : "mc-funnel"}
      style={rootStyle}
    >
      {/* One path, not n−1. The slats carry identical paint, sit under every
          other mark and are excluded from the entrance (which selects the
          column rects), so nothing needs them addressable — same idiom as the
          Waterfall's connectors. */}
      {slatPath ? <path d={slatPath} data-mc-ink="band" /> : null}
      {geo.stages.map((st) => {
        const d = data[st.index]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === st.index);
        // A stage with no data has no share to report: it drops its label rather
        // than painting a fabricated "0%" over an empty slot — the same rule the
        // `value` labels and the interactive readout ("Trials —") already follow.
        const text = !isFiniteValue(d.value)
          ? undefined
          : label === "percent"
            ? pctFmt(st.share)
            : label === "value"
              ? fmt(d.value)
              : undefined;
        return (
          <g key={st.index}>
            {st.h > 0 ? (
              <rect
                x={st.x}
                y={st.y}
                width={st.w}
                height={st.h}
                shapeRendering="crispEdges"
                data-mc-ink={isHl ? "accent" : "bar"}
                style={!isHl && color ? { fill: color } : undefined}
              />
            ) : null}
            {text !== undefined && geo.labelsFit(text.length) ? (
              <text
                x={round2(st.x + st.w / 2)}
                y={round2(fontSize * 0.9)}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {text}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}
