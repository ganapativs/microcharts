// <MicroDonut> — roughly what is this made of, at icon size.
// An honest, capped concession to a ubiquitous demand: the docs' first
// paragraph steers to SegmentedBar for any comparative read. Wedge cap +
// labeled rollup are non-optional; never explode, tilt, or shadow. Static,
// hook-free, RSC-safe. `decorative` marks it as redundant ornament for an
// adjacent printed value (aria-hidden) — the only sanctioned decorative use.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { rollup } from "../segmented-bar/geometry.js";
import { sharesSummary, type SegmentedBarDatum } from "../segmented-bar/index.js";
import { microDonutGeometry } from "./geometry.js";

export type MicroDonutDatum = SegmentedBarDatum;

export interface MicroDonutProps {
  data: readonly MicroDonutDatum[];
  /** Rollup threshold (same mechanism as SegmentedBar). */
  maxWedges?: number | undefined;
  /** Redundant ornament beside a printed value → aria-hidden. */
  decorative?: boolean | undefined;
  /** Annulus thickness (shared with ProgressRing). */
  weight?: number | undefined;
  /** Center total readout when the hole has room. */
  label?: "none" | "total" | undefined;
  /** Per-wedge colours, cycled; overrides `--mc-cat-N`. "Other" stays neutral. */
  colors?: readonly string[] | undefined;
  size?: number | undefined;
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

const CAT_N = 4; // --mc-cat-1 … --mc-cat-4 via data-mc-cat roles

export function MicroDonut(props: MicroDonutProps): ReactNode {
  const {
    data,
    maxWedges = 4,
    decorative = false,
    weight = 5,
    label = "none",
    colors,
    size = 24,
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

  if (data.some((d) => isFiniteValue(d.value) && d.value < 0)) {
    devWarn("<MicroDonut> negative values excluded — a composition cannot contain negative parts.");
  }

  const rolled = rollup(data, maxWedges, strings.otherLabel);
  const geo = microDonutGeometry({
    size,
    shares: rolled.map((d) => d.value),
    weight,
  });
  const total = rolled.reduce((s, d) => s + (isFiniteValue(d.value) ? d.value : 0), 0);
  const fontSize = label === "total" ? labelFont(size, 0.28) : 0;
  const totalText =
    label === "total" && Number.isFinite(total) ? makeFormatter(format, locale)(total) : undefined;
  const showLabel = !decorative && totalText !== undefined && labelFitsY(size / 2, fontSize, size);
  const accName =
    decorative || summary === false ? false : (summary ?? sharesSummary(rolled, strings));
  const rootStyle = showLabel
    ? ({ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties)
    : style;

  return (
    <Chart
      width={size}
      height={size}
      title={decorative ? undefined : title}
      summary={accName}
      id={id}
      // A ring has no floor — the wheel reads as a piece of punctuation, so it
      // centres on the cap band. The box is the outer radius (geometry), not the
      // viewBox: the half-unit inset would otherwise seat it a touch low.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-donut ${className}` : "mc-donut"}
      style={rootStyle}
    >
      {geo.wedges.map((w, i) => {
        const d = rolled[w.index]!;
        // Stroked centerline band (see geometry): color rides an inline stroke
        // token — the rolled-up "other" wedge is neutral, the rest categorical.
        const stroke =
          d.members > 1
            ? "var(--mc-neutral)"
            : colors
              ? colors[i % colors.length]
              : `var(--mc-cat-${(i % CAT_N) + 1})`;
        return (
          <path
            key={w.index}
            className="mc-donut-wedge"
            d={w.d}
            fill="none"
            strokeLinecap="butt"
            style={{ strokeWidth: geo.weight, stroke }}
          />
        );
      })}
      {showLabel ? (
        <text
          x={size / 2}
          y={size / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="middle"
          data-mc-ink="label"
        >
          {totalText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
