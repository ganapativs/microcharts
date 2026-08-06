// <OrbitStatus> — how slow and how busy is this dependency right now?
// (structured two-variable, motion type). The STATIC frame carries BOTH
// variables with zero JS: orbit radius = latency, orbit dash density = call rate
// (quantized to 5 steps, "denser dashes = more calls"). satellite at the top. The
// interactive entry mirrors the rate as the satellite's angular SPEED (same 5
// steps) and transitions the radius on latency change. The satellite's static
// angle encodes nothing — only its speed does.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_ORBIT_STATUS, type OrbitStatusStrings } from "../../core/strings-orbit-status.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFitsY, labelFont } from "../../core/labels.js";
import { isFiniteValue } from "../../core/types.js";
import { orbitLabelBand, orbitStatusGeometry } from "./geometry.js";

export interface OrbitStatusProps {
  latency: number;
  rate: number;
  /**
   * Latency extent — the orbit-radius scale. Default `[0, 2·threshold]` when you
   * set a `threshold`, else `[0, 1000]` ms.
   */
  domain?: readonly [number, number] | undefined;
  /** The same extent under its older name. `domain` wins when both are set. */
  latencyDomain?: readonly [number, number] | undefined;
  /** Rate extent. Default: one dash step per decade (under 1/s, 1, 10, 100, 1000+). */
  rateDomain?: readonly [number, number] | undefined;
  /** Latency threshold: at/above it the satellite doubles + the summary flags it. */
  threshold?: number | undefined;
  /** ms numeral beside the orbit (`latency`), or none (default). */
  label?: "latency" | "none" | undefined;
  size?: number | undefined;
  color?: string | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: OrbitStatusStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function orbitStatusSummary(
  latency: number,
  rate: number,
  opts: {
    threshold?: number | undefined;
    strings?: OrbitStatusStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { threshold, strings = EN_ORBIT_STATUS, format, locale } = opts;
  if (!isFiniteValue(latency) || !isFiniteValue(rate)) return strings.orbitUnknown;
  const fmt = makeFormatter(format, locale);
  const alerted = isFiniteValue(threshold) && latency >= threshold;
  return strings.orbitStatus(fmt(Math.max(0, latency)), fmt(Math.max(0, rate)), alerted);
}

export function OrbitStatus(props: OrbitStatusProps): ReactNode {
  const {
    latency,
    rate,
    domain,
    latencyDomain,
    rateDomain,
    threshold,
    label = "none",
    size = 20,
    color,
    format,
    locale,
    strings = EN_ORBIT_STATUS,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = orbitStatusGeometry({
    latency,
    rate,
    size,
    // `domain` is the grammar-standard spelling of the latency extent; the
    // longer name predates it and still resolves to the same scale.
    latencyDomain: domain ?? latencyDomain,
    rateDomain,
    threshold,
    pad: PAD,
  });
  // `fontSize` is host-computed like `size`, and a non-finite or non-positive
  // one reached the DOM verbatim: `font-size="NaN"`, `y="NaN"`, and a NaN
  // viewBox width through the gutter it sizes. Fall back to the size-derived
  // default.
  const fontSize =
    isFiniteValue(props.fontSize) && props.fontSize > 0 ? props.fontSize : labelFont(geo.size);

  const accName =
    summary === false
      ? false
      : (summary ?? orbitStatusSummary(latency, rate, { threshold, strings, format, locale }));
  const fmt = makeFormatter(format, locale);
  const labelY = geo.size / 2 + fontSize * 0.34;
  // `labelFont` floors at 7, so under a box of ~8 units the numeral's em-box no
  // longer fits the glyph box vertically — and `.mc-root` is `overflow: visible`,
  // so it paints on the page instead of clipping. Drop it (labels.ts degradation
  // rule), gutter and all; the summary still states the ms.
  const labelText =
    label === "latency" && !geo.unknown && labelFitsY(labelY, fontSize, geo.size, false)
      ? strings.orbitLatency(fmt(Math.max(0, latency)))
      : null;
  // Reserve the gutter from the real text extent so the ms numeral never spills.
  const labelBand = labelText ? orbitLabelBand(labelText.length, fontSize) : 0;

  return (
    <Chart
      width={geo.size + labelBand}
      height={geo.size}
      title={title}
      summary={accName}
      id={id}
      // Concentric dial, no floor — it centres on the cap band. The box has to
      // be the square itself: the orbit radius IS the latency, so seating the
      // drawn circle would slide the whole glyph up the line as latency fell.
      // The label only widens the viewBox; the dial's band is unmoved.
      seat={{ mode: "center", top: 0, bottom: geo.size }}
      className={className ? `mc-orbit ${className}` : "mc-orbit"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      <circle
        cx={geo.orbit.cx}
        cy={geo.orbit.cy}
        r={geo.orbit.r}
        data-mc-ink="muted"
        data-mc-w="hair"
        style={{
          fill: "none",
          strokeOpacity: geo.unknown ? 0.4 : 0.8,
          ...(geo.orbit.dash[0] > 0
            ? { strokeDasharray: `${geo.orbit.dash[0]} ${geo.orbit.dash[1]}` }
            : null),
        }}
      />
      <circle
        cx={geo.center.cx}
        cy={geo.center.cy}
        r={geo.center.r}
        data-mc-ink={geo.unknown ? "neutral" : "bar"}
        style={geo.unknown ? { fillOpacity: 0.5 } : undefined}
      />
      {!geo.unknown ? (
        <circle
          className="mc-orbit-satellite"
          cx={geo.satellite.cx}
          cy={geo.satellite.cy}
          r={geo.satellite.r}
          data-mc-ink={geo.satellite.alerted ? "negative" : "accent"}
          // `color` re-paints the accent satellite only. An alerted one carries
          // valence, and a brand hue over it announces "above threshold" in the
          // caller's calm blue (BiasStrip/Constellation guard theirs the same way).
          style={color && !geo.satellite.alerted ? { fill: color } : undefined}
        />
      ) : null}
      {labelText !== null ? (
        <text
          x={geo.size + 1}
          y={labelY}
          fontSize={fontSize}
          textAnchor="start"
          data-mc-ink="label"
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
