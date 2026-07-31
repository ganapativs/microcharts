// <Thermometer> — where a value sits on a calibrated range, and how close to a
// goal. A linear ticked tube; fill anchors at domain[0], never
// re-zeroed or log — the ticks calibrate the read. The bulb is instrument chrome
// (always full). never data.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_THERMOMETER, type ThermometerStrings } from "../../core/strings-thermometer.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";
import { thermometerGeometry, type Orientation } from "./geometry.js";

export interface ThermometerProps {
  value: number;
  /** Goal tick (the fundraising story). */
  target?: number | undefined;
  /** Tick count (even over domain) or explicit values. Default 5. */
  ticks?: number | readonly number[] | undefined;
  orientation?: Orientation | undefined;
  /** Draw the bulb reservoir (default true). */
  bulb?: boolean | undefined;
  /** Calibrated range. Default [0, 100] — a stated range, never auto-fit. */
  domain?: readonly [number, number] | undefined;
  /** Print the value numeral at the fill line. */
  label?: "none" | "value" | undefined;
  /** Override the fill/bulb color (default --mc-accent). */
  color?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ThermometerStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;
/**
 * Smallest across-the-tube box (viewBox units) that still reads as a calibrated
 * instrument: the capsule is 0.32× it, the bulb 0.64×, the side ticks run to
 * 0.82× — under 8 those are sub-pixel at any inline size. The label gutter may
 * never eat into it.
 */
const MIN_ACROSS = 8;

/**
 * The calibrated range this chart will actually draw. `domain` is a caller
 * prop; a non-finite bound is not a range, and the summary used to format it
 * straight into the accessible name ("50 on a NaN–100 scale") while the tube
 * beside it rendered a perfectly ordinary 0–100 instrument. Announced scale and
 * painted scale have to be the same scale, so both resolve through here and a
 * missing bound falls back to the documented default.
 */
export function resolveThermometerDomain(
  domain: readonly [number, number] = [0, 100],
): readonly [number, number] {
  return [isFiniteValue(domain[0]) ? domain[0] : 0, isFiniteValue(domain[1]) ? domain[1] : 100];
}

export function thermometerSummary(
  value: number,
  opts: {
    domain?: readonly [number, number] | undefined;
    target?: number | undefined;
    strings?: ThermometerStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { target, strings = EN_THERMOMETER, format, locale } = opts;
  const domain = resolveThermometerDomain(opts.domain);
  if (!isFiniteValue(value)) return strings.noData;
  const fmt = makeFormatter(format, locale);
  const [lo, hi] = [fmt(domain[0]), fmt(domain[1])];
  return isFiniteValue(target)
    ? strings.thermometerTarget(fmt(value), lo, hi, fmt(target))
    : strings.thermometer(fmt(value), lo, hi);
}

export function Thermometer(props: ThermometerProps): ReactNode {
  const {
    value,
    target,
    ticks = 5,
    orientation = "vertical",
    bulb = true,
    label = "none",
    color,
    fontSize = 8,
    format,
    locale,
    strings = EN_THERMOMETER,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const domain = resolveThermometerDomain(props.domain);
  const vertical = orientation === "vertical";
  const wantLabel = label === "value" && isFiniteValue(value);
  const valueText = wantLabel ? makeFormatter(format, locale)(value) : "";
  // The numeral sits BESIDE a vertical tube (a width gutter, sized by the text)
  // and BELOW a horizontal one (a height gutter, sized by the em — vertical room
  // is measured with the font size, never with a character count).
  const wantGutter = wantLabel
    ? vertical
      ? textGutter(valueText.length, fontSize, 2)
      : Math.ceil(fontSize * 1.25) + 1
    : 0;
  const width = props.width ?? (vertical ? 16 + wantGutter : 48);
  const height = props.height ?? (vertical ? 48 : 16 + wantGutter);
  // The tube gets what's left after the gutter — and it must stay an instrument,
  // not a sliver. Below MIN_ACROSS the capsule, its bulb and its calibration
  // ticks (all fractions of the across dimension) collapse into the squashed
  // blob this chart is accused of being, and at narrower boxes still the gutter
  // exceeds the box outright and the numeral renders at a negative x, outside
  // the viewBox. So the numeral is the thing that degrades: drop it, hand the
  // gutter back, and let the calibrated tube keep the whole box.
  const across = vertical ? width : height;
  const showLabel = wantLabel && across - wantGutter >= MIN_ACROSS;
  const gutter = showLabel ? wantGutter : 0;
  // the tube uses the base box; the gutter is reserved outside it
  const boxW = vertical ? width - gutter : width;
  const boxH = vertical ? height : height - gutter;

  const geo = thermometerGeometry({
    value,
    domain,
    target,
    ticks,
    width: boxW,
    height: boxH,
    orientation,
    bulb,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? thermometerSummary(value, { domain, target, strings, format, locale }));
  const paint = color ?? "var(--mc-accent)";

  // The numeral tracks the fill edge, so it travels with the value — and at the
  // ends of the scale a centred em-box would hang off the top of the tube (or,
  // horizontally, off the side). Clamp it into the box: a half-em nudge on a
  // tick-calibrated tube is a placement detail, and the ticks, not the numeral's
  // exact y, are what the reading is taken from.
  const half = fontSize * 0.5;
  const labelPos = showLabel
    ? vertical
      ? {
          x: boxW + 1,
          y: Math.min(Math.max(geo.fillEdge, half), height - half),
          anchor: "start" as const,
        }
      : {
          x: Math.min(
            Math.max(geo.fillEdge, textGutter(valueText.length, fontSize, 0) / 2),
            width - textGutter(valueText.length, fontSize, 0) / 2,
          ),
          y: boxH + fontSize * 0.9,
          anchor: "middle" as const,
        }
    : null;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Vertical is an upright instrument: the bulb (or the tube's low end when
      // `bulb={false}`) rests at `boxH - PAD` and the fill climbs from it, so it
      // stands on the baseline like a letter. Horizontal has no low end to rest
      // on — the tube is a band centred on `boxH / 2`, with the bulb concentric
      // to it — so it centres on the cap band instead. Either way the seat is the
      // instrument box, never the label gutter reserved outside it.
      seat={
        vertical ? { mode: "floor", bottom: boxH - PAD } : { mode: "center", top: 0, bottom: boxH }
      }
      className={className ? `mc-thermo ${className}` : "mc-thermo"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* Bulb always full; fill inline, width from role. */}
      {geo.bulb ? (
        <circle
          cx={geo.bulb.cx}
          cy={geo.bulb.cy}
          r={geo.bulb.r}
          data-mc-w="hair"
          // `accent`, NOT `fill`: the `fill` role is the TUBE's role and carries
          // `fill-opacity: 0.12` with it. An inline `fill` overrides the colour
          // and nothing else, so borrowing that role painted the bulb at 12%.
          data-mc-ink="accent"
          style={{ fill: paint, stroke: "var(--mc-neutral)" }}
        />
      ) : null}
      <rect
        x={geo.tube.x}
        y={geo.tube.y}
        width={geo.tube.width}
        height={geo.tube.height}
        rx={geo.tube.r}
        data-mc-ink="fill"
      />
      {geo.fill.width > 0.1 && geo.fill.height > 0.1 ? (
        <rect
          x={geo.fill.x}
          y={geo.fill.y}
          width={geo.fill.width}
          height={geo.fill.height}
          rx={geo.fill.r}
          // The mercury is painted by an inline fill, which used to mean it
          // carried no role at all — and a mark with no role is invisible to
          // every rule keyed on one, including the data-change transition.
          //
          // `accent`, not the `fill` role the tube above uses: that role exists
          // to paint the empty tube and carries `fill-opacity: 0.12`. An inline
          // `fill` overrides the COLOUR and not the opacity, so the mercury
          // rendered at 12% and the thermometer read as empty. A role is only
          // inert when the inline style covers every property it sets.
          data-mc-ink="accent"
          style={{ fill: paint }}
        />
      ) : null}
      <rect
        x={geo.tube.x}
        y={geo.tube.y}
        width={geo.tube.width}
        height={geo.tube.height}
        rx={geo.tube.r}
        data-mc-ink="muted"
        style={{ strokeOpacity: 0.55, fill: "none" }}
      />
      {geo.tickLines.length ? (
        <path
          d={geo.tickLines.map((t) => `M${t.x1} ${t.y1}L${t.x2} ${t.y2}`).join("")}
          data-mc-ink="muted"
          style={{ strokeOpacity: 0.7 }}
        />
      ) : null}
      {/* Target tick: flag role + literal width (between outline and data ink). */}
      {geo.targetTick ? (
        <line
          x1={geo.targetTick.x1}
          y1={geo.targetTick.y1}
          x2={geo.targetTick.x2}
          y2={geo.targetTick.y2}
          data-mc-ink="flag"
          style={{ strokeWidth: 1.25 }}
        />
      ) : null}
      {labelPos ? (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor={labelPos.anchor}
          data-mc-ink="label"
        >
          {valueText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
