"use client";
// Interactive <Waveform>. useActivePicker owns interaction: ONE pointer listener
// + nearest-bucket-by-x, ←/→ rove buckets, click / Enter / Space selects
// (onSelect). The bars stay the static entry's merged path; the client only
// overlays a transient crosshair, a persistent pin and a readout.
import { useCallback, useMemo, useRef } from "react";
import { maxPerBucket } from "../../core/downsample.js";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
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
import { chartSide } from "../../core/types.js";
import {
  bucketCount,
  bucketX,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  waveformGeometry,
} from "./geometry.js";
import { Waveform as StaticWaveform, waveformSummary, type WaveformProps } from "./index.js";

export interface InteractiveWaveformProps extends WaveformProps, PickerProps {
  /**
   * Opt-in entrance motion (default `false`): the signal SCANS in on first
   * client-side mount — a clip window sweeps left to right like a playhead,
   * opening from the axis the waveform hangs off (the center line when
   * `mirror`, the baseline without it, straight across for `mode="envelope"`).
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
}

export function Waveform(props: InteractiveWaveformProps): React.ReactNode {
  const {
    data,
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

  // Same clamp the static entry applies, for the same reason and so the two
  // agree: this entry computes its OWN buckets and geometry for the pointer map,
  // and a non-finite box would put the overlay somewhere the composed static
  // never drew.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

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
  // Position through the clip — a percentage of its own, so it takes the locale
  // but never the amplitude `format` (which carries the signal's units).
  const posFmt = useMemo(() => makePercentFormatter(locale), [locale]);

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
        formatted: `${posFmt(i / Math.max(1, buckets - 1))} · ${v == null ? "—" : fmt(Math.abs(v))}`,
      };
    },
    [bucketVals, fmt, posFmt, buckets],
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
        : waveformSummary(data, strings, fmt, posFmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const shownBar = shown !== null ? geo.bars[shown] : undefined;
  const shownVal = shown !== null ? bucketVals[shown] : null;
  const pct = shownBar ? posFmt(shownBar.index / Math.max(1, buckets - 1)) : "";
  // An EMPTY bucket is not a silent one: `null` used to be formatted as 0, which
  // reads as "measured, amplitude zero". Magnitude is what the mirrored envelope
  // encodes, so |v| is the honest figure for a bucket that does have a sample.
  const shownAmp = shownVal == null ? "—" : fmt(Math.abs(shownVal));
  const announced = shownBar ? strings.waveformAt(pct, shownAmp) : "";

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
            data-mc-active=""
            // NOT `data-mc-ui`, twice over: this outline hugs the bucket's bar,
            // so its `y` and `height` are the envelope amplitude — a value, not
            // a pointer position — and it names one discrete bucket, which a box
            // in transit would not enclose. Placed by geometry attributes rather
            // than a transform, which is what makes it snap.
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* The crosshair tracks a continuum, so unlike the bucket outline above
            it TRAVELS to the position it names. Carried on a transform because
            `x1`/`x2` have no CSS geometry property in any engine. */}
        {shownBar ? (
          <line
            x1={0}
            x2={0}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-ui=""
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            style={{ transform: `translateX(${shownX}px)` }}
          />
        ) : null}
        {rest.children}
      </StaticWaveform>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownBar ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(shownX, width)}>
          {`${pct} · ${shownAmp}`}
        </span>
      ) : null}
    </span>
  );
}
