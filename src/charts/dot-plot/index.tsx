// <DotPlot> — a few named values on one scale (plan/22 #10, S2). Minimum ink
// per comparison: dots over bars when the scale doesn't start at zero —
// position lies less than truncated length. Static, hook-free, RSC-safe.
// Category labels are anchor-only, truncated by character count (plan/18).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { dotPlotGeometry, truncateLabel } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { miniBarSummary } from "../mini-bar/index.js";

export type DotPlotDatum = MiniBarDatum;

export interface DotPlotProps {
  data: readonly DotPlotDatum[];
  /** Hairline from zero to each dot — flips to a magnitude-from-zero read
   *  (forces a zero-anchored domain; absorbs the former Lollipop). */
  stem?: boolean | undefined;
  /** Index or label to accent. */
  highlight?: number | string | undefined;
  /** `"value"` puts the number right of each dot (drops out under 8-unit rows). */
  label?: "value" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: CategoryStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function DotPlot(props: DotPlotProps): ReactNode {
  const {
    data,
    stem = false,
    highlight,
    label = "none",
    domain,
    width = 60,
    color,
    format,
    locale,
    strings = EN_CATEGORY,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const height = props.height ?? Math.max(16, data.length * 8);

  if (data.length > 7) {
    devWarn(`<DotPlot> ${data.length} rows — past 7 the rows blur (documented cap).`);
  }

  const fontSize = 6;
  const maxLabelChars = Math.min(
    6,
    data.reduce((m, d) => Math.max(m, d.label.length), 0),
  );
  const geo = dotPlotGeometry({
    width,
    height,
    values: data.map((d) => d.value),
    domain,
    gutterCh: maxLabelChars > 0 ? maxLabelChars + 1 : 0,
    fontSize,
    stem,
  });
  const fmt = makeFormatter(format, locale);
  const accName = summary === false ? false : (summary ?? miniBarSummary(data, fmt, strings));

  // labels drop deterministically with density: category text needs
  // fontSize × 1.25 of row pitch, value text a full 8-unit row (plan/18)
  const showCategories = geo.pitch >= fontSize * 1.25;
  const showValues = label === "value" && geo.pitch >= 8;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-dotplot ${className}` : "mc-dotplot"}
      style={style}
    >
      {geo.rows.map((row) => {
        const d = data[row.index]!;
        if (row.x === null) return null;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === row.index);
        return (
          <g key={row.index}>
            {stem ? (
              <line
                x1={row.stemX0}
                y1={row.y}
                x2={row.x}
                y2={row.y}
                data-mc-ink="muted"
                data-mc-w="support"
                strokeOpacity={0.5}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <circle
              cx={row.x}
              cy={row.y}
              r={2}
              data-mc-ink={isHl ? "accent" : "point"}
              style={!isHl && color ? { fill: color } : undefined}
            />
            {showCategories ? (
              <text
                x={geo.labelX}
                y={row.y}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="end"
                data-mc-ink="label"
              >
                {truncateLabel(d.label)}
              </text>
            ) : null}
            {showValues && isFiniteValue(d.value)
              ? /* beside the dot; flips to the left side when the estimate
                 would overflow the right edge (pure arithmetic, plan/18) */
                (() => {
                  const text = fmt(d.value);
                  const fits = row.x + 4 + text.length * fontSize * 0.62 <= width;
                  return (
                    <text
                      x={fits ? row.x + 4 : row.x - 4}
                      y={row.y}
                      fontSize={fontSize}
                      dominantBaseline="central"
                      textAnchor={fits ? "start" : "end"}
                    >
                      {text}
                    </text>
                  );
                })()
              : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}
