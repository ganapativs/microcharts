// <Bullet> — value vs target vs qualitative bands. Ships
// instead of a gauge (Few). Static, hook-free, RSC-safe. Graduated neutral
// bands sit lowest; the measure bar and target tick carry the reading. The tick
// is a distinct shape+position from the bar, so target vs measure never relies
// on color alone.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_BULLET, type BulletStrings } from "../../core/strings-bullet.js";
import { labelFitsY, labelFont } from "../../core/labels.js";
import { bulletGeometry } from "./geometry.js";

/** Value, target, and band landing. */
export function bulletSummary(
  value: string,
  target: string | null,
  strings: BulletStrings = EN_BULLET,
): string {
  return target ? strings.bulletTarget(value, target) : strings.bullet(value);
}

/** Direct label text per `label` mode — `"both"` prefers a compact `72 / 80`. */
function bulletLabelText(
  label: "none" | "value" | "target" | "both",
  value: number,
  target: number | undefined,
  fmt: (n: number) => string,
): string | undefined {
  const hasTarget = target !== undefined && Number.isFinite(target);
  if (label === "none") return undefined;
  if (label === "target") return hasTarget ? fmt(target) : undefined;
  const v = Number.isFinite(value) ? fmt(value) : "—";
  if (label === "value" || !hasTarget) return v;
  return `${v} / ${fmt(target)}`;
}

export interface BulletProps {
  value: number;
  target?: number | undefined;
  /** Ascending qualitative thresholds (e.g. `[50, 80]` on a 0–100 scale). */
  bands?: readonly number[] | undefined;
  /** Explicit `[0, max]`; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  /** Direct value/target readout in a reserved right gutter (deterministic drop-out). */
  label?: "none" | "value" | "target" | "both" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BulletStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Bullet(props: BulletProps): ReactNode {
  const {
    value,
    target,
    bands,
    domain,
    label = "none",
    width = 80,
    height = 16,
    color,
    format,
    locale,
    strings = EN_BULLET,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const fontSize = label === "none" ? 0 : labelFont(height, 0.6);
  const rawLabel = bulletLabelText(label, value, target, fmt);
  const labelText =
    rawLabel !== undefined && labelFitsY(height / 2, fontSize, height) ? rawLabel : undefined;
  const geo = bulletGeometry({
    width,
    height,
    value,
    target,
    bands,
    domain,
    gutterCh: labelText?.length ?? 0,
    fontSize,
  });

  const accName =
    summary === false
      ? false
      : typeof summary === "string"
        ? summary
        : Number.isFinite(value)
          ? bulletSummary(
              fmt(value),
              target !== undefined && Number.isFinite(target) ? fmt(target) : null,
              strings,
            )
          : strings.noData;

  // More bands → widen the shade spread so regions stay distinguishable.
  const steps = Math.max(1, geo.regions.length);

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle =
    labelText !== undefined
      ? ({ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties)
      : style;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A horizontal track with no bottom to stand on — the measure bar runs
      // along it, it doesn't rise from it — so the track band centres on the cap
      // band. The band, not the viewBox: the pad is what keeps the tick ends off
      // the edge, and it isn't part of the reading.
      seat={{ mode: "center", top: geo.track.y, bottom: geo.track.y + geo.track.height }}
      className={className ? `mc-bullet ${className}` : "mc-bullet"}
      style={rootStyle}
    >
      {geo.regions.map((r) => (
        <rect
          key={r.step}
          x={r.x}
          y={geo.track.y}
          width={r.width}
          height={geo.track.height}
          shapeRendering="crispEdges"
          data-mc-ink="bar"
          style={{ fillOpacity: 0.12 + (r.step / steps) * 0.26 }}
        />
      ))}
      <rect
        x={geo.measure.x}
        y={geo.measure.y}
        width={geo.measure.width}
        height={geo.measure.height}
        shapeRendering="crispEdges"
        data-mc-ink="bar"
        style={color ? { fill: color } : undefined}
      />
      {geo.tick ? (
        <line
          x1={geo.tick.x}
          y1={geo.tick.y0}
          x2={geo.tick.x}
          y2={geo.tick.y1}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: "calc(var(--mc-stroke-width) * 1.33)" }}
        />
      ) : null}
      {labelText !== undefined ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="end"
          data-mc-ink="label"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
