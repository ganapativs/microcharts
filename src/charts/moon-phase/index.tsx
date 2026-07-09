// <MoonPhase> — how far through a cycle/period, readable across cultures (plan/24
// #6, S4, flagship). The lit AREA equals the value exactly (closed-form
// terminator, not the phase-angle approximation). progress mode is monotonic
// (0 new → 0.5 half → 1 full); cycle mode maps the real lunar cycle. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_MOON, type MoonStrings } from "../../core/strings-moon.js";
import { moonGeometry, type MoonMode } from "./geometry.js";

export interface MoonPhaseProps {
  /** Fraction 0–1 (clamped). */
  value: number;
  /** `progress` (monotonic illumination) or `cycle` (true lunar mapping). */
  mode?: MoonMode | undefined;
  /** Override the lit color (default --mc-stroke). */
  color?: string | undefined;
  size?: number | undefined;
  strings?: MoonStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 0.5;

export function moonPhaseSummary(
  value: number,
  mode: MoonMode = "progress",
  strings: MoonStrings = EN_MOON,
): string {
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const pct = `${Math.round(v * 100)}%`;
  return mode === "cycle" ? strings.moonPhaseCycle(pct) : strings.moonPhase(pct);
}

export function MoonPhase(props: MoonPhaseProps): ReactNode {
  const {
    value,
    mode = "progress",
    color,
    size = 16,
    strings = EN_MOON,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = moonGeometry({ value, mode, size, pad: PAD });
  const accName = summary === false ? false : (summary ?? moonPhaseSummary(value, mode, strings));

  return (
    <Chart
      width={size}
      height={size}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-moon ${className}` : "mc-moon"}
      style={style}
    >
      {/* base disc — the unlit face, faintly visible so the whole moon reads */}
      <circle cx={geo.disc.cx} cy={geo.disc.cy} r={geo.disc.r} data-mc-ink="band" />
      {/* lit region — warm moonlight (thematic; the lit AREA is still the datum) */}
      {geo.litPath ? <path d={geo.litPath} style={{ fill: color ?? "var(--mc-moon)" }} /> : null}
      {/* hairline outline gives the disc a crisp edge */}
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
