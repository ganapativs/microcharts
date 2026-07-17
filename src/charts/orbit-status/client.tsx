"use client";
// Interactive <OrbitStatus>. Motion IS the encoding: the satellite
// orbits the service, angular period snapped to the same 5 rate steps as the
// static dash density — so motion and static frames decode identically. The loop
// is allowed because the loop rate IS the call rate. Gated on
// reduced-motion (→ the static frame; dash density already carries rate) and
// on-screen (paused off-viewport). Composes the static component (canon); a polite
// live region announces threshold crossings only.
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
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
}

// Angular period per rate step 1–5 (busier = faster).
const SPEED_MS = [4000, 3000, 2200, 1500, 900] as const;

export function OrbitStatus(props: InteractiveOrbitStatusProps): React.ReactNode {
  const {
    latency,
    rate,
    latencyDomain,
    rateDomain,
    alert,
    size = 20,
    format,
    locale,
    strings = EN_ORBIT_STATUS,
    title,
    summary,
    className,
    style,
    ...rest
  } = props;

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const geo = useMemo(
    () => orbitStatusGeometry({ latency, rate, size, latencyDomain, rateDomain, alert, pad: 1 }),
    [latency, rate, size, latencyDomain, rateDomain, alert],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [announced, setAnnounced] = useState("");
  const prevAlerted = useRef<boolean | null>(null);
  const mounted = useRef(false);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : orbitStatusSummary(latency, rate, { alert, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

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
    else setAnnounced(orbitStatusSummary(latency, rate, { alert, strings, format, locale }));
  }, [geo.satellite.alerted, latency, rate, alert, strings, fmt, format, locale]);

  return (
    <span
      ref={wrapRef}
      {...wrap("mc-orbit-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
    >
      <StaticOrbitStatus
        {...rest}
        style={FILL}
        latency={latency}
        rate={rate}
        latencyDomain={latencyDomain}
        rateDomain={rateDomain}
        alert={alert}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
