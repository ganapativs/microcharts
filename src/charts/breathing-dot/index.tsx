// <BreathingDot> — how loaded is the system right now, ambiently? (S4, motion
// type). The STATIC frame is a real chart with zero JS: a core dot
// colored by threshold band, and a level ring whose distance from the core IS the
// level read. The interactive entry adds a pulse whose rate encodes the level.
// Band color is always doubled — by ring offset here, by pulse rate in motion —
// so it never stands alone. Boundary rule: continuous level → BreathingDot;
// discrete events → HeartbeatBlip. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_BREATHING_DOT, type BreathingDotStrings } from "../../core/strings-breathing-dot.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, textGutter } from "../../core/labels.js";
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

// The load percent is the only number this chart renders, so the consumer's
// `format` still tunes it — but it resolves through `Intl`'s own percent style,
// never `${Math.round(v * 100)}%`: that template is an en-US percent (fr-FR
// wants a NBSP before the sign, tr-TR puts the sign first, some locales use
// their own digits), so a `locale` prop left the percentage in English.
const PCT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };

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
  return strings.breathingDot(makeFormatter(format, locale, PCT)(v), strings.loadBands[band]);
}

export function BreathingDot(props: BreathingDotProps): ReactNode {
  const {
    value,
    thresholds = [0.5, 0.8],
    label = "none",
    size = 16,
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
  const fontSize = props.fontSize ?? labelFont(size);

  const geo = breathingDotGeometry({ value, size, thresholds, pad: PAD });
  const accName =
    summary === false
      ? false
      : (summary ?? breathingDotSummary(value, { thresholds, strings, format, locale }));
  const pctText =
    label === "value" && !geo.unknown ? makeFormatter(format, locale, PCT)(geo.level) : null;
  // Reserve from the ACTUAL numeral, not a fixed digit count: a locale that puts
  // a NBSP before the sign ("100 %") is one character wider than the "100%" the
  // 2.6 em band was cut for, and `.mc-root` is `overflow: visible` — the numeral
  // would spill into the page rather than clip. The band stays the floor so
  // en-US output is byte-identical.
  const labelBand =
    label === "value"
      ? Math.max(fontSize * 2.6, pctText ? textGutter(pctText.length, fontSize, 1) : 0)
      : 0;

  return (
    <Chart
      width={geo.size + labelBand}
      height={geo.size}
      title={title}
      summary={accName}
      id={id}
      // Concentric rings about the box center — no floor, so it centres on the
      // cap band. The seat is the ring's full travel (the PAD-inset frame), not
      // the ring it happens to be drawn at, so the dot holds still as load moves.
      seat={{ mode: "center", top: PAD, bottom: geo.size - PAD }}
      className={className ? `mc-breathing ${className}` : "mc-breathing"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* Level ring (distance from core); hair stroke role. */}
      {!geo.unknown ? (
        <circle
          cx={geo.ring.cx}
          cy={geo.ring.cy}
          r={geo.ring.r}
          data-mc-ink="muted"
          data-mc-w="hair"
          style={{ fill: "none", strokeOpacity: 0.7 }}
        />
      ) : null}
      <circle
        className="mc-breathing-core"
        cx={geo.core.cx}
        cy={geo.core.cy}
        r={geo.core.r}
        data-mc-ink={geo.unknown ? "neutral" : BAND_INK[geo.band]}
        style={geo.unknown ? { fillOpacity: 0.5 } : undefined}
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
