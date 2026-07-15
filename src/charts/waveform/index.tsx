// <Waveform> — the shape of a high-frequency signal at word width: where the
// spikes and silences are. Static, hook-free, RSC-safe.
// Compressed by MAX-PER-BUCKET so a spike can never be averaged away, and
// peak-normalized honestly (the peak is disclosed in the summary).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_WAVEFORM, type WaveformStrings } from "../../core/strings-waveform.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { barsPath, bucketCount, envelopePath, waveformGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface WaveformProps {
  data: readonly Value[];
  /** 0–1 played fraction; buckets left of it tint accent (position-in-media). */
  progress?: number | undefined;
  /** `"envelope"` renders the min/max envelope as one filled area path. */
  variant?: "bars" | "envelope" | undefined;
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
): string {
  const finite = data.filter(isFiniteValue) as number[];
  if (finite.length === 0) return strings.noData;
  let peak = 0;
  let peakIdx = 0;
  finite.forEach((v, i) => {
    if (Math.abs(v) > peak) {
      peak = Math.abs(v);
      peakIdx = i;
    }
  });
  if (peak === 0) return strings.waveformSilent;
  const pct = `${Math.round((peakIdx / Math.max(1, finite.length - 1)) * 100)}%`;
  return strings.waveform(fmt(peak), pct, fmt(finite.length));
}

export function Waveform(props: WaveformProps): ReactNode {
  const {
    data,
    progress,
    variant = "bars",
    mirror = true,
    domain,
    width = 120,
    height = 24,
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

  const fmt = makeFormatter(format, locale);
  const buckets = bucketCount(width, Math.max(1, data.length));
  const geo = waveformGeometry({ data, width, height, buckets, domain: domain ?? null, mirror });
  const cy = height / 2;
  const accName = resolveSummary(summary, () => waveformSummary(data, strings, fmt));

  const hasProgress = progress != null && Number.isFinite(progress);
  const playedIdx = hasProgress ? Math.round(Math.max(0, Math.min(1, progress)) * buckets) : 0;
  const played = geo.bars.filter((b) => b.index < playedIdx);
  const rest = geo.bars.filter((b) => b.index >= playedIdx);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-wave ${className}` : "mc-wave"}
      style={style}
    >
      {/* center hairline */}
      {mirror ? (
        <line
          x1={1}
          x2={width - 1}
          y1={cy}
          y2={cy}
          stroke="var(--mc-neutral)"
          strokeOpacity={0.3}
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {variant === "envelope" ? (
        // data-mc-ink="bar" enrolls the envelope area in the rise story (the
        // inline fill still wins for color) — without it the selector matches
        // nothing and the entrance drops to the whole-svg wipe fallback.
        <path
          d={envelopePath({ data, width, height, buckets, domain: domain ?? null, mirror })}
          data-mc-ink="bar"
          style={{ fill: "var(--mc-stroke)", fillOpacity: 0.85 }}
        />
      ) : hasProgress ? (
        // Both halves of the split waveform carry "bar" ink so they rise as one
        // body (inline fills keep the played/rest coloring).
        <>
          <path
            d={barsPath(rest, mirror, cy)}
            data-mc-ink="bar"
            style={{ fill: "var(--mc-neutral)", fillOpacity: 0.45 }}
          />
          <path
            d={barsPath(played, mirror, cy)}
            data-mc-ink="bar"
            style={{ fill: "var(--mc-accent)" }}
          />
        </>
      ) : (
        <>
          <path d={geo.path} data-mc-ink="bar" />
          {geo.peak > 0 ? (
            // "bar" ink enrolls the peak in the scan reveal so it's uncovered by
            // the sweep like every other bar (inline fill keeps the accent color).
            <path
              d={barsPath([geo.bars[geo.peakIndex]!], mirror, cy)}
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
