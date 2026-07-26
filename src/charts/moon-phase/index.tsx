// <MoonPhase> — how far through a cycle/period, readable across cultures (S4,
// flagship). The lit AREA equals the value exactly (closed-form
// terminator, not the phase-angle approximation). progress mode is monotonic
// (0 new → 0.5 half → 1 full); cycle mode maps the real lunar cycle. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makePercentFormatter } from "../../core/format.js";
import { EN_MOON, type MoonStrings } from "../../core/strings-moon.js";
import { moonGeometry, type MoonMode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface MoonPhaseProps {
  /** Fraction 0–1 (clamped). */
  value: number;
  /** `progress` (monotonic illumination) or `cycle` (true lunar mapping). */
  mode?: MoonMode | undefined;
  /** Override the lit color (default --mc-stroke). */
  color?: string | undefined;
  size?: number | undefined;
  locale?: string | string[] | undefined;
  strings?: MoonStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 0.5;

/**
 * The lit fraction as rendered text — a real `Intl` percent, not `${n}%`, which
 * is an en-US percent (fr-FR wants a NBSP before the sign, tr-TR puts the sign
 * first). Clamps and coerces, so a non-finite value reads 0 rather than "NaN%".
 *
 * `locale` comes from the chart's own prop, so a server render and its client
 * hydration produce the same string instead of each resolving its host default.
 * Trailing and optional: callers that never localized keep compiling. Exported
 * so the interactive entry's hover chip reads the SAME string the summary speaks.
 */
export function moonPct(value: number, locale?: string | string[] | undefined): string {
  return makePercentFormatter(locale)(Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
}

export function moonPhaseSummary(
  value: number,
  mode: MoonMode = "progress",
  strings: MoonStrings = EN_MOON,
  locale?: string | string[] | undefined,
): string {
  const pct = moonPct(value, locale);
  return mode === "cycle" ? strings.moonPhaseCycle(pct) : strings.moonPhase(pct);
}

export function MoonPhase(props: MoonPhaseProps): ReactNode {
  const {
    value,
    mode = "progress",
    color,
    size = 16,
    locale,
    strings = EN_MOON,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = moonGeometry({ value, mode, size, pad: PAD });
  const accName = resolveSummary(summary, () => moonPhaseSummary(value, mode, strings, locale));

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      // The disc is the frame and it never changes size — only its lit fraction
      // does — so seating the disc bounds centres the moon on the cap band and
      // holds through the whole cycle.
      seat={{ mode: "center", top: geo.disc.cy - geo.disc.r, bottom: geo.disc.cy + geo.disc.r }}
      className={className ? `mc-moon ${className}` : "mc-moon"}
      style={style}
    >
      <circle cx={geo.disc.cx} cy={geo.disc.cy} r={geo.disc.r} data-mc-ink="band" />
      {/* Lit area = datum; fill is thematic. */}
      {geo.litPath ? <path d={geo.litPath} style={{ fill: color ?? "var(--mc-moon)" }} /> : null}
      <circle
        cx={geo.disc.cx}
        cy={geo.disc.cy}
        r={geo.disc.r}
        data-mc-ink="muted"
        style={{ strokeOpacity: 0.55 }}
      />
      {children}
    </Chart>
  );
}
