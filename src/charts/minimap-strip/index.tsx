// <MinimapStrip> — where am I in the whole, and where in the whole is everything
// else I care about (plan/25 §10, plan/17 F10). Static, hook-free, RSC-safe.
// Content thumbnail + a viewport window + an annotation-tick lane, with fog over
// unknown regions (absence ≠ zero) and the unknown share disclosed in the name.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_MINIMAP, type MinimapStrings } from "../../core/strings-minimap.js";
import { hatchPath, minimapDomain, minimapGeometry, type MinimapInput } from "./geometry.js";

export type MinimapStripDatum = MinimapInput;

export interface MinimapStripProps {
  data: MinimapStripDatum;
  /** `"heat"` renders content as an opacity strip — calmer under text. */
  variant?: "bars" | "heat" | undefined;
  /** Dedicated tick lane vs overlaying ticks on content. */
  markLane?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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
): string {
  const span = domain[1] - domain[0] || 1;
  const viewSpan = Math.abs(data.window[1] - data.window[0]);
  const pct = `${Math.round((viewSpan / span) * 100)}%`;
  const marks = (data.marks ?? []).length;
  const unknownClause =
    unknownShare > 0.004 ? strings.minimapUnknown(`${Math.round(unknownShare * 100)}%`) : "";
  return strings.minimap(
    pct,
    fmt(data.window[0]),
    fmt(data.window[1]),
    fmt(span),
    marks,
    unknownClause,
  );
}

export function MinimapStrip(props: MinimapStripProps): ReactNode {
  const {
    data,
    variant = "bars",
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
  const domain = domainProp ?? minimapDomain(data);
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
      : (summary ?? minimapSummary(data, domain, geo.unknownShare, strings, fmt));
  const contentBottom = height - 1;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-minimap ${className}` : "mc-minimap"}
      style={style}
    >
      {/* fog-of-war over unknown regions — flat siblings, ink roles: the fog
          rects + hatch scale with `known`/domain gaps, so no per-item <g> */}
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

      {/* content thumbnail — flat siblings, ink role: up to ~60 buckets is
          this chart's SSR hot path (bench floor 8 charts/ms) */}
      {variant === "heat" ? (
        geo.buckets.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={3}
            width={b.width}
            height={contentBottom - 3}
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

      {/* annotation tick lane */}
      {geo.markX.length > 0 ? (
        <path
          d={geo.markX.map((x) => `M${round2(x)} 0.5V${markLane ? 3 : height - 1}`).join("")}
          data-mc-ink="accent"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {/* viewport window — fill+stroke combo, so a literal accent var() ref
          stays (the "accent" ink role zeroes the stroke on rects) */}
      <rect
        x={geo.windowRect.x}
        y={geo.windowRect.y}
        width={geo.windowRect.width}
        height={geo.windowRect.height}
        rx={1}
        fill="var(--mc-accent)"
        fillOpacity={0.12}
        stroke="var(--mc-accent)"
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
