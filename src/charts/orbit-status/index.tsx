// <OrbitStatus> — how slow and how busy is this dependency right now?
// (structured two-variable, motion type). The STATIC frame carries BOTH
// variables with zero JS: orbit radius = latency, orbit dash density = call rate
// (quantized to 5 steps, "denser dashes = more calls"), satellite at the top. The
// interactive entry mirrors the rate as the satellite's angular SPEED (same 5
// steps) and transitions the radius on latency change. The satellite's static
// angle encodes nothing — only its speed does. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_ORBIT_STATUS, type OrbitStatusStrings } from "../../core/strings-orbit-status.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { orbitStatusGeometry } from "./geometry.js";

export interface OrbitStatusProps {
  latency: number;
  rate: number;
  /** Latency extent (documented as weak — pass an explicit domain). Default [0, 2·latency]. */
  latencyDomain?: readonly [number, number] | undefined;
  /** Rate extent. Default [0, 2·rate]. */
  rateDomain?: readonly [number, number] | undefined;
  /** Latency threshold: at/above it the satellite doubles + the summary flags it. */
  alert?: number | undefined;
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
    alert?: number | undefined;
    strings?: OrbitStatusStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { alert, strings = EN_ORBIT_STATUS, format, locale } = opts;
  if (!(Number.isFinite(latency) && Number.isFinite(rate))) return strings.orbitUnknown;
  const fmt = makeFormatter(format, locale);
  const alerted = typeof alert === "number" && Number.isFinite(alert) && latency >= alert;
  return strings.orbitStatus(fmt(Math.max(0, latency)), fmt(Math.max(0, rate)), alerted);
}

export function OrbitStatus(props: OrbitStatusProps): ReactNode {
  const {
    latency,
    rate,
    latencyDomain,
    rateDomain,
    alert,
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
  const fontSize = props.fontSize ?? labelFont(size);

  const geo = orbitStatusGeometry({
    latency,
    rate,
    size,
    latencyDomain,
    rateDomain,
    alert,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? orbitStatusSummary(latency, rate, { alert, strings, format, locale }));
  const fmt = makeFormatter(format, locale);
  const labelText = label === "latency" && !geo.unknown ? `${fmt(Math.max(0, latency))}ms` : null;
  // Reserve the gutter from the real text extent so the ms numeral never spills
  // (0.7·em/char over-estimate — the "ms" glyphs run wider than digits).
  const labelBand = labelText ? Math.ceil(labelText.length * 0.7 * fontSize + 2) : 0;

  return (
    <Chart
      width={size + labelBand}
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
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* orbit — radius is latency, dash density is rate */}
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
      {/* the service */}
      <circle
        cx={geo.center.cx}
        cy={geo.center.cy}
        r={geo.center.r}
        data-mc-ink={geo.unknown ? "neutral" : "bar"}
        style={geo.unknown ? { fillOpacity: 0.5 } : undefined}
      />
      {/* the dependency */}
      {!geo.unknown ? (
        <circle
          className="mc-orbit-satellite"
          cx={geo.satellite.cx}
          cy={geo.satellite.cy}
          r={geo.satellite.r}
          data-mc-ink={geo.satellite.alerted ? "negative" : "accent"}
          style={color ? { fill: color } : undefined}
        />
      ) : null}
      {labelText !== null ? (
        <text
          x={size + 1}
          y={geo.size / 2 + fontSize * 0.34}
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
