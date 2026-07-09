// <BalanceBeam> — which side outweighs, and roughly by how much (plan/24 #8, S2
// exactly two). Tilt direction is instant; the angle SATURATES at maxTilt (read
// direction + rough magnitude, not an exact ratio — docs steer precise ratios to
// PairedBars/Delta). Weights are area-true. Endpoints are pre-rotated in geometry
// (no SVG transform → containment provable). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BEAM, type BeamStrings } from "../../core/strings-beam.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { balanceBeamGeometry, type BeamMode, type BeamShape } from "./geometry.js";

export interface BeamDatum {
  label: string;
  value: number;
}

export interface BalanceBeamProps {
  data: readonly [BeamDatum, BeamDatum];
  /** Degrees at full saturation (default 12). */
  maxTilt?: number | undefined;
  /** Weight shape (default square — circles under-read area at this size). */
  shape?: BeamShape | undefined;
  /** `ratio` (share-of-whole) or `difference` (absolute, scaled by domain). */
  mode?: BeamMode | undefined;
  domain?: readonly [number, number] | undefined;
  /** Print both numerals under the weights. */
  label?: "none" | "values" | undefined;
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BeamStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function balanceBeamSummary(
  data: readonly [BeamDatum, BeamDatum],
  opts: {
    mode?: BeamMode | undefined;
    domain?: readonly [number, number] | undefined;
    strings?: BeamStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { mode = "ratio", domain, strings = EN_BEAM, format, locale } = opts;
  const [l, r] = data;
  const geo = balanceBeamGeometry({
    a: l.value,
    b: r.value,
    width: 48,
    height: 20,
    maxTilt: 12,
    mode,
    domain,
    pad: PAD,
  });
  const fmt = makeFormatter(format, locale);
  if (geo.heavier === 0)
    return strings.balanceBeamBalanced(l.label, fmt(l.value), r.label, fmt(r.value));
  const heavier = geo.heavier === -1 ? l.label : r.label;
  return strings.balanceBeam(l.label, fmt(l.value), r.label, fmt(r.value), heavier);
}

export function BalanceBeam(props: BalanceBeamProps): ReactNode {
  const {
    data,
    maxTilt = 12,
    shape = "square",
    mode = "ratio",
    domain,
    label = "none",
    color,
    width = 48,
    height = 20,
    format,
    locale,
    strings = EN_BEAM,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(height, 0.4);
  // value numerals sit in their own gutter below the apparatus (never over the beam)
  const labelBand = label === "values" ? Math.ceil(fontSize * 1.3) : 0;

  const [l, r] = data;
  const geo = balanceBeamGeometry({
    a: l.value,
    b: r.value,
    width,
    height,
    maxTilt,
    mode,
    domain,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? balanceBeamSummary(data, { mode, domain, strings, format, locale }));
  const paint = color ?? "var(--mc-stroke)";
  const fmt = makeFormatter(format, locale);
  // keep a centered value numeral inside the box (the beam ends ride the edges)
  const labelX = (cx: number, text: string) => {
    const half = (text.length * 0.62 * fontSize) / 2;
    return Math.min(Math.max(cx, half + 1), width - half - 1);
  };

  const weightMark = (w: { cx: number; cy: number; half: number }, key: string) =>
    shape === "round" ? (
      <circle key={key} cx={w.cx} cy={w.cy} r={w.half} style={{ fill: paint }} />
    ) : (
      <rect
        key={key}
        x={w.cx - w.half}
        y={w.cy - w.half}
        width={w.half * 2}
        height={w.half * 2}
        style={{ fill: paint }}
      />
    );

  return (
    <Chart
      width={width}
      height={height + labelBand}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-beam ${className}` : "mc-beam"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* fulcrum */}
      <path d={geo.fulcrum} data-mc-ink="neutral" />
      {/* beam */}
      <line
        x1={geo.beam.x1}
        y1={geo.beam.y1}
        x2={geo.beam.x2}
        y2={geo.beam.y2}
        data-mc-ink="data"
      />
      {/* area-true weights */}
      {weightMark(geo.weights[0], "wl")}
      {weightMark(geo.weights[1], "wr")}
      {label === "values" ? (
        <>
          <text
            x={labelX(geo.weights[0].cx, fmt(l.value))}
            y={height + labelBand - fontSize * 0.32}
            fontSize={fontSize}
            textAnchor="middle"
            data-mc-ink="label"
          >
            {fmt(l.value)}
          </text>
          <text
            x={labelX(geo.weights[1].cx, fmt(r.value))}
            y={height + labelBand - fontSize * 0.32}
            fontSize={fontSize}
            textAnchor="middle"
            data-mc-ink="label"
          >
            {fmt(r.value)}
          </text>
        </>
      ) : null}
      {children}
    </Chart>
  );
}
