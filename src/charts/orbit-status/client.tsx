"use client";
// Interactive <OrbitStatus>. Motion IS the encoding: the satellite
// orbits the service, angular period snapped to the same 5 rate steps as the
// static dash density — so motion and static frames decode identically. The loop
// is allowed because the loop rate IS the call rate. Gated on
// reduced-motion (→ the static frame; dash density already carries rate) and
// on-screen (paused off-viewport). Composes the static component (canon); a polite
// live region announces threshold crossings only. ONE unit (the dependency
// itself) → the lean scalar contract: `onSelect` for drill-down, no picker
// kernel, no roving, no selection state to rove between.
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { EN_ORBIT_STATUS, type OrbitStatusStrings } from "../../core/strings-orbit-status.js";
import { LiveRegion } from "../../shared/live-region.js";
import { orbitStatusGeometry } from "./geometry.js";
import {
  OrbitStatus as StaticOrbitStatus,
  orbitStatusSummary,
  type OrbitStatusProps,
} from "./index.js";

export interface InteractiveOrbitStatusProps extends OrbitStatusProps {
  strings?: OrbitStatusStrings;
  /** The dependency was activated (click, tap, Enter or Space): `{ index: 0, value, label }` — value is latency. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

// Angular period per rate step 1–5 (busier = faster).
const SPEED_MS = [4000, 3000, 2200, 1500, 900] as const;

export function OrbitStatus(props: InteractiveOrbitStatusProps): React.ReactNode {
  const {
    latency,
    rate,
    latencyDomain,
    rateDomain,
    threshold,
    size = 20,
    format,
    locale,
    strings = EN_ORBIT_STATUS,
    title,
    summary,
    className,
    style,
    onSelect,
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const geo = useMemo(
    () =>
      orbitStatusGeometry({ latency, rate, size, latencyDomain, rateDomain, threshold, pad: 1 }),
    [latency, rate, size, latencyDomain, rateDomain, threshold],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [announced, setAnnounced] = useState("");
  // Hover/focus reveals the exact latency numeral — a readout, not a selection.
  const [open, setOpen] = useState(false);
  const prevAlerted = useRef<boolean | null>(null);
  const mounted = useRef(false);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : orbitStatusSummary(latency, rate, { threshold, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // ONE unit — the dependency itself. There is nothing to rove between and no
  // angular lookup to do (the satellite's angle encodes nothing; only its speed
  // does), so this takes the lean scalar contract: drill-down on activation.
  // value = latency, the chart's primary encoded number (orbit RADIUS). Rate is
  // the second channel (dash density / orbital speed) and stays in the summary
  // rather than inventing a second numeric field.
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: geo.unknown ? null : Math.max(0, latency),
      label: title,
    });

  // The Chart viewBox gains a right-hand gutter when the ms numeral is shown;
  // the orbit still sits in the left square, so anything positioned as a
  // percentage of the wrapper must divide by the FULL width, not the square
  // (mirrors the static entry's reservation, verbatim).
  const labelText =
    rest.label === "latency" && !geo.unknown ? `${fmt(Math.max(0, latency))}ms` : null;
  const vbWidth =
    geo.size +
    (labelText ? Math.ceil(labelText.length * 0.7 * (rest.fontSize ?? labelFont(size)) + 2) : 0);

  // Orbit the satellite (only when motion is allowed and the rate is nonzero).
  useEffect(() => {
    const sat = wrapRef.current?.querySelector<SVGCircleElement>(".mc-orbit-satellite");
    if (!sat || reduced || !inView || geo.unknown || geo.orbit.rateStep === 0) return;
    sat.style.transformBox = "view-box";
    sat.style.transformOrigin = `${geo.center.cx}px ${geo.center.cy}px`;
    const anim = sat.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: SPEED_MS[geo.orbit.rateStep - 1]!,
      iterations: Infinity,
      easing: "linear",
    });
    return () => anim.cancel();
  }, [reduced, inView, geo.unknown, geo.orbit.rateStep, geo.center.cx, geo.center.cy, wrapRef]);

  // Announce threshold crossings only (never per frame); quiet on mount.
  useEffect(() => {
    const alerted = geo.satellite.alerted;
    if (!mounted.current) {
      mounted.current = true;
      prevAlerted.current = alerted;
      return;
    }
    if (prevAlerted.current === alerted) return;
    prevAlerted.current = alerted;
    if (alerted) setAnnounced(strings.orbitAlert(fmt(Math.max(0, latency))));
    else setAnnounced(orbitStatusSummary(latency, rate, { threshold, strings, format, locale }));
  }, [geo.satellite.alerted, latency, rate, threshold, strings, fmt, format, locale]);

  return (
    <span
      ref={wrapRef}
      {...wrap("mc-orbit-live", className, style)}
      {...named(ariaLabel)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticOrbitStatus
        {...rest}
        style={fillFor(style)}
        latency={latency}
        rate={rate}
        latencyDomain={latencyDomain}
        rateDomain={rateDomain}
        threshold={threshold}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{announced}</LiveRegion>
      {open ? (
        <span
          className="mc-spark-readout"
          style={{
            // centered over the ORBIT square, not the gutter-widened viewBox
            left: `${(geo.size / 2 / vbWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {geo.unknown ? "—" : `${fmt(Math.max(0, latency))}ms`}
        </span>
      ) : null}
    </span>
  );
}
