"use client";
// Interactive <Waveform>. useActivePicker owns interaction: ONE pointer listener
// + nearest-bucket-by-x, ←/→ rove buckets, click / Enter / Space selects
// (onSelect). Composes the static component (canon) — the merged bar path is
// never re-implemented; the client only overlays a transient crosshair, a
// persistent pin and a readout.
import { useCallback, useMemo, useRef } from "react";
import { maxPerBucket } from "../../core/downsample.js";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_WAVEFORM } from "../../core/strings-waveform.js";
import { bucketCount, bucketX, waveformGeometry } from "./geometry.js";
import { Waveform as StaticWaveform, waveformSummary, type WaveformProps } from "./index.js";

export interface InteractiveWaveformProps extends WaveformProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the bars rise from the center
   * on first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Waveform(props: InteractiveWaveformProps): React.ReactNode {
  const {
    data,
    mode = "bars",
    mirror = true,
    domain,
    width = 120,
    height = 24,
    format,
    locale,
    strings = EN_WAVEFORM,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The bars are ONE merged path (node budget), so they can't scale per-bar.
  // `scan` reveals that path with a clip window sweeping left→right — the signal
  // scans in like a playhead — while it opens from the axis: a mirrored waveform
  // grows out of the center line, a magnitude-only one up from the baseline, and
  // the filled envelope just wipes across.
  useEntrance(hostRef, "scan", animate, {
    selector: 'path[data-mc-ink="bar"]',
    origin: mode === "envelope" ? "left" : mirror ? "center" : "bottom",
  });

  const buckets = useMemo(() => bucketCount(width, Math.max(1, data.length)), [width, data.length]);
  const geo = useMemo(
    () => waveformGeometry({ data, width, height, buckets, domain: domain ?? null, mirror }),
    [data, width, height, buckets, domain, mirror],
  );
  const bucketVals = useMemo(() => maxPerBucket(data, buckets, { abs: true }), [data, buckets]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // The painted x of a bucket — bars and the envelope sit on different pitches,
  // so every x-aware surface here reads it from geometry rather than assuming.
  const xOf = useCallback(
    (i: number) => bucketX(i, { width, buckets, mode }),
    [width, buckets, mode],
  );

  // nearest bucket by x-distance to its painted position in viewBox space —
  // never a DOM node per bucket. The navigable unit is the BUCKET; its index is
  // the bucket index (== data index when the signal renders 1 sample/bar).
  const locate = useCallback(
    (x: number) => {
      if (geo.bars.length === 0) return null;
      let best = 0;
      let bestD = Infinity;
      for (const b of geo.bars) {
        const d = Math.abs(xOf(b.index) - x);
        if (d < bestD) {
          bestD = d;
          best = b.index;
        }
      }
      return best;
    },
    [geo, xOf],
  );

  // datum index = BUCKET index; value = the bucket's peak magnitude (the encoded
  // amplitude), or `null` for an empty bucket.
  const datum = useCallback(
    (i: number) => {
      const v = bucketVals[i];
      return {
        index: i,
        value: v == null ? null : Math.abs(v),
        formatted: `${Math.round((i / Math.max(1, buckets - 1)) * 100)}% · ${fmt(v == null ? 0 : Math.abs(v))}`,
      };
    },
    [bucketVals, fmt, buckets],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.bars.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : waveformSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const shownBar = shown !== null ? geo.bars[shown] : undefined;
  const shownVal = shown !== null ? bucketVals[shown] : null;
  const pct = shownBar ? `${Math.round((shownBar.index / Math.max(1, buckets - 1)) * 100)}%` : "";
  const announced = shownBar
    ? strings.waveformAt(pct, fmt(shownVal == null ? 0 : Math.abs(shownVal)))
    : "";

  const shownX = shownBar ? xOf(shownBar.index) : 0;
  // Accent outline around the pinned bucket — persists through pointer-leave.
  // Envelope mode paints no bars, so there is no rect to outline there.
  const selBar =
    mode === "bars" && selected !== null && selected !== active ? geo.bars[selected] : undefined;

  return (
    <span ref={hostRef} {...wrap("mc-wave-live", className, style)} {...named(label)} {...bind}>
      <StaticWaveform
        {...rest}
        data={data}
        mode={mode}
        mirror={mirror}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selBar ? (
          <rect
            x={selBar.x - 0.5}
            y={selBar.y - 0.5}
            width={selBar.width + 1}
            height={Math.max(selBar.height, 0.4) + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shownBar ? (
          <line
            x1={shownX}
            x2={shownX}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticWaveform>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownBar ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(shownX, width)}>
          {`${pct} · ${fmt(shownVal == null ? 0 : Math.abs(shownVal))}`}
        </span>
      ) : null}
    </span>
  );
}
