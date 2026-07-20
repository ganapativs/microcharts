// <WindBarb> — which way it's flowing and roughly how hard, in one character
// Static, hook-free, RSC-safe. Direction is the shaft
// angle; magnitude is QUANTIZED into WMO barbs (that quantization is the honesty
// — the per-barb quantum is stated next to every example). No interactive entry:
// a single glyph has no meaningful pointer/keyboard interaction (the a11y name
// carries the full reading).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_WIND_BARB, octant, type WindBarbStrings } from "../../core/strings-wind-barb.js";
import { windBarbGeometry } from "./geometry.js";

export interface WindBarbProps {
  /** Degrees, from-direction per met convention (0 = up/north, clockwise). */
  direction: number;
  magnitude: number;
  /** Full-barb quantum; sets the read-back key ("each barb = 10"). */
  step?: number | undefined;
  /** Numeric magnitude beside the glyph, anchored + tabular (label boolean→enum, matching the family vocabulary). */
  label?: "value" | "none" | undefined;
  /** `"arrow"` = plain direction arrow + label when quantized barbs don't fit. */
  mode?: "barb" | "arrow" | undefined;
  /** Square glyph edge in viewBox units. */
  size?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: WindBarbStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — compass octant + degrees + magnitude (calm when near zero). */
export function windBarbSummary(
  direction: number,
  magnitude: number,
  step: number,
  strings: WindBarbStrings,
  fmt: (n: number) => string,
): string {
  const m = Math.abs(magnitude);
  if (!Number.isFinite(m) || m < step / 4) return strings.windBarbCalm;
  const dir = magnitude < 0 ? direction + 180 : direction;
  const deg = Math.round(((dir % 360) + 360) % 360);
  return strings.windBarb(strings.compass8[octant(deg)]!, String(deg), fmt(m));
}

export function WindBarb(props: WindBarbProps): ReactNode {
  const {
    direction,
    magnitude,
    step = 10,
    label = "none",
    mode = "barb",
    size = 32,
    format,
    locale,
    strings = EN_WIND_BARB,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (magnitude < 0)
    devWarn("<WindBarb> negative magnitude — using |magnitude| with direction flipped 180°.");
  const dir = magnitude < 0 ? direction + 180 : direction;
  const mag = Math.abs(magnitude);

  const fmt = makeFormatter(format, locale);
  const fontSize = labelFont(size, 0.26);
  const labelText = label === "value" || mode === "arrow" ? fmt(mag) : undefined;
  const gutter = labelText ? labelText.length * fontSize * 0.62 + 3 : 0;
  const totalW = size + gutter;

  const geo = windBarbGeometry({ direction: dir, magnitude: mag, step, width: size, height: size });
  const accName =
    summary === false
      ? false
      : (summary ?? windBarbSummary(direction, magnitude, step, strings, fmt));

  const arrowHead = (() => {
    if (mode !== "arrow" || geo.calm) return null;
    const { x2, y2, x1, y1 } = geo.shaft;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const a1 = ang + (150 * Math.PI) / 180;
    const a2 = ang - (150 * Math.PI) / 180;
    const L = size * 0.22;
    return `M${round2(x2)} ${round2(y2)}L${round2(x2 + Math.cos(a1) * L)} ${round2(y2 + Math.sin(a1) * L)}M${round2(x2)} ${round2(y2)}L${round2(x2 + Math.cos(a2) * L)} ${round2(y2 + Math.sin(a2) * L)}`;
  })();

  return (
    <Chart
      width={totalW}
      height={size}
      title={title}
      summary={accName}
      id={id}
      // A shaft pivoting about its center has no floor — north and south are the
      // same glyph flipped — so it centres on the cap band. The seat is the sweep
      // disc, not the drawn shaft, or the mark would hop as the wind turned.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-windbarb ${className}` : "mc-windbarb"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.calm ? (
        <circle
          cx={geo.center.x}
          cy={geo.center.y}
          r={Math.max(2, size * 0.12)}
          fill="none"
          data-mc-ink="muted"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <>
          {/* Shaft, barbs and arrowhead carry 1.25× the inherited stroke: at
              glyph scale the short barb ticks and half-barbs read as one blob
              at the base width, so the primary marks are nudged heavier to keep
              feather counts (the encoded speed) countable. */}
          <line
            x1={geo.shaft.x1}
            y1={geo.shaft.y1}
            x2={geo.shaft.x2}
            y2={geo.shaft.y2}
            data-mc-ink="data"
            strokeLinecap="round"
            style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.25)" }}
          />
          {mode === "arrow" && arrowHead ? (
            <path
              d={arrowHead}
              data-mc-ink="data"
              fill="none"
              strokeLinecap="round"
              style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.25)" }}
            />
          ) : (
            <>
              {geo.barbs.length > 0 ? (
                <path
                  d={geo.barbs.map((b) => `M${b.x1} ${b.y1}L${b.x2} ${b.y2}`).join("")}
                  data-mc-ink="data"
                  fill="none"
                  strokeLinecap="round"
                  style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.25)" }}
                />
              ) : null}
              {geo.pennants.map((p, i) => (
                <path key={i} d={p} data-mc-ink="point" />
              ))}
            </>
          )}
        </>
      )}
      {labelText ? (
        <text
          x={totalW}
          y={size / 2}
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

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
