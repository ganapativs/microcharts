// <BalanceBeam> — which side outweighs, and roughly by how much (S2, exactly
// two). Tilt direction is instant; the angle SATURATES at maxTilt (read
// direction + rough magnitude, not an exact ratio — docs steer precise ratios to
// PairedBars/Delta). Weights are area-true. Endpoints are pre-rotated in geometry
// (no SVG transform → containment provable). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BEAM, type BeamStrings } from "../../core/strings-beam.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
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
  // Runtime tolerance beyond the type: a short array or a null pan is "no
  // data", and there is no comparison to state.
  const l = data[0] as BeamDatum | undefined;
  const r = data[1] as BeamDatum | undefined;
  if (!l || !r || !isFiniteValue(l.value) || !isFiniteValue(r.value)) return strings.noData;
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
  const fmt = makeFormatter(format, locale);
  // Degradation: the two numerals sit side by side under their own pans, and
  // `labelX` below clamps each inside the box — so on a narrow beam the clamp
  // walks them into each other and "620" lands on "480". They DROP together
  // (one pan's number without the other's is not a comparison), and `labelBand`
  // drops with them so the box stops reserving a strip of height for text it no
  // longer draws. Pure arithmetic on the 0.62 em/char estimate: the static path
  // may never measure text.
  const numerals = (data as readonly (BeamDatum | undefined)[])
    .slice(0, 2)
    .map((d) => (d && Number.isFinite(d.value) ? fmt(d.value) : ""));
  const showValues =
    label === "values" && numerals.reduce((w, t) => w + t.length * 0.62 * fontSize, 0) + 2 <= width;
  // value numerals sit in their own gutter below the apparatus (never over the beam)
  const labelBand = showValues ? Math.ceil(fontSize * 1.3) : 0;
  // The numerals' text baseline — also the inline seat's floor when they render.
  const labelY = height + labelBand - fontSize * 0.32;

  const l = data[0] as BeamDatum | undefined;
  const r = data[1] as BeamDatum | undefined;
  const geo = balanceBeamGeometry({
    a: l?.value,
    b: r?.value,
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
  // keep a centered value numeral inside the box (the beam ends ride the edges)
  const labelX = (cx: number, text: string) => {
    const half = (text.length * 0.62 * fontSize) / 2;
    return Math.min(Math.max(cx, half + 1), width - half - 1);
  };

  // The heavier pan is accented — the "which side wins" read is instant, and it
  // only reinforces the tilt (never the sole cue), so direction stays legible
  // without colour. An explicit `color` overrides both pans (user intent wins);
  // otherwise the fill comes from the accent/point ink roles.
  const weightMark = (w: { cx: number; cy: number; half: number }, key: string, heavy: boolean) => {
    const inkProps = color
      ? { style: { fill: color } }
      : { "data-mc-ink": heavy ? "accent" : "point" };
    return shape === "round" ? (
      <circle key={key} cx={w.cx} cy={w.cy} r={w.half} {...inkProps} />
    ) : (
      <rect
        key={key}
        x={w.cx - w.half}
        y={w.cy - w.half}
        width={w.half * 2}
        height={w.half * 2}
        {...inkProps}
      />
    );
  };

  return (
    <Chart
      width={width}
      height={height + labelBand}
      title={title}
      summary={accName}
      id={id}
      // A physical apparatus: the fulcrum's base rests at `height - PAD` and
      // everything else is stacked on top of it, so it stands on the text
      // baseline. With `label="values"` the numerals get their own band BELOW
      // that base, and seating the apparatus would hang them a full band under
      // the baseline and into the next line — so in that mode the floor becomes
      // the numerals' own text baseline, which lands them on the prose baseline
      // and keeps the whole mark inside the line box.
      seat={{ mode: "floor", bottom: labelBand > 0 ? labelY : height - PAD }}
      className={className ? `mc-beam ${className}` : "mc-beam"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <path d={geo.fulcrum} data-mc-ink="neutral" />
      <line
        x1={geo.beam.x1}
        y1={geo.beam.y1}
        x2={geo.beam.x2}
        y2={geo.beam.y2}
        data-mc-ink="data"
        vectorEffect="non-scaling-stroke"
      />
      {/* Heavier pan = accent. Unknown pan: no weight mark (missing ≠ zero). */}
      {geo.known[0] ? weightMark(geo.weights[0], "wl", geo.heavier === -1) : null}
      {geo.known[1] ? weightMark(geo.weights[1], "wr", geo.heavier === 1) : null}

      {showValues
        ? ([l, r] as (BeamDatum | undefined)[]).map((d, i) =>
            geo.known[i] ? (
              <text
                key={i}
                x={labelX(geo.weights[i]!.cx, fmt(d!.value))}
                y={labelY}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {fmt(d!.value)}
              </text>
            ) : null,
          )
        : null}
      {children}
    </Chart>
  );
}
