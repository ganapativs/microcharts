// <BreathingDot> — how loaded is the system right now, ambiently? (plan/24 #19,
// S4, motion type). The STATIC frame is a real chart with zero JS: a core dot
// colored by threshold band, and a level ring whose distance from the core IS the
// level read. The interactive entry adds a pulse whose rate encodes the level.
// Band color is always doubled — by ring offset here, by pulse rate in motion —
// so it never stands alone. Boundary rule: continuous level → BreathingDot;
// discrete events → HeartbeatBlip. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BREATHING_DOT, type BreathingDotStrings } from "../../core/strings-breathing-dot.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { breathingDotGeometry } from "./geometry.js";

const BAND_INK = ["positive", "neutral", "negative"] as const;

export interface BreathingDotProps {
  value: number | null;
  /** calm/elevated/strained band edges (default [0.5, 0.8]). */
  thresholds?: readonly [number, number] | undefined;
  /** Percent numeral beside the dot (the exact-read escape hatch). */
  label?: "value" | "none" | undefined;
  size?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BreathingDotStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function breathingDotSummary(
  value: number | null,
  opts: {
    thresholds?: readonly [number, number] | undefined;
    strings?: BreathingDotStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { thresholds = [0.5, 0.8], strings = EN_BREATHING_DOT, format, locale } = opts;
  if (!(typeof value === "number" && Number.isFinite(value))) return strings.breathingDotUnknown;
  const v = Math.min(1, Math.max(0, value));
  const band = v < thresholds[0] ? 0 : v < thresholds[1] ? 1 : 2;
  const fmt = makeFormatter(format, locale);
  return strings.breathingDot(`${fmt(Math.round(v * 100))}%`, strings.loadBands[band]);
}

export function BreathingDot(props: BreathingDotProps): ReactNode {
  const {
    value,
    thresholds = [0.5, 0.8],
    label = "none",
    size = 16,
    fontSize = 6,
    format,
    locale,
    strings = EN_BREATHING_DOT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const labelBand = label === "value" ? fontSize * 2.6 : 0;
  const geo = breathingDotGeometry({ value, size, thresholds, pad: PAD });
  const accName =
    summary === false
      ? false
      : (summary ?? breathingDotSummary(value, { thresholds, strings, format, locale }));
  const fmt = makeFormatter(format, locale);
  const pctText = label === "value" && !geo.unknown ? `${fmt(Math.round(geo.level * 100))}%` : null;

  return (
    <Chart
      width={geo.size + labelBand}
      height={geo.size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-breathing ${className}` : "mc-breathing"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {/* level ring — its distance from the core is the static level read */}
      {!geo.unknown ? (
        <circle
          cx={geo.ring.cx}
          cy={geo.ring.cy}
          r={geo.ring.r}
          data-mc-ink="muted"
          style={{ fill: "none", strokeWidth: 0.5, strokeOpacity: 0.7 }}
        />
      ) : null}
      {/* core dot — colored by band, or gray when unknown */}
      <circle
        className="mc-breathing-core"
        cx={geo.core.cx}
        cy={geo.core.cy}
        r={geo.core.r}
        data-mc-ink={geo.unknown ? "muted" : BAND_INK[geo.band]}
        style={geo.unknown ? { fill: "var(--mc-neutral)", fillOpacity: 0.5 } : undefined}
      />
      {pctText !== null ? (
        <text
          x={geo.size + 1}
          y={geo.size / 2 + fontSize * 0.34}
          fontSize={fontSize}
          textAnchor="start"
          data-mc-ink="label"
        >
          {pctText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
