// <Funnel> — where does the pipeline leak.
// Stepped columns over the classic silhouette: the silhouette is a shape, not
// a measurement. Static, hook-free, RSC-safe. Non-monotonic stages render
// truthfully and the summary says so.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { funnelGeometry } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { resolveSummary } from "../../core/summary.js";

export type FunnelDatum = MiniBarDatum;

/** Factual funnel summary — stages + overall conversion (+ inversion notes). */
export function funnelSummary(
  data: readonly FunnelDatum[],
  fmt: (n: number) => string,
  pctFmt: (n: number) => string,
  strings: CompositionStrings,
): string {
  const finite = data.filter((d) => isFiniteValue(d.value) && d.value >= 0) as {
    label: string;
    value: number;
  }[];
  if (finite.length === 0) return strings.noData;
  const first = finite[0]!.value;
  const last = finite.at(-1)!.value;
  const overall = first > 0 ? last / first : 0;
  let out = strings.funnel(finite.length, fmt(first), fmt(last), pctFmt(overall));
  for (let i = 1; i < finite.length; i++) {
    if (finite[i]!.value > finite[i - 1]!.value) {
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
  /** `"percent"` | `"value"` above each column (deterministic drop-out). */
  label?: "none" | "percent" | "value" | undefined;
  /** Accent one stage — "the leak". */
  highlight?: number | string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CompositionStrings | undefined;
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
    label = "none",
    highlight,
    width = 60,
    height = 18,
    color,
    format,
    locale,
    strings = EN_COMPOSITION,
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

  const fontSize = label === "none" ? 0 : 5;
  const geo = funnelGeometry({
    width,
    height,
    values: data.map((d) => d.value),
    mode,
    connectors,
    fontSize,
  });
  const fmt = makeFormatter(format, locale);
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 });
  const accName = resolveSummary(summary, () => funnelSummary(data, fmt, pctFmt, strings));

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle =
    fontSize > 0 ? { ...style, "--mc-label-size": `${fontSize}px` } : (style as CSSProperties);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-funnel ${className}` : "mc-funnel"}
      style={rootStyle}
    >
      {geo.slats.map((s, i) => (s.d ? <path key={`s${i}`} d={s.d} data-mc-ink="band" /> : null))}
      {geo.stages.map((st) => {
        const d = data[st.index]!;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === st.index);
        const text =
          label === "percent"
            ? pctFmt(st.share)
            : label === "value" && isFiniteValue(d.value)
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
                x={st.x + st.w / 2}
                y={fontSize * 0.9}
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
