// <Waveform> — the shape of a high-frequency signal at word width: where the
// spikes and silences are.
// Compressed by MAX-PER-BUCKET so a spike can never be averaged away, and
// peak-normalized honestly (the peak is disclosed in the summary).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, makePercentFormatter, type Format } from "../../core/format.js";
import { EN_WAVEFORM, type WaveformStrings } from "../../core/strings-waveform.js";
import { chartSide, isFiniteValue, type Value } from "../../core/types.js";
import {
  barsPath,
  bucketCount,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  envelopePath,
  waveformGeometry,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface WaveformProps {
  data: readonly Value[];
  /** 0–1 played fraction; buckets left of it tint accent (position-in-media). */
  progress?: number | undefined;
  /** `"envelope"` renders the min/max envelope as one filled area path. */
  mode?: "bars" | "envelope" | undefined;
  /** Mirror around the center (default); `false` for magnitude-only series. */
  mirror?: boolean | undefined;
  /** Explicit symmetric domain for HONEST loudness comparison across rows. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: WaveformStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the peak and where it falls, plus the sample count. */
export function waveformSummary(
  data: readonly Value[],
  strings: WaveformStrings,
  fmt: (n: number) => string,
  /** Percent formatter (FRACTION in) for "how far through". A position in the
   *  signal, not an amplitude, so it takes `locale` but never `format`. */
  posFmt: (fraction: number) => string = makePercentFormatter(undefined),
  /** Sample COUNT — a tally, not an amplitude, so it never takes `format`
   *  (a `format` of `{ style: "percent" }` announced "4,000% samples"). */
  cntFmt: (n: number) => string = makeFormatter(undefined, undefined),
): string {
  // Walked over the RAW indices, not a compacted copy: peak position is read
  // off the same index space the buckets are cut from, so a clip whose first
  // half is nulls no longer announces its spike at half the x it paints it at.
  let peak = 0;
  let peakIdx = 0;
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    if (!isFiniteValue(v)) continue;
    count++;
    if (Math.abs(v) > peak) {
      peak = Math.abs(v);
      peakIdx = i;
    }
  }
  if (count === 0) return strings.noData;
  if (peak === 0) return strings.waveformSilent;
  const pct = posFmt(peakIdx / Math.max(1, data.length - 1));
  return strings.waveform(fmt(peak), pct, cntFmt(count));
}

export function Waveform(props: WaveformProps): ReactNode {
  const {
    data,
    progress,
    mode = "bars",
    mirror = true,
    domain,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_WAVEFORM,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The box drives geometry, the hairline and the inline seat, none of which
  // `Chart`'s own clamp reaches: a NaN width shipped `x2="NaN"` and a NaN height
  // shipped `V NaN` bars plus `--mc-seat: NaN` inside a valid viewBox.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const fmt = makeFormatter(format, locale);
  // Position through the signal — a percent of its own, so `locale`, never `format`.
  const posFmt = makePercentFormatter(locale);
  // …and the sample tally, likewise localised but never in the signal's units.
  const cntFmt = makeFormatter(undefined, locale);
  const buckets = bucketCount(width, Math.max(1, data.length));
  const geo = waveformGeometry({ data, width, height, buckets, domain: domain ?? null, mirror });
  const cy = height / 2;
  const accName = resolveSummary(summary, () =>
    waveformSummary(data, strings, fmt, posFmt, cntFmt),
  );

  const hasProgress = progress != null && Number.isFinite(progress);
  const playedIdx = hasProgress ? Math.round(Math.max(0, Math.min(1, progress)) * buckets) : 0;
  let played = geo.bars;
  let rest = geo.bars;
  if (hasProgress) {
    played = [];
    rest = [];
    for (const b of geo.bars) (b.index < playedIdx ? played : rest).push(b);
  }

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // `mirror` decides the seat: mirrored bars straddle the hairline with no
      // floor, so the band centres on the cap band like a glyph; unmirrored,
      // amplitude grows from y1 as a real zero floor and stands on the baseline.
      seat={
        mirror ? { mode: "center", top: geo.y0, bottom: geo.y1 } : { mode: "floor", bottom: geo.y1 }
      }
      className={className ? `mc-wave ${className}` : "mc-wave"}
      style={style}
    >
      {mirror ? (
        // An ink ROLE, not a literal `stroke`: `.mc-root` sets
        // forced-color-adjust: none, so `var(--mc-neutral)` — a fixed warm gray
        // — painted verbatim over the user's own High Contrast background. The
        // role resolves to the same token here and to GrayText there.
        <line
          x1={1}
          x2={width - 1}
          y1={cy}
          y2={cy}
          data-mc-ink="muted"
          strokeOpacity={0.3}
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {mode === "envelope" ? (
        // data-mc-ink="bar" enrolls the envelope area in the scan story —
        // without it the selector matches nothing and the entrance drops to the
        // whole-svg wipe fallback. It also carries the fill: the inline
        // `var(--mc-stroke)` this used to set was the same paint, but inline
        // beats both the `:where()` consumer-override contract and the
        // forced-colors mapping, so the envelope kept a theme ink in High
        // Contrast Mode. Only the opacity stays on the mark.
        <path
          d={envelopePath({ data, width, height, buckets, domain: domain ?? null, mirror })}
          data-mc-ink="bar"
          fillOpacity={0.85}
        />
      ) : hasProgress ? (
        // The unplayed remainder is an OFF state, so it takes the `neutral` fill
        // role rather than an inline `var(--mc-neutral)`: the same warm gray
        // here, GrayText under forced-colors. Inline, it survived High Contrast
        // Mode as a 45%-opacity fixed gray and the whole unplayed stretch — most
        // of the clip early on — went invisible. The played half keeps its
        // inline accent (the house pattern; `--mc-accent` is itself remapped to
        // Highlight there), and both halves stay in the scan selector.
        <>
          <path d={barsPath(rest)} data-mc-ink="neutral" fillOpacity={0.45} />
          <path d={barsPath(played)} data-mc-ink="bar" style={{ fill: "var(--mc-accent)" }} />
        </>
      ) : (
        <>
          <path d={geo.path} data-mc-ink="bar" />
          {geo.peak > 0 ? (
            // "bar" ink enrolls the peak in the scan reveal so it's uncovered by
            // the sweep like every other bar (inline fill keeps the accent color).
            <path
              d={barsPath([geo.bars[geo.peakIndex]!])}
              data-mc-ink="bar"
              style={{ fill: "var(--mc-accent)" }}
            />
          ) : null}
        </>
      )}
      {children}
    </Chart>
  );
}
