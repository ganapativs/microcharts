"use client";
// Interactive <Waveform> (plan/25 §4). One pointer listener; bucket by x lookup.
// Hover shows the bucket peak + crosshair; ←/→ rove buckets. Composes the static
// component (canon). onPointFocus supports scrub-to-seek recipes.
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { maxPerBucket } from "../../core/downsample.js";
import { makeFormatter } from "../../core/format.js";
import { EN_WAVEFORM } from "../../core/strings-waveform.js";
import { bucketCount, waveformGeometry } from "./geometry.js";
import { Waveform as StaticWaveform, waveformSummary, type WaveformProps } from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveWaveformProps extends WaveformProps {
  onPointFocus?: (index: number, fraction: number) => void;
}

export function Waveform(props: InteractiveWaveformProps): React.ReactNode {
  const {
    data,
    mirror = true,
    domain,
    width = 120,
    height = 24,
    format,
    locale,
    strings = EN_WAVEFORM,
    title,
    summary,
    onPointFocus,
    ...rest
  } = props;

  const buckets = useMemo(() => bucketCount(width, Math.max(1, data.length)), [width, data.length]);
  const geo = useMemo(
    () => waveformGeometry({ data, width, height, buckets, domain: domain ?? null, mirror }),
    [data, width, height, buckets, domain, mirror],
  );
  const bucketVals = useMemo(() => maxPerBucket(data, buckets, { abs: true }), [data, buckets]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : waveformSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const move = useCallback(
    (i: number | null) => {
      setActive(i);
      if (i != null) onPointFocus?.(i, buckets > 1 ? i / (buckets - 1) : 0);
    },
    [onPointFocus, buckets],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.bars.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestD = Infinity;
      for (const b of geo.bars) {
        const c = b.x + b.width / 2;
        const d = Math.abs(c - x);
        if (d < bestD) {
          bestD = d;
          best = b.index;
        }
      }
      move(best);
    },
    [geo, width, move],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.bars.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.bars.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.bars.length - 1;
          break;
        case "Escape":
          move(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      move(next);
    },
    [active, geo, move],
  );

  const bar = active != null ? geo.bars[active] : undefined;
  const rawVal = active != null ? bucketVals[active] : null;
  const pct = bar ? `${Math.round((bar.index / Math.max(1, buckets - 1)) * 100)}%` : "";
  const announced = bar ? strings.waveformAt(pct, fmt(rawVal == null ? 0 : Math.abs(rawVal))) : "";

  return (
    <span
      className="mc-wave-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => move(null)}
      onKeyDown={onKeyDown}
      onBlur={() => move(null)}
    >
      <StaticWaveform
        {...rest}
        data={data}
        mirror={mirror}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {bar ? (
          <line
            x1={bar.x + bar.width / 2}
            x2={bar.x + bar.width / 2}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticWaveform>
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
      {bar ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((bar.x + bar.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${pct} · ${fmt(rawVal == null ? 0 : Math.abs(rawVal))}`}
        </span>
      ) : null}
    </span>
  );
}
