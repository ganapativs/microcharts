// <CyclePlot> — what repeats beneath the trend, and is any slot drifting?
// The series is reshaped into `period` slots; each slot shows its
// own raw values across cycles as a muted polyline (time order, never smoothed,
// never joined across a slot boundary) plus a mean/median tick, and the accent
// spine connects the slot centers. Seasonality and drift are different questions
// of one dataset, kept visually separate.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { maxOf, minOf, scaleLinear } from "../../core/scale.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { EN_CYCLE, type CycleStrings } from "../../core/strings-cycle.js";
import type { Value } from "../../core/types.js";
import { CYCLE_PAD, cycleGeometry, type CycleGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

const slotName = (slots: readonly string[] | undefined, i: number): string =>
  slots?.[i] ?? `slot ${i + 1}`;

export function cycleSummary(
  geo: CycleGeometry,
  opts: { slots?: readonly string[] | undefined; cycleUnit: string },
  fmt: (v: number) => string,
  strings: CycleStrings,
): string {
  if (geo.peakSlot < 0) return strings.noData;
  const peak = fmt(geo.centers[geo.peakSlot]!);
  const dip = fmt(geo.centers[geo.dipSlot]!);
  const peakName = slotName(opts.slots, geo.peakSlot);
  const dipName = slotName(opts.slots, geo.dipSlot);

  // drift clause only when a slot's |drift| leads and exceeds 10% of spine range
  const finiteCenters = geo.centers.filter(Number.isFinite);
  const spineRange = maxOf(finiteCenters) - minOf(finiteCenters);
  let leadSlot = -1;
  for (let s = 0; s < geo.slots.length; s++) {
    if (geo.slots[s]!.n <= 1) continue;
    if (leadSlot < 0 || Math.abs(geo.slots[s]!.drift) > Math.abs(geo.slots[leadSlot]!.drift))
      leadSlot = s;
  }
  const lead = leadSlot >= 0 ? geo.slots[leadSlot]! : null;
  if (lead && spineRange > 0 && Math.abs(lead.drift) > 0.1 * spineRange) {
    return strings.cycle(
      peakName,
      peak,
      dipName,
      dip,
      slotName(opts.slots, leadSlot),
      lead.drift > 0 ? "rising" : "falling",
      geo.slotCounts[leadSlot]!,
      opts.cycleUnit,
    );
  }
  return strings.cycleNoDrift(peakName, peak, dipName, dip);
}

export interface CyclePlotProps {
  /** A flat series, reshaped row-major into `period` slots. */
  data: readonly Value[];
  /** Slots per cycle (4–12) — e.g. 7 for weekdays. Required. */
  period: number;
  /** Slot names for summaries, e.g. ["Sun", "Mon", …]. */
  slots?: readonly string[] | undefined;
  /** Center statistic — median for skewed slot distributions. */
  center?: "mean" | "median" | undefined;
  /** Within-slot micro-trend line (default true); false = spine + ticks only. */
  trend?: boolean | undefined;
  /** `false` drops the spine (within-slot drift only — rare). */
  spine?: boolean | undefined;
  /** Cycle noun for the summary, e.g. "weeks" (default "cycles"). */
  cycleUnit?: string | undefined;
  domain?: readonly [number, number] | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: CycleStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function CyclePlot(props: CyclePlotProps): ReactNode {
  const {
    data,
    period,
    slots,
    center = "mean",
    trend = true,
    spine = true,
    cycleUnit = "cycles",
    domain,
    format,
    locale,
    width = 80,
    height = 20,
    color,
    strings = EN_CYCLE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (period < 4 || period > 12)
    devWarn(`CyclePlot: period ${period} is outside 4–12; the cycle read stops working.`);

  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-cycle-plot ${className}` : "mc-cycle-plot";
  const geo = cycleGeometry({ width, height, data, period, center, domain });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // The frame is known without any data, so an empty plot seats exactly
        // where a populated one does instead of dropping to the viewBox edge.
        seat={{ mode: "floor", bottom: height - CYCLE_PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () =>
    cycleSummary(geo, { slots, cycleUnit }, fmt, strings),
  );
  const accent = color ?? "var(--mc-accent)";

  // Every slot line carries identical paint, so they merge into ONE path of
  // subpaths — one node instead of `period` (up to 366 of them). Each slot keeps
  // its own `M`, so nothing is joined across a slot boundary. The slot ticks
  // below stay separate elements on purpose: the `draw` entrance pops the dots
  // individually as the spine's draw front reaches them.
  const trendPath = trend ? geo.slots.flatMap((sl) => (sl.line ? [sl.line.d] : [])).join(" ") : "";

  // annotations host contract: Marker x = slot index (slot center),
  // Threshold/TargetZone y = data values on the shared value scale.
  const ann = resolveAnnotations(children, {
    x: (i) => geo.slots[Math.round(i)]?.center.x ?? NaN,
    y: scaleLinear(geo.domain, [geo.y1, geo.y0]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Spine and slot polylines are traces over one fitted value domain, so the
      // plot's bottom edge is the floor they stand on. `geo.pad` keeps the seat
      // tied to the scale's own inset rather than a number copied out of it.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={style}
    >
      {ann.under}
      {trendPath ? (
        <path
          d={trendPath}
          data-mc-ink="ghost"
          fill="none"
          stroke="var(--mc-neutral)"
          strokeOpacity={0.55}
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {spine && geo.spine.d ? (
        <path
          d={geo.spine.d}
          data-mc-ink="data"
          fill="none"
          style={{ stroke: accent, strokeWidth: "var(--mc-sw)" }}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.slots.map((sl, i) =>
        sl.n > 0 ? (
          <circle
            key={i}
            cx={sl.center.x}
            cy={sl.center.y}
            r={1.3}
            data-mc-ink="accent"
            style={{ fill: accent }}
          />
        ) : null,
      )}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
