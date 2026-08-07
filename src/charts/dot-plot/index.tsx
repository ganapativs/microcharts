// <DotPlot> — a few named values on one scale. Minimum ink
// per comparison: dots over bars when the scale doesn't start at zero —
// position lies less than truncated length.
// Category labels are anchor-only, truncated by character count.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { dotPlotGeometry, truncateLabel, dotPlotFontSize, dotPlotLabelChars } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { miniBarSummary } from "../mini-bar/index.js";
import { resolveSummary } from "../../core/summary.js";

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
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CategoryStrings | undefined;
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
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const height = props.height ?? Math.max(16, data.length * 9);

  if (data.length > 7) {
    devWarn(`<DotPlot> ${data.length} rows — past 7 the rows blur (documented cap).`);
  }

  const fontSize = dotPlotFontSize(height, data.length, labelSize);
  const longest = data.reduce((m, d) => Math.max(m, d.label.length), 0);
  const maxLabelChars = dotPlotLabelChars(width, fontSize, longest);
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
  const accName = resolveSummary(summary, () => miniBarSummary(data, fmt, strings));

  // labels drop deterministically with density: category text needs
  // fontSize × 1.25 of row pitch, value text a full 8-unit row
  // Two independent reasons a category name drops, and BOTH have to gate it: no
  // vertical room for a line of text, or no horizontal room for enough of the
  // name to identify the row (`rowLabelChars` returns 0 for that). Without the
  // second, a narrow plate rendered every label as a bare "…".
  const showCategories = geo.pitch >= fontSize * 1.25 && maxLabelChars > 0;
  const showValues = label === "value" && geo.pitch >= 8;

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A stack of category rows: value runs sideways, so the box bottom is the
      // last row's band, not a floor anything rests on — it centres on the cap
      // band. The rows always fill the height (pitch = height / n), so the box
      // IS the plot box vertically; the label gutter only insets it sideways.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-dotplot ${className}` : "mc-dotplot"}
      style={rootStyle}
    >
      {geo.rows.map((row) => {
        const d = data[row.index]!;
        const x = row.x;
        // A null row keeps its NAME. Dropping the whole row painted a blank band
        // between two labelled ones — the reader can see a gap but not whose it
        // is, while the interactive entry still roves the row and announces
        // "Kim: no data". The dot is what's missing, not the category.
        if (x === null && !showCategories) return null;
        const isHl = highlight !== undefined && (highlight === d.label || highlight === row.index);
        return (
          <g key={row.index}>
            {stem && x !== null ? (
              <line
                x1={row.stemX0}
                y1={row.y}
                x2={x}
                y2={row.y}
                data-mc-ink="muted"
                data-mc-w="support"
                strokeOpacity={0.5}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {x !== null ? (
              <circle
                cx={x}
                cy={row.y}
                r={2}
                data-mc-ink={isHl ? "accent" : "point"}
                style={!isHl && color ? { fill: color } : undefined}
              />
            ) : null}
            {showCategories ? (
              <text
                x={geo.labelX}
                y={row.y}
                fontSize={fontSize}
                dominantBaseline="central"
                textAnchor="end"
                data-mc-ink="label"
              >
                {truncateLabel(d.label, maxLabelChars)}
              </text>
            ) : null}
            {showValues && x !== null && isFiniteValue(d.value)
              ? /* beside the dot, right first */
                (() => {
                  const text = fmt(d.value);
                  const est = text.length * fontSize * 0.62;
                  const right = x + 4 + est <= width;
                  // The flip left is not a fallback that always works: an
                  // end-anchored figure grows leftward, so a long number on a
                  // low dot ran off the viewBox (`-999,999,999` reached x −54 in
                  // a 60-wide box) and over the category gutter on its way out.
                  // `.mc-root` is overflow: visible, so that spilled into the
                  // page. When neither side has room the figure drops, the same
                  // deterministic way the whole set drops under 8-unit rows.
                  const left = x - 4 - est >= geo.x0;
                  if (!right && !left) return null;
                  return (
                    <text
                      x={right ? x + 4 : x - 4}
                      y={row.y}
                      fontSize={fontSize}
                      dominantBaseline="central"
                      textAnchor={right ? "start" : "end"}
                      // A direct value label, so it takes the label ink like
                      // every other one in the catalog: quieter than the dot it
                      // annotates, and — the part that actually bites — the only
                      // text fill High Contrast Mode maps to CanvasText. Bare
                      // `<text>` keeps `--mc-stroke` verbatim under
                      // `forced-color-adjust: none`, painting a fixed theme ink
                      // against whatever background the user chose.
                      data-mc-ink="label"
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
