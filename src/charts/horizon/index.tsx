// <Horizon> — a wide-range series inside a 14-px row. The
// canonical micro-density technique and this batch's flagship: folded opacity
// bands, positive in accent, negative in the negative token, mirrored by
// default. Fold count/mode never auto-switch (same series must render
// identically across rows). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { describeSeries, type SeriesStrings, resolveSummary } from "../../core/summary.js";
import { makeFormatter, type Format } from "../../core/format.js";
import type { Value } from "../../core/types.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { horizonGeometry } from "./geometry.js";

export interface HorizonProps {
  data: readonly Value[];
  /** Band count — 3 only when the range genuinely spans it (docs rule). */
  folds?: 2 | 3 | undefined;
  /** `"mirror"` flips negatives upward (denser); `"offset"` keeps up/down. */
  mode?: "mirror" | "offset" | undefined;
  /** Fold origin (e.g. a target level) — authored, never inferred. */
  baseline?: number | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: SeriesStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Horizon(props: HorizonProps): ReactNode {
  const {
    data,
    folds = 2,
    mode = "mirror",
    baseline = 0,
    domain,
    width = 80,
    height = 14,
    color,
    format,
    locale,
    strings,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = horizonGeometry({ width, height, values: data, domain, baseline, folds, mode });
  const fmt = makeFormatter(format, locale);
  // values are ordinary S1 data; folding is presentation, so the summary reads
  // the unfolded series.
  const accName = resolveSummary(summary, () => describeSeries(data, { format: fmt, strings }));

  const ann = children
    ? resolveAnnotations(children, {
        x: geo.xFor,
        y: geo.foldedY,
        width,
        height,
        fontSize: annotationFontSize(height),
      })
    : { under: null, over: null, rest: null };

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The fold origin moves with `mode`, and so does the seat: mirror sends
      // both signs upward from the strip bottom, which is a real floor to stand
      // on the baseline; offset hangs negatives below the midline, so the band
      // is symmetric with no floor and centres on the cap band instead.
      seat={
        mode === "offset"
          ? { mode: "center", top: geo.y0, bottom: geo.y1 }
          : { mode: "floor", bottom: geo.y1 }
      }
      className={className ? `mc-horizon ${className}` : "mc-horizon"}
      style={style}
    >
      {ann.under}
      {geo.bands.map((band, i) => {
        const positive = band.sign > 0;
        return (
          <path
            key={i}
            d={band.d}
            data-mc-ink={positive && color ? undefined : positive ? "accent" : "negative"}
            style={{
              fill: positive ? color : undefined,
              fillOpacity: geo.opacities[band.fold - 1],
            }}
          />
        );
      })}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
