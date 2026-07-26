// <MinimapStrip> — where am I in the whole, and where in the whole is everything
// else I care about.
// Content thumbnail + a viewport window + an annotation-tick lane, with fog over
// unknown regions (absence ≠ zero) and the unknown share disclosed in the name.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { EN_MINIMAP, type MinimapStrings } from "../../core/strings-minimap.js";
import {
  hatchPath,
  minimapDomain,
  minimapGeometry,
  minimapWindow,
  type MinimapInput,
} from "./geometry.js";
import { isFiniteValue } from "../../core/types.js";

export type MinimapStripDatum = MinimapInput;

export interface MinimapStripProps {
  data: MinimapStripDatum;
  /** `"heat"` renders content as an opacity strip — calmer under text. */
  mode?: "bars" | "heat" | undefined;
  /** Dedicated tick lane vs overlaying ticks on content. */
  markLane?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: MinimapStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — position in the whole, mark count, unknown share. */
export function minimapSummary(
  data: MinimapStripDatum,
  domain: readonly [number, number],
  unknownShare: number,
  strings: MinimapStrings,
  fmt: (n: number) => string,
  /** Percent formatter (FRACTION in) for the viewed + unknown shares. Both were
   *  hand-rolled `${Math.round(x*100)}%`, i.e. en-US percents, so `locale`
   *  localized the domain numbers beside them but not these two. */
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  // No measurable window = no position to report. Saying "viewing 0%" would be
  // a claim about a viewport that isn't there.
  const win = minimapWindow(data.window);
  if (!win) return strings.noData;
  const span = domain[1] - domain[0] || 1;
  const viewSpan = Math.abs(win[1] - win[0]);
  const viewPct = pct(viewSpan / span);
  // Count the marks that are actually placed, not the holes between them.
  const marks = (data.marks ?? []).filter(isFiniteValue).length;
  const unknownClause = unknownShare > 0.004 ? strings.minimapUnknown(pct(unknownShare)) : "";
  return strings.minimap(viewPct, fmt(win[0]), fmt(win[1]), fmt(span), marks, unknownClause);
}

export function MinimapStrip(props: MinimapStripProps): ReactNode {
  const {
    data,
    mode = "bars",
    markLane = true,
    domain: domainProp,
    width = 120,
    height = 16,
    format,
    locale,
    strings = EN_MINIMAP,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  // Position + fog shares — percents of their own, so `locale` but never `format`.
  const pctFmt = makePercentFormatter(locale);
  const domain = minimapDomain(data, domainProp);
  const geo = minimapGeometry({
    content: data.content,
    window: data.window,
    marks: data.marks ?? [],
    known: data.known ?? [],
    domain,
    width,
    height,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? minimapSummary(data, domain, geo.unknownShare, strings, fmt, pctFmt));
  const { contentTop, contentBottom } = geo;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A slider track read as one strip, with no bottom the content rises from,
      // so it centres on the cap band. The band seated is the content lane — the
      // tick lane above it is chrome for annotations, and the geometry reserves
      // it whether or not `markLane` puts anything there.
      seat={{ mode: "center", top: contentTop, bottom: contentBottom }}
      className={className ? `mc-minimap ${className}` : "mc-minimap"}
      style={style}
    >
      {/* Fog over unknown regions (flat siblings). */}
      {geo.fogRects.flatMap((f, i) => [
        <rect
          key={`fog${i}`}
          x={f.x}
          y={f.y}
          width={f.width}
          height={f.height}
          fillOpacity={0.1}
          data-mc-ink="neutral"
        />,
        <path
          key={`hatch${i}`}
          d={hatchPath(f)}
          strokeOpacity={0.4}
          data-mc-ink="muted"
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />,
      ])}

      {mode === "heat" ? (
        geo.buckets.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={contentTop}
            width={b.width}
            height={contentBottom - contentTop}
            fillOpacity={b.norm * 0.7}
            data-mc-ink="bar"
          />
        ))
      ) : geo.buckets.length > 0 ? (
        <path
          d={geo.buckets
            .map(
              (b) =>
                `M${b.x} ${round2(contentBottom - b.height)}h${b.width}v${b.height}h${-b.width}z`,
            )
            .join("")}
          data-mc-ink="bar"
        />
      ) : null}

      {geo.markX.length > 0 ? (
        <path
          d={geo.markX
            .map((x) => `M${round2(x)} 0.5V${markLane ? contentTop : contentBottom}`)
            .join("")}
          data-mc-ink="accent"
          data-mc-w="support"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {/* Viewport: literal accent stroke (ink role zeroes rect stroke).
          No window → hollow dashed frame over the whole strip. */}
      <rect
        x={geo.windowRect.x}
        y={geo.windowRect.y}
        width={geo.windowRect.width}
        height={geo.windowRect.height}
        rx={1}
        fill="var(--mc-accent)"
        fillOpacity={geo.windowKnown ? 0.12 : 0}
        stroke="var(--mc-accent)"
        strokeDasharray={geo.windowKnown ? undefined : "2 2"}
        data-mc-w="support"
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
