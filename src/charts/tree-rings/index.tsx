// <TreeRings> — how growth accumulated, period over period (S1, flagship).
// Radial ring THICKNESS ∝ per-period value, oldest at the centre. The
// channel is thickness, never area (equal thickness at a larger radius spans more
// area — the ring illusion).
// NOTE: the spec named the render variant `style`, but every chart
// exposes `style?: CSSProperties`; the knob ships as `rings` here to keep it.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_TREE, type TreeStrings } from "../../core/strings-tree.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { isFiniteValue } from "../../core/types.js";
import {
  ringAnnulus,
  ringOutline,
  treeRingsGeometry,
  treeRingsSize,
  TREE_PAD,
} from "./geometry.js";

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

/**
 * Label size, resolved once. A non-finite `fontSize` reached the gutter
 * arithmetic as NaN, so `Chart` clamped the viewBox to 1 unit wide while the
 * disc still painted out to `size` — the entire chart outside its own box —
 * and shipped `--mc-label-size: NaNpx` with it.
 */
function treeRingsFont(box: number, fontSize: number | undefined): number {
  return isFiniteValue(fontSize) && fontSize > 0 ? fontSize : labelFont(box);
}

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
  const box = treeRingsSize(opts.size);
  const last = opts.data[opts.data.length - 1];
  if (opts.label !== "last" || !isFiniteValue(last)) return box;
  const font = treeRingsFont(box, opts.fontSize);
  return box + Math.ceil(`${opts.fmt(last)}`.length * 0.62 * font + 5);
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
    // trimmed so `periodWord=""` reads "biggest 22 in 5", not "in  5"
    `${periodWord} ${maxI + 1}`.trim(),
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
    size,
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
  const box = treeRingsSize(size);
  const fontSize = treeRingsFont(box, props.fontSize);

  const geo = treeRingsGeometry({ values: data, size: box, pad: TREE_PAD, total });
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
  const gutter = treeRingsWidth({ data, size: box, label, fontSize, fmt }) - box;

  // SSR hot path, one pass for both variants: the muted rings all share their
  // paint, so they merge into O(1) nodes instead of N. `stroke` (the default)
  // merges every boundary into one outline path. `fill` merges each opacity
  // parity into one evenodd path — the rings are disjoint and concentric, so a
  // group listed as nested circles alternates filled/hollow exactly as the
  // separate annuli did. The highlighted ring alone keeps its own element
  // (distinct color and weight).
  const accentRing = geo.rings.find((r) => r.index === accIdx && r.rOuter > r.rInner);
  const filled = rings === "fill";
  let mutedOutline = "";
  const mutedFill = ["", ""];
  for (const r of geo.rings) {
    if (r.rOuter <= r.rInner || r.index === accIdx) continue;
    if (filled)
      mutedFill[r.index % 2] += ringAnnulus(geo.center.cx, geo.center.cy, r.rOuter, r.rInner);
    else mutedOutline += ringOutline(geo.center.cx, geo.center.cy, r.rOuter);
  }

  return (
    <Chart
      width={box + gutter}
      height={box}
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
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {filled
        ? [
            // The neutral fill lives in the `fill` ink role, not inline:
            // `.mc-root` sets `forced-color-adjust: none`, so an inline
            // `var(--mc-stroke)` at 22% survived verbatim into High Contrast
            // Mode and vanished against the user's chosen background. The
            // alternating opacity stays inline — it is what keeps neighbouring
            // rings apart, and it overrides the role's flat one in both modes.
            mutedFill[0] ? (
              <path
                key="f0"
                d={mutedFill[0]}
                fillRule="evenodd"
                data-mc-ink="fill"
                style={{ fillOpacity: 0.22 }}
              />
            ) : null,
            mutedFill[1] ? (
              <path
                key="f1"
                d={mutedFill[1]}
                fillRule="evenodd"
                data-mc-ink="fill"
                style={{ fillOpacity: 0.4 }}
              />
            ) : null,
            accentRing ? (
              <path
                key="fa"
                d={ringAnnulus(geo.center.cx, geo.center.cy, accentRing.rOuter, accentRing.rInner)}
                fillRule="evenodd"
                style={{ fill: paint, fillOpacity: 0.9 }}
              />
            ) : null,
          ]
        : [
            mutedOutline ? (
              <path
                key="rings"
                d={mutedOutline}
                fill="none"
                data-mc-ink="muted"
                // the boundaries ARE the primary mark; a width role keeps them
                // on --mc-density instead of the UA's fixed 1
                data-mc-w="support"
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
                // `data`, not `accent`: on a <circle> the accent role fills, and
                // this ring is stroked. The role's own stroke and width both lose
                // to the inline style, so it changes nothing here and makes the
                // ring reachable by every role-keyed rule.
                data-mc-ink="data"
                style={{ stroke: paint, strokeWidth: "calc(var(--mc-sw) * 1.5)" }}
              />
            ) : null,
          ]}
      <circle cx={geo.center.cx} cy={geo.center.cy} r={geo.r0 * 0.5} data-mc-ink="point" />
      {showLabel ? (
        <text
          x={box + 4}
          y={box / 2}
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
