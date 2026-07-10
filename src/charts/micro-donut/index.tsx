// <MicroDonut> — roughly what is this made of, at icon size (plan/22 #18, S3).
// An honest, capped concession to a ubiquitous demand: the docs' first
// paragraph steers to SegmentedBar for any comparative read. Wedge cap +
// labeled rollup are non-optional; never explode, tilt, or shadow. Static,
// hook-free, RSC-safe. `decorative` marks it as redundant ornament for an
// adjacent printed value (aria-hidden) — the only sanctioned decorative use.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { rollup } from "../segmented-bar/geometry.js";
import { sharesSummary, type SegmentedBarDatum } from "../segmented-bar/index.js";
import { microDonutGeometry } from "./geometry.js";

export type MicroDonutDatum = SegmentedBarDatum;

export interface MicroDonutProps {
  data: readonly MicroDonutDatum[];
  /** Rollup threshold (same mechanism as SegmentedBar). */
  maxWedges?: number | undefined;
  /** Redundant ornament beside a printed value → aria-hidden. */
  decorative?: boolean | undefined;
  /** Annulus thickness (shared with ProgressRing). */
  weight?: number | undefined;
  size?: number | undefined;
  strings?: CompositionStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const CAT_N = 4; // --mc-cat-1 … --mc-cat-4 via data-mc-cat roles

export function MicroDonut(props: MicroDonutProps): ReactNode {
  const {
    data,
    maxWedges = 4,
    decorative = false,
    weight = 5,
    size = 24,
    strings = EN_COMPOSITION,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((d) => isFiniteValue(d.value) && d.value < 0)) {
    devWarn("<MicroDonut> negative values excluded — a composition cannot contain negative parts.");
  }

  const rolled = rollup(data, maxWedges, strings.otherLabel);
  const geo = microDonutGeometry({
    size,
    shares: rolled.map((d) => d.value),
    weight,
  });
  const accName =
    decorative || summary === false ? false : (summary ?? sharesSummary(rolled, strings));

  return (
    <Chart
      width={size}
      height={size}
      title={decorative ? undefined : title}
      summary={accName}
      id={id}
      className={className ? `mc-donut ${className}` : "mc-donut"}
      style={style}
    >
      {geo.wedges.map((w, i) => {
        const d = rolled[w.index]!;
        return d.members > 1 ? (
          <path key={w.index} d={w.d} data-mc-ink="neutral" />
        ) : (
          <path key={w.index} d={w.d} data-mc-cat={(i % CAT_N) + 1} />
        );
      })}
      {children}
    </Chart>
  );
}
