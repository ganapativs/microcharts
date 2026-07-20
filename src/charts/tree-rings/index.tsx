// <TreeRings> — how growth accumulated, period over period (S1, flagship).
// Radial ring THICKNESS ∝ per-period value, oldest at the centre. The
// channel is thickness, never area (equal thickness at a larger radius spans more
// area — the ring illusion). Static, hook-free, RSC-safe.
//
// NOTE: the spec named the render variant `style`, but every chart
// exposes `style?: CSSProperties`; the knob ships as `rings` here to keep it.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_TREE, type TreeStrings } from "../../core/strings-tree.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { isFiniteValue } from "../../core/types.js";
import { ringAnnulus, ringOutline, treeRingsGeometry } from "./geometry.js";

export interface TreeRingsProps {
  data: readonly number[];
  /** Which period's ring to pick out: `last` (default), `none`, or an index. */
  highlight?: "last" | "none" | number | undefined;
  /** Expected lifetime Σ — the disc fills only Σdata/total of the radius. */
  total?: number | undefined;
  /** `stroke` boundary rings (default) or `fill` alternating annuli. */
  rings?: "stroke" | "fill" | undefined;
  /** Print the latest period's value at the outer edge. */
  label?: "none" | "last" | undefined;
  /** Singular period noun for the summary (default "period"). */
  periodWord?: string | undefined;
  /** Plural period noun (default "periods"). */
  unit?: string | undefined;
  color?: string | undefined;
  size?: number | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: TreeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

/**
 * The static's viewBox width: the disc plus the right gutter the `label="last"`
 * readout sits in. Exported because the interactive entry must scale pointer x
 * by this same total — using bare `size` compresses the pointer space and
 * mis-resolves the radial ring lookup around the disc's centre.
 */
export function treeRingsWidth(opts: {
  data: readonly number[];
  size: number;
  label: "none" | "last";
  fontSize?: number | undefined;
  fmt: (n: number) => string;
}): number {
  const last = opts.data[opts.data.length - 1];
  if (opts.label !== "last" || !isFiniteValue(last)) return opts.size;
  const font = opts.fontSize ?? labelFont(opts.size);
  return opts.size + Math.ceil(`${opts.fmt(last)}`.length * 0.62 * font + 5);
}

export function treeRingsSummary(
  data: readonly number[],
  opts: {
    unit?: string | undefined;
    periodWord?: string | undefined;
    strings?: TreeStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { unit = "periods", periodWord = "period", strings = EN_TREE, format, locale } = opts;
  const fmt = makeFormatter(format, locale);
  // A period with no value grows no ring, so it is neither the latest nor the
  // biggest. "Latest" is the last MEASURED period — the same reading
  // `seriesStats.last` gives every series chart. No finite period → `noData`.
  let maxI = -1;
  let lastI = -1;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (!isFiniteValue(v)) continue;
    lastI = i;
    if (maxI < 0 || v > data[maxI]!) maxI = i;
  }
  if (maxI < 0 || lastI < 0) return strings.noData;
  return strings.treeRings(
    data.length,
    unit,
    fmt(data[lastI]!),
    fmt(data[maxI]!),
    `${periodWord} ${maxI + 1}`,
  );
}

export function TreeRings(props: TreeRingsProps): ReactNode {
  const {
    data,
    highlight = "last",
    total,
    rings = "stroke",
    label = "none",
    periodWord = "period",
    unit = "periods",
    color,
    size = 24,
    format,
    locale,
    strings = EN_TREE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;
  const fontSize = props.fontSize ?? labelFont(size);

  const geo = treeRingsGeometry({ values: data, size, pad: PAD, total });
  const accIdx = highlight === "last" ? data.length - 1 : highlight === "none" ? -1 : highlight;
  const accName =
    summary === false
      ? false
      : (summary ?? treeRingsSummary(data, { unit, periodWord, strings, format, locale }));
  const paint = color ?? "var(--mc-accent)";
  const fmt = makeFormatter(format, locale);
  const last = data[data.length - 1];
  // the last-value label sits in a gutter to the RIGHT of the disc (over the
  // concentric rings it would collide), so it needs a wider viewBox
  const showLabel = label === "last" && isFiniteValue(last);
  const gutter = treeRingsWidth({ data, size, label, fontSize, fmt }) - size;

  // SSR hot path (rings="stroke", the default): up to 24 boundary circles all
  // share the same muted style, so they merge into one path — one node instead
  // of N. The highlighted ring alone keeps its own element (distinct color/weight).
  const accentRing = geo.rings.find((r) => r.index === accIdx && r.rOuter > r.rInner);
  const mutedRingsPath = geo.rings
    .filter((r) => r.rOuter > r.rInner && r.index !== accIdx)
    .map((r) => ringOutline(geo.center.cx, geo.center.cy, r.rOuter))
    .join("");

  return (
    <Chart
      width={size + gutter}
      height={size}
      title={title}
      summary={accName}
      id={id}
      // Concentric rings about one centre — symmetric, no floor — so the disc
      // centres on the cap band. `maxR` is the outermost radius the disc may
      // ever reach, so the seat holds however few periods the data fills.
      seat={{
        mode: "center",
        top: geo.center.cy - geo.maxR,
        bottom: geo.center.cy + geo.maxR,
      }}
      className={className ? `mc-tree ${className}` : "mc-tree"}
      style={{ "--mc-label-size": `${fontSize}px`, ...style } as CSSProperties}
    >
      {rings === "fill"
        ? geo.rings.map((r) =>
            r.rOuter <= r.rInner ? null : (
              <path
                key={`f${r.index}`}
                d={ringAnnulus(geo.center.cx, geo.center.cy, r.rOuter, r.rInner)}
                fillRule="evenodd"
                style={{
                  fill: r.index === accIdx ? paint : "var(--mc-stroke)",
                  fillOpacity: r.index === accIdx ? 0.9 : r.index % 2 === 0 ? 0.22 : 0.4,
                }}
              />
            ),
          )
        : [
            mutedRingsPath ? (
              <path
                key="rings"
                d={mutedRingsPath}
                fill="none"
                data-mc-ink="muted"
                style={{ strokeOpacity: 0.55 }}
              />
            ) : null,
            accentRing ? (
              <circle
                key="accent"
                cx={geo.center.cx}
                cy={geo.center.cy}
                r={accentRing.rOuter}
                fill="none"
                style={{ stroke: paint, strokeWidth: "calc(var(--mc-stroke-width) * 1.5)" }}
              />
            ) : null,
          ]}
      <circle cx={geo.center.cx} cy={geo.center.cy} r={geo.r0 * 0.5} data-mc-ink="point" />
      {showLabel ? (
        <text
          x={size + 4}
          y={size / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="label"
        >
          {fmt(last as number)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
