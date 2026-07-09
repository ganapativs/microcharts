// <CitySkyline> — how groups compare on size, and how activated each is (plan/24
// #14, structured, flagship). Building HEIGHT (zero-anchored, high precision) is
// the primary read; the lit-window FRACTION is a secondary low-precision channel
// ("mostly lit / half lit / dark", not a number). No roofline/antenna/width
// variation — height, roof, and ground are constants. Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_SKYLINE, type SkylineStrings } from "../../core/strings-skyline.js";
import { makeFormatter, type Format } from "../../core/format.js";
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
  if (data.length === 0) return strings.noData;
  const fmt = makeFormatter(format, locale);
  let tall = data[0]!;
  for (const d of data) if (d.value > tall.value) tall = d;
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
    fontSize = 6,
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

  const topPad = label === "value" ? fontSize + 1 : PAD;
  const botPad = labels ? fontSize + 2 : PAD;
  const height = props.height ?? 24;
  const groundY = height - botPad;
  const geo = citySkylineGeometry({
    data,
    bw,
    height,
    groundY,
    maxH: groundY - topPad,
    gap,
    domain,
    pad: PAD,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? citySkylineSummary(data, { unit, strings, format, locale }));
  const fmt = makeFormatter(format, locale);

  return (
    <Chart
      width={geo.width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-skyline ${className}` : "mc-skyline"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {ground ? (
        <line
          x1={geo.ground.x1}
          y1={geo.ground.y}
          x2={geo.ground.x2}
          y2={geo.ground.y}
          data-mc-ink="muted"
          style={{ strokeOpacity: 0.6 }}
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
        ? geo.buildings.map((b) => (
            <text
              key={`v${b.index}`}
              x={b.x + b.w / 2}
              y={b.y - 1}
              fontSize={fontSize}
              textAnchor="middle"
              data-mc-ink="label"
            >
              {fmt(b.value)}
            </text>
          ))
        : null}
      {labels
        ? geo.buildings.map((b) => {
            const t = data[b.index]!.label;
            // drop a label that would collide with the neighbour cell (plan/18 §4)
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
      {children}
    </Chart>
  );
}
