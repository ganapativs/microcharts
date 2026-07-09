// <MusicStaff> — the shape of a short series read as melody (plan/24 #12, S1).
// Pitch (vertical position on a 5-line staff) is the only channel; time is the
// x order. Reuses describeSeries verbatim (same S1 pipeline as Sparkline) — no
// new summary template. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { describeSeries } from "../../core/summary.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { lastFinite } from "../../core/stats.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { musicStaffGeometry } from "./geometry.js";

export interface MusicStaffProps {
  data: readonly Value[];
  /** `ledger` (default, ±2 ledger positions) or `staff` (clamp on-staff). */
  range?: "staff" | "ledger" | undefined;
  /** `last` prints the final value after the last note. */
  label?: "none" | "last" | undefined;
  domain?: readonly [number, number] | undefined;
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function MusicStaff(props: MusicStaffProps): ReactNode {
  const {
    data,
    range = "ledger",
    label = "none",
    domain,
    color,
    width = 60,
    height = 28,
    format,
    locale,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(height);

  const fmt = makeFormatter(format, locale);
  const last = lastFinite(data);
  const showLabel = label === "last" && isFiniteValue(last);
  const gutter = showLabel ? Math.ceil(`${fmt(last as number)}`.length * 0.62 * fontSize + 2) : 0;
  const geo = musicStaffGeometry({
    values: data,
    domain,
    width: width - gutter,
    height,
    range,
    pad: PAD,
  });
  const accName = summary === false ? false : (summary ?? describeSeries(data, { format, locale }));
  const paint = color;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-staff ${className}` : "mc-staff"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* the five staff lines */}
      <path
        d={geo.staffYs.map((y) => `M${PAD} ${y}L${width - gutter - PAD} ${y}`).join("")}
        data-mc-ink="muted"
        style={{ strokeOpacity: 0.4 }}
      />
      {/* ledger ticks */}
      {geo.ledger.length ? (
        <path
          d={geo.ledger.map((l) => `M${l.x1} ${l.y}L${l.x2} ${l.y}`).join("")}
          data-mc-ink="muted"
          style={{ strokeOpacity: 0.7 }}
        />
      ) : null}
      {/* note heads */}
      {geo.notes.map((nt) => (
        <ellipse
          key={`n${nt.index}`}
          cx={nt.cx}
          cy={nt.cy}
          rx={nt.rx}
          ry={nt.ry}
          data-mc-ink="point"
          style={paint ? { fill: paint } : undefined}
        />
      ))}
      {showLabel && geo.lastX !== null ? (
        <text
          x={width - gutter + 1}
          y={height / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {fmt(last as number)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
