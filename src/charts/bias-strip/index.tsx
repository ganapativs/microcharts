// <BiasStrip> — is there a systematic offset between two ways of measuring the
// same thing? Static, hook-free, RSC-safe. A
// word-sized Bland–Altman plot: each dot is one pair at (mean, difference); the
// zero line is perfect agreement, the accent line is the measured bias, and the
// faint band is the ±k·σ limits of agreement. Dots at 75% opacity so overplot
// reads as density; pairs beyond the limits are re-inked and enlarged so the
// outliers read on shape, not color alone.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_BIAS_STRIP, type BiasStripStrings } from "../../core/strings-bias-strip.js";
import { biasLayout, biasStripGeometry, type BiasGeometry, type BiasPair } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export type { BiasPair };

/** Factual agreement summary. Shared with the interactive entry. */
export function biasStripSummary(
  geo: BiasGeometry,
  strings: BiasStripStrings,
  fmtSigned: (n: number) => string,
): string {
  if (geo.bias === null) return strings.noData;
  const bias = fmtSigned(geo.bias);
  if (geo.withinPct === null) return strings.biasStripShort(bias, geo.n);
  return strings.biasStrip(bias, geo.n, `${geo.withinPct}%`);
}

export interface BiasStripProps {
  data: readonly BiasPair[];
  /** k in bias ± k·σ (default 1.96 ≈ 95% limits of agreement). */
  limits?: number | undefined;
  /** Seat-gated bias label. `"none"` hides it. */
  label?: "bias" | "none" | undefined;
  /** Base dot radius in viewBox units, clamped to [1, 3]. */
  r?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BiasStripStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function BiasStrip(props: BiasStripProps): ReactNode {
  const {
    data,
    limits = 1.96,
    label = "bias",
    width = 56,
    height = 30,
    color,
    format,
    locale,
    strings = EN_BIAS_STRIP,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const { rad, outlierRad, fontSize, captionPad } = biasLayout(width, height, label, props.r);

  if (data.length > 40) {
    devWarn(`<BiasStrip> ${data.length} pairs downsampled.`);
  }

  const geo = biasStripGeometry({ width, height, data, limits, rad: outlierRad, captionPad });
  const fmtSigned = makeFormatter(format, locale, { signDisplay: "exceptZero" });
  const accName = resolveSummary(summary, () => biasStripSummary(geo, strings, fmtSigned));

  // seat-gate: the bias caption sits in the reserved top gutter (never on a dot)
  // and only when it fits horizontally beside the right edge.
  const labelText = geo.biasY === null ? "" : `${fmtSigned(geo.bias!)} bias`;
  const labelFits =
    captionPad > 0 && labelText.length > 0 && labelText.length * fontSize * 0.62 + 2 <= width - 2;
  const labelY = captionPad / 2;

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
      // Pairs hang off the zero-difference line and drift reads either way, so
      // there is no floor — the scatter centres on the cap band. It must be the
      // geometry's plot box, not the frame: the caption gutter compresses the
      // plot from the top, which pushes the zero line below the frame's centre.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-bias ${className}` : "mc-bias"}
      style={rootStyle}
    >
      {geo.band ? (
        <rect x={0} y={geo.band.y} width={width} height={geo.band.height} data-mc-ink="band" />
      ) : null}
      <line
        x1={0}
        y1={geo.zeroY}
        x2={width}
        y2={geo.zeroY}
        data-mc-ink="muted"
        data-mc-w="hair"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
      {geo.biasY !== null ? (
        <line
          x1={0}
          y1={geo.biasY}
          x2={width}
          y2={geo.biasY}
          data-mc-ink="accent"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.dots.map(({ x, y, index, outside }) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={outside ? outlierRad : rad}
          data-mc-ink={outside ? "negative" : color ? undefined : "point"}
          fillOpacity={outside ? 0.85 : 0.75}
          style={!outside && color ? { fill: color } : undefined}
        />
      ))}
      {labelFits ? (
        <text
          x={width - 2}
          y={labelY}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
