// <DualWindowMeter> — is the level compliant against its target both right now
// and on average. Two
// rolling means of one raw series: fast window thin, slow window thick, against
// a target line. The window sizes are part of the reading and appear in docs.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import { makeUnitFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import { EN_DUAL_WINDOW, type DualWindowStrings } from "../../core/strings-dual-window.js";
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { dualWindowGeometry, rollingMean } from "./geometry.js";

export interface DualWindowMeterProps {
  data: readonly Value[];
  /** The compliance line; the type is meaningless without it. */
  target: number;
  /** Fast/slow integration windows (samples) — stated, never silent. */
  windows?: [number, number] | undefined;
  /** Compliance corridor instead of a single target (a muted zone). */
  band?: readonly [number, number] | undefined;
  /** Right-edge current readings. */
  label?: "last" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: DualWindowStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/**
 * The compliance target as text. `target` is typed `number`, but a host that
 * derives it — an empty input field, a config that hasn't loaded — hands over
 * NaN or `undefined` at runtime, and `fmt` then throws or announces a literal
 * "NaN"/"∞" over a normally painted chart. It reads as the same "—" the missing
 * readings use, and the geometry drops the target line for the same input.
 */
function targetText(target: number, fmt: (n: number) => string): string {
  return isFiniteValue(target) ? fmt(target) : "—";
}

/** Shared summary — the sustained (slow) read vs target, then the fast read. */
export function dualWindowSummary(
  fastLast: number | null,
  slowLast: number | null,
  target: number,
  strings: DualWindowStrings,
  fmt: (n: number) => string,
): string {
  if (slowLast == null && fastLast == null) return strings.noData;
  return strings.dualWindow(
    slowLast == null ? "—" : fmt(slowLast),
    targetText(target, fmt),
    fastLast == null ? "—" : fmt(fastLast),
  );
}

export function DualWindowMeter(props: DualWindowMeterProps): ReactNode {
  const {
    data,
    target,
    windows = [3, 30],
    band,
    label = "last",
    domain,
    width = 100,
    height = 24,
    format,
    locale,
    strings = EN_DUAL_WINDOW,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  let [wf, ws] = windows;
  if (wf >= ws) {
    devWarn("<DualWindowMeter> fast window ≥ slow window — swapped.");
    [wf, ws] = [Math.min(wf, ws), Math.max(wf, ws)];
  }

  // A word-sized right-edge readout states the level, not its every decimal:
  // the raw rolling mean of a noisy series is a full float ("-23.858"), which
  // both over-claims precision and outgrows the gutter it was measured for. One
  // fraction digit is the DEFAULT only — an explicit `format` still wins.
  const fmt = makeUnitFormatter(format, locale, { maximumFractionDigits: 1 });
  const fontSize = labelFont(height, 0.32, labelSize);
  // the two O(n·window) rolling means are computed ONCE and reused for both
  // the preliminary (gutter-sizing) pass and the final layout pass below —
  // each pass used to recompute both means, quietly doubling the real cost
  const means = { fast: rollingMean(data, wf), slow: rollingMean(data, ws) };
  // preliminary pass to size the gutter from the last readings
  const pre = dualWindowGeometry({
    data,
    windows: [wf, ws],
    target,
    band: band ?? null,
    domain: domain ?? null,
    width,
    height,
    gutter: 0,
    means,
  });
  const labelStr = (v: number | null) => (v == null ? "" : fmt(v));
  const gutter =
    label === "last"
      ? Math.min(
          width * 0.35,
          Math.max(labelStr(pre.fastLast).length, labelStr(pre.slowLast).length, 1) *
            fontSize *
            0.62 +
            3,
        )
      : 0;

  const geo = dualWindowGeometry({
    data,
    windows: [wf, ws],
    target,
    band: band ?? null,
    domain: domain ?? null,
    width,
    height,
    gutter,
    means,
  });
  const accName = resolveSummary(summary, () =>
    dualWindowSummary(geo.fastLast, geo.slowLast, target, strings, fmt),
  );

  // both readings need ~2.4× the font of vertical room; below that, show only the
  // sustained (slow) reading rather than crush two numbers together
  const bothFit = height >= fontSize * 2.4;
  // `labelFont` floors at 7 viewBox units, so under a 7-unit box not even the
  // sustained reading fits — it DROPS rather than spilling past the box. The
  // two traces against the target line are the encoding and survive alone.
  const showLabels = label === "last" && labelFitsY(height / 2, fontSize, height);
  const showFast = showLabels && bothFit;
  // the readout is `dominant-baseline: central`, so its box straddles y by half
  // a font EACH WAY — an asymmetric 0.6/0.4 clamp let the descender side hang
  // out of the box once the label filled the height.
  const clampY = (y: number) => clamp(y, fontSize * 0.5, height - fontSize * 0.5);
  let slowY = geo.slowLastY == null ? 0 : clampY(geo.slowLastY);
  let fastY = geo.fastLastY == null ? 0 : clampY(geo.fastLastY);
  if (bothFit && geo.slowLastY != null && geo.fastLastY != null) {
    const gap = Math.min(fontSize * 1.3, height - fontSize);
    const center = clamp(
      (geo.slowLastY + geo.fastLastY) / 2,
      fontSize * 0.5 + gap / 2,
      height - fontSize * 0.5 - gap / 2,
    );
    const slowBelow = geo.slowLastY >= geo.fastLastY;
    slowY = round2(center + (slowBelow ? gap / 2 : -gap / 2));
    fastY = round2(center + (slowBelow ? -gap / 2 : gap / 2));
  }

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Two traces read like any other line chart, so they stand on the plot
      // floor rather than centring. The floor comes from the geometry's padded
      // frame, not from the traces: the domain auto-fits the rolling means, and a
      // data-derived seat would make the meter bob every time a window updated.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={className ? `mc-dualwin ${className}` : "mc-dualwin"}
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {geo.bandRect ? (
        // fill via inline STYLE (see graded-band/benchmark-strip): the band
        // ink-role CSS would set --mc-band, overriding it here to a flatter
        // neutral corridor tint
        <rect
          x={geo.bandRect.x}
          y={geo.bandRect.y}
          width={geo.bandRect.width}
          height={geo.bandRect.height}
          data-mc-ink="band"
          style={{ fill: "var(--mc-neutral)", fillOpacity: 0.12 }}
        />
      ) : null}
      {geo.targetY == null ? null : (
        <line
          x1={1}
          x2={width - gutter - 1}
          y1={geo.targetY}
          y2={geo.targetY}
          data-mc-ink="muted"
          data-mc-w="tick"
          strokeDasharray="2 1.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {/* the ×1.3 / ×0.7 width pair IS the encoding (slow sustained = thick,
          fast reactive = thin) — justified literal multipliers on the primary
          token, not width roles (those are for secondary strokes). BOTH traces
          need `non-scaling-stroke` or the ratio only holds at 1:1: the fast
          trace alone scaled with the box, so past ~1.9× it painted THICKER than
          the slow one and the encoding read backwards. */}
      <path
        d={geo.slowPath}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeWidth: "calc(var(--mc-sw) * 1.3)" }}
      />
      <path
        d={geo.fastPath}
        data-mc-ink="accent"
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeWidth: "calc(var(--mc-sw) * 0.7)" }}
      />
      {/* a reading with no representable y has nowhere to sit: the fallback
          below would park it at y=0, half a glyph outside the box */}
      {showLabels && geo.slowLast != null && geo.slowLastY != null ? (
        <text
          x={width}
          y={slowY}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {fmt(geo.slowLast)}
        </text>
      ) : null}
      {showFast && geo.fastLast != null && geo.fastLastY != null ? (
        <text
          x={width}
          y={fastY}
          dominantBaseline="central"
          textAnchor="end"
          fontSize={fontSize}
          data-mc-ink="accent"
        >
          {fmt(geo.fastLast)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
