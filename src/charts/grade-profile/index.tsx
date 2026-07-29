// <GradeProfile> — how hard is the route, and where. One baseline-anchored quad per segment, coloured by a
// QUANTIZED grade bin (gentle → brutal); the elevation ridge rides on top and a
// seat-gated summit tick calls out the steepest pitch. Descents are always the
// gentlest bin — climbing difficulty is the decision.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { clamp } from "../../core/scale.js";
import { textGutter } from "../../core/labels.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { round2 } from "../../core/types.js";
import { EN_GRADE_PROFILE, type GradeProfileStrings } from "../../core/strings-grade-profile.js";
import { DEFAULT_BINS, gradeLayout, gradeProfileGeometry, type GradePoint } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type { GradePoint } from "./geometry.js";

export interface GradeProfileProps {
  data: readonly GradePoint[];
  /** Grade % thresholds (ascending) that quantize the four bins. Non-finite or
   *  out-of-order thresholds fall back to the defaults `[3, 6, 10]`. */
  bins?: readonly [number, number, number] | undefined;
  /** `"max"` marks the steepest pitch; `"none"` renders the profile alone. */
  label?: "max" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** Formats distance in the summary; grade % always uses `%`. */
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: GradeProfileStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Percent formatter for grades — intrinsic units, so it ignores `format`.
 *  Takes a grade in PERCENTAGE POINTS (16 → "16%"), which is how geometry
 *  reports it, and routes it through `Intl`'s own percent style: the old
 *  `${nf(n)}%` hardcoded the sign's position and its spacing, so a `locale`
 *  that localized every distance on the chart left the grades in en-US. */
export function gradePercent(locale: string | string[] | undefined): (n: number) => string {
  const nf = makePercentFormatter(locale, 1);
  return (n) => nf(n / 100);
}

/** Shared summary — total distance, climb gain, and the steepest pitch + where. */
export function gradeProfileSummary(
  geo: ReturnType<typeof gradeProfileGeometry>,
  strings: GradeProfileStrings,
  fmt: (n: number) => string,
  pct: (n: number) => string,
): string {
  if (geo.segments.length === 0) return strings.noData;
  if (geo.maxGrade <= 0) return strings.gradeProfileFlat(fmt(geo.totalDistance));
  return strings.gradeProfile(
    fmt(geo.totalDistance),
    fmt(geo.totalGain),
    pct(geo.maxGrade),
    fmt(geo.maxGradeAt),
  );
}

// bin → static ink/cat role: gentle band, then a categorical mid, the negative
// token, and the darkest bar for the brutal pitch. Quantized, never a ramp.
const BIN_INK: Record<0 | 1 | 2 | 3, string | undefined> = {
  0: "band",
  1: undefined,
  2: "negative",
  3: "bar",
};

export function GradeProfile(props: GradeProfileProps): ReactNode {
  const {
    data,
    bins = DEFAULT_BINS,
    label = "max",
    width = 120,
    height = 40,
    format,
    locale,
    strings = EN_GRADE_PROFILE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const { fontSize, topPad } = gradeLayout(height, label);
  const geo = gradeProfileGeometry({ data, width, height, bins, topPad });
  const fmt = makeFormatter(format, locale);
  const pct = gradePercent(locale);
  const accName = resolveSummary(summary, () => gradeProfileSummary(geo, strings, fmt, pct));

  // seat the summit label: enabled, a real climb, room in the top gutter, and
  // width to hold the text — otherwise it drops out and the profile reads clean.
  const labelText = geo.maxGrade > 0 ? strings.gradeMax(pct(geo.maxGrade)) : "";
  const labelW = textGutter(labelText.length, fontSize, 2);
  const showLabel =
    label === "max" && geo.maxGrade > 0 && topPad >= fontSize + 0.8 && labelW <= width;
  const labelX = showLabel ? round2(clamp(geo.summitX, labelW / 2, width - labelW / 2)) : 0;

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Every segment quad is anchored to `yBase`, already flushed to the box
      // bottom, so the profile stands on the baseline like a skyline. The
      // summit label lives in the top gutter above the plot and is irrelevant
      // to a floor seat.
      seat={{ mode: "floor", bottom: geo.yBase }}
      className={className ? `mc-grade ${className}` : "mc-grade"}
      style={rootStyle}
    >
      {geo.segments.map((seg, i) => (
        <path
          key={`q${i}`}
          d={seg.path}
          data-mc-ink={BIN_INK[seg.bin]}
          data-mc-cat={seg.bin === 1 ? 1 : undefined}
        />
      ))}
      <path d={geo.ridge} data-mc-ink="data" data-mc-w="full" vectorEffect="non-scaling-stroke" />
      {showLabel ? (
        <>
          <line
            x1={geo.summitX}
            y1={round2(topPad)}
            x2={geo.summitX}
            y2={geo.summitY}
            data-mc-ink="muted"
            data-mc-w="hair"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={labelX}
            y={round2(fontSize)}
            textAnchor="middle"
            fontSize={fontSize}
            data-mc-ink="label"
          >
            {labelText}
          </text>
        </>
      ) : null}
      {children}
    </Chart>
  );
}
