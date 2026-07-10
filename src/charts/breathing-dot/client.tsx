"use client";
// Interactive <BreathingDot> (plan/24 #19). Motion IS the encoding: the core dot
// pulses, its rate + amplitude snapped to the 3 load bands (calm / elevated /
// strained) so the motion states are nameable, not vibes. The loop is allowed
// because the loop parameter (rate) is the datum (plan/06 §5). Gated on BOTH
// reduced-motion (→ the static frame) and on-screen (→ paused off-viewport).
// Composes the static component (canon); a polite live region announces BAND
// changes only, never per tick.
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { EN_BREATHING_DOT, type BreathingDotStrings } from "../../core/strings-breathing-dot.js";
import { breathingDotGeometry } from "./geometry.js";
import {
  BreathingDot as StaticBreathingDot,
  breathingDotSummary,
  type BreathingDotProps,
} from "./index.js";

export interface InteractiveBreathingDotProps extends BreathingDotProps {
  strings?: BreathingDotStrings;
}

// Per-band pulse parameters (snapped, so the motion is re-readable).
const PERIOD_MS = [3600, 1800, 900] as const; // calm → strained: faster
const AMPLITUDE = [0.05, 0.11, 0.18] as const; // calm → strained: larger

export function BreathingDot(props: InteractiveBreathingDotProps): React.ReactNode {
  const {
    value,
    thresholds = [0.5, 0.8],
    size = 16,
    format,
    locale,
    strings = EN_BREATHING_DOT,
    title,
    summary,
    ...rest
  } = props;

  const geo = breathingDotGeometry({ value, size, thresholds, pad: 1 });
  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const [announced, setAnnounced] = useState("");
  const prevBand = useRef<number | null>(null);
  const mounted = useRef(false);
  const animRef = useRef<Animation | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : breathingDotSummary(value, { thresholds, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Announce on band change only (never per frame); quiet on mount.
  useEffect(() => {
    const nextBand = geo.unknown ? -1 : geo.band;
    if (!mounted.current) {
      mounted.current = true;
      prevBand.current = nextBand;
      return;
    }
    if (prevBand.current === nextBand) return;
    prevBand.current = nextBand;
    setAnnounced(
      geo.unknown
        ? strings.breathingDotUnknown
        : breathingDotSummary(value, { thresholds, strings, format, locale }),
    );
  }, [geo.band, geo.unknown, value, thresholds, strings, format, locale]);

  // Run / stop the pulse. The pulse never runs when the value is unknown — an
  // unknown system must not look calm.
  useEffect(() => {
    const el = wrapRef.current?.querySelector<SVGCircleElement>(".mc-breathing-core");
    animRef.current?.cancel();
    animRef.current = null;
    if (!el || reduced || !inView || geo.unknown) return;
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    const amp = AMPLITUDE[geo.band];
    // ease-in-out (not the canonical strong ease-out curve): a symmetric
    // inhale/exhale needs to decelerate at BOTH extremes, not just the end —
    // the documented physiological-timing exception (Emil ruling), same as
    // HeartbeatBlip's sweep cadence.
    const anim = el.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${1 + amp})` }, { transform: "scale(1)" }],
      { duration: PERIOD_MS[geo.band], iterations: Infinity, easing: "ease-in-out" },
    );
    animRef.current = anim;
    return () => anim.cancel();
  }, [reduced, inView, geo.band, geo.unknown, wrapRef]);

  return (
    <span
      ref={wrapRef}
      className="mc-breathing-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
    >
      <StaticBreathingDot
        {...rest}
        value={value}
        thresholds={thresholds}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
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
    </span>
  );
}
