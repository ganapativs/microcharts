// <CitySkyline> — how groups compare on size, and how activated each is
// (structured, flagship). Building HEIGHT (zero-anchored, high precision) is
// the primary read; the lit-window FRACTION is a secondary low-precision channel
// ("mostly lit / half lit / dark", not a number). No roofline/antenna/width
// variation — height, roof, and ground are constants.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { EN_SKYLINE, type SkylineStrings } from "../../core/strings-skyline.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { isFiniteValue } from "../../core/types.js";
import { citySkylineGeometry } from "./geometry.js";

export interface SkylineDatum {
  label: string;
  value: number;
  /** Lit fraction 0–1 (windows). Omit everywhere → a plain bar row. */
  lit?: number | undefined;
}

export interface CitySkylineProps {
  data: readonly SkylineDatum[];
  /** Category labels under the buildings (default off). */
  labels?: boolean | undefined;
  /** The ground baseline hairline (default true). */
  ground?: boolean | undefined;
  /** `value` prints the numeral above each building. */
  label?: "none" | "value" | undefined;
  domain?: readonly [number, number] | undefined;
  unit?: string | undefined;
  bw?: number | undefined;
  gap?: number | undefined;
  height?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: SkylineStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function citySkylineSummary(
  data: readonly SkylineDatum[],
  opts: {
    unit?: string | undefined;
    strings?: SkylineStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { unit = "groups", strings = EN_SKYLINE, format, locale } = opts;
  // A group with no value has no building, so it can never be the tallest; with
  // none measured there is no skyline to describe. The count still names every
  // group — each keeps its slot on the ground line.
  let tall: SkylineDatum | null = null;
  for (const d of data) {
    if (!isFiniteValue(d.value)) continue;
    if (tall === null || d.value > tall.value) tall = d;
  }
  if (tall === null) return strings.noData;
  const fmt = makeFormatter(format, locale);
  return strings.citySkyline(data.length, unit, tall.label, fmt(tall.value));
}

export function CitySkyline(props: CitySkylineProps): ReactNode {
  const {
    data,
    labels = false,
    ground = true,
    label = "none",
    domain,
    unit = "groups",
    bw = 9,
    gap = 3,
    format,
    locale,
    strings = EN_SKYLINE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const height = props.height ?? 24;
  const fontSize = props.fontSize ?? labelFont(height, 0.3);
  const topPad = label === "value" ? fontSize + 2 : PAD;
  // Labels sit BELOW the ground line with a fixed ~4px of air — hugging the
  // baseline made them read as part of the skyline. A constant gap (not em-scaled)
  // keeps the buildings tall even when the label font is large.
  const botPad = labels ? fontSize + 4 : PAD;
  const groundY = height - botPad;
  const maxH = groundY - topPad;
  const geo = citySkylineGeometry({
    data,
    bw,
    height,
    groundY,
    maxH,
    gap,
    domain,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? citySkylineSummary(data, { unit, strings, format, locale }));
  const fmt = makeFormatter(format, locale);

  // annotations host: Marker x = building index (bar center),
  // Threshold/TargetZone y = data values on the shared zero-anchored scale
  // (mirror of the geometry: y(v) = groundY − (v / maxV) · maxH).
  const skylineValues = data.map((d) => (Number.isFinite(d.value) && d.value > 0 ? d.value : 0));
  const maxV = domain ? domain[1] : Math.max(1, ...skylineValues);
  const ann = resolveAnnotations(children, {
    x: (i) => {
      const b = geo.buildings[Math.round(i)];
      return b ? b.x + b.w / 2 : NaN;
    },
    y: scaleLinear([0, maxV], [groundY, groundY - maxH]),
    width: geo.width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={geo.width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Buildings stand on the ground line, so that — not the viewBox edge — is
      // the floor: `labels` opens a gutter below the ground for the category
      // text, and seating the box bottom would push the whole skyline up by it.
      seat={{ mode: "floor", bottom: groundY }}
      className={className ? `mc-skyline ${className}` : "mc-skyline"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {ann.under}
      {ground ? (
        <line
          x1={geo.ground.x1}
          y1={geo.ground.y}
          x2={geo.ground.x2}
          y2={geo.ground.y}
          data-mc-ink="muted"
          strokeOpacity={0.6}
        />
      ) : null}
      {geo.buildings.map((b) =>
        b.h <= 0 ? null : (
          <rect
            key={`b${b.index}`}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            shapeRendering="crispEdges"
            data-mc-ink="bar"
          />
        ),
      )}
      {geo.buildings.map((b) =>
        b.windowsPath ? (
          <path
            key={`w${b.index}`}
            d={b.windowsPath}
            data-mc-ink="accent"
            shapeRendering="crispEdges"
          />
        ) : null,
      )}
      {label === "value"
        ? // The geometry floors an unmeasured group to a zero-height building so
          // the row keeps its slot; printing that 0 would state a measurement
          // nobody made, so the numeral is omitted instead (empty ≠ zero).
          geo.buildings.map((b) =>
            isFiniteValue(data[b.index]?.value) ? (
              <text
                key={`v${b.index}`}
                x={b.x + b.w / 2}
                y={b.y - 2}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {fmt(b.value)}
              </text>
            ) : null,
          )
        : null}
      {labels
        ? geo.buildings.map((b) => {
            const t = data[b.index]!.label;
            // drop a label that would collide with the neighbour cell
            if (t.length * 0.62 * fontSize > bw + gap - 1) return null;
            return (
              <text
                key={`l${b.index}`}
                x={b.x + b.w / 2}
                y={height - fontSize * 0.32}
                fontSize={fontSize}
                textAnchor="middle"
                data-mc-ink="label"
              >
                {t}
              </text>
            );
          })
        : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
