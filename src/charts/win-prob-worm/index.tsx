// <WinProbWorm> — who's winning, and when did it flip? A single
// win-probability series on a FIXED 0–100 axis (never truncated — the honesty
// rule): a dashed 50% midline, the worm split at every crossing so leading
// stretches read accent and trailing stretches read neutral, a dot at each lead
// change, an endpoint "now" dot + label, and a seat-gated marker on the biggest
// momentum swing. A modelled read, so the summary says "per the supplied
// model".
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { round2, isFiniteValue } from "../../core/types.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { resolveSummary } from "../../core/summary.js";
import { devWarn } from "../../core/dev.js";
import { EN_WIN_PROB_WORM, type WinProbWormStrings } from "../../core/strings-win-prob-worm.js";
import { PAD, resolveWormGeo, swingMark, winProbWormSummary, wormCustomPct } from "./geometry.js";

export { winProbWormSummary, wormGutter } from "./geometry.js";

export interface WinProbWormProps {
  /** A single win-probability series, clamped to 0–100 (out-of-range dev-warns). */
  data: readonly (number | null)[];
  /** Probability extent — the y-axis. Default [0, 100], the full range. */
  domain?: readonly [number, number] | undefined;
  /** Names for the two sides — [`>50`, `<50`]. Default `["A", "B"]`. */
  sides?: readonly [string, string] | undefined;
  /** `"last"` prints the current leader's probability at the endpoint. */
  label?: "last" | "none" | undefined;
  /** Mark the biggest momentum swing (default true; seat-gated). */
  markSwing?: boolean | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  strings?: WinProbWormStrings | undefined;
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

export function WinProbWorm(props: WinProbWormProps): ReactNode {
  const {
    data,
    domain,
    sides = ["A", "B"],
    label = "last",
    markSwing = true,
    format,
    locale,
    width = 80,
    height = 16,
    color,
    strings = EN_WIN_PROB_WORM,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height, 0.55, labelSize);
  const fmt = makeFormatter(format, locale);
  // Probabilities go through `Intl`'s own percent style so the sign follows
  // `locale`. Three fraction digits keeps the pre-`Intl` output byte-identical
  // for a fractional probability ("52.5%"). A caller-supplied `format` still
  // wins outright — it is the documented escape hatch, and it commonly already
  // writes its own `%`.
  const pctFmt = format === undefined ? makePercentFormatter(locale, 3) : wormCustomPct(fmt);
  const cls = className ? `mc-win-prob-worm ${className}` : "mc-win-prob-worm";

  for (const v of data)
    if (isFiniteValue(v) && (v < 0 || v > 100)) {
      devWarn("<WinProbWorm> values are win probabilities — clamped to 0–100.");
      break;
    }

  const { geo, gutter, lastText } = resolveWormGeo({
    width,
    height,
    data,
    domain,
    label,
    font: FONT,
    pctFmt,
  });
  const empty = geo === null || geo.end === null;
  const accName = resolveSummary(summary, () =>
    empty ? strings.noData : winProbWormSummary(geo!, fmt, strings, sides, pctFmt),
  );

  if (empty) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={accName}
        id={id}
        seat={{ mode: "center", top: PAD, bottom: height - PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accent = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;
  const swing = swingMark(geo!, markSwing, FONT, fmt);
  const end = geo!.end!;

  // annotations host contract: Marker x = point index across the (gutter-shrunk)
  // plot, Threshold/TargetZone y = win probabilities on the SAME axis the worm
  // is drawn on. Reading `geo.domain` rather than restating [0, 100] is what
  // keeps a caller's `domain` from moving the worm while leaving its thresholds
  // behind on the default frame.
  const plotW = Math.max(0, width - 2 * PAD - gutter);
  const lastX = Math.max(1, data.length - 1);
  const ann = resolveAnnotations(children, {
    x: (i) => round2(PAD + (i / lastX) * plotW),
    y: scaleLinear(geo!.domain, [height - PAD, PAD]),
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
      // The worm hangs off the 50% midline — a fixed 0–100 axis whose meaning
      // is symmetric about the middle, not about its floor. Centring the frame
      // on the cap band puts that decision boundary where the eye reads it.
      seat={{ mode: "center", top: PAD, bottom: height - PAD }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      <line
        x1={PAD}
        y1={geo!.midY}
        x2={round2(width - PAD - gutter)}
        y2={geo!.midY}
        data-mc-ink="muted"
        strokeOpacity={0.7}
        strokeDasharray="2 1.5"
        data-mc-w="hair"
        vectorEffect="non-scaling-stroke"
      />
      {/* Split at 50: below muted, above accent. */}
      {[
        { d: geo!.belowD, ink: "muted", st: undefined as CSSProperties | undefined },
        { d: geo!.aboveD, ink: "accent", st: { stroke: accent } },
      ].map(({ d, ink, st }) =>
        d ? (
          <path
            key={ink}
            d={d}
            data-mc-ink={ink}
            data-mc-w="full"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={st}
          />
        ) : null,
      )}
      {geo!.crossings.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={1.8} data-mc-ink="point" />
      ))}
      {/* biggest momentum swing — hair connector + seat-gated delta */}
      {swing ? (
        <g>
          <line
            x1={swing.x}
            y1={swing.connectorY}
            x2={swing.x}
            y2={swing.yTo}
            data-mc-ink="muted"
            strokeOpacity={0.7}
            data-mc-w="hair"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={swing.x}
            y={swing.labelY}
            textAnchor="middle"
            data-mc-ink="label"
            fontSize={FONT}
          >
            {swing.text}
          </text>
        </g>
      ) : null}
      <circle
        cx={end.x}
        cy={end.y}
        r={2.2}
        data-mc-ink="point"
        style={{ fill: end.value >= 50 ? accent : "var(--mc-neutral)" }}
      />
      {lastText ? (
        <text
          x={round2(end.x + 3)}
          y={round2(clamp(end.y, FONT / 2, height - FONT / 2))}
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {lastText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
