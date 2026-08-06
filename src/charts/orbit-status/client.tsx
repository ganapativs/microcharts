"use client";
// Interactive <OrbitStatus>. Motion IS the encoding: the satellite
// orbits the service, angular period snapped to the same 5 rate steps as
// static dash density — so motion and static frames decode identically. The loop
// is allowed because the loop rate IS the call rate. Gated on
// reduced-motion (→ the static frame; dash density already carries rate) and
// on-screen (paused off-viewport).; a polite
// live region announces threshold crossings only. ONE unit (the dependency
// itself) → the lean scalar contract: `onSelect` for drill-down, no picker
// kernel, no roving, no selection state to rove between.
import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { makeFormatter } from "../../core/format.js";
import { labelFitsY, labelFont } from "../../core/labels.js";
import { isFiniteValue } from "../../core/types.js";
import { CHIP, named, fillFor, wrap } from "../../shared/interactive.js";
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
  /**
   * Opt-in entrance motion (default `false`): the glyph pops in (fade + scale)
   * when the chart first mounts client-side — a whole-svg animation, so it
   * never collides with the continuous orbit this entry already drives.
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
  /**
   * Show the floating value chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="latency"` already prints it.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. The dependency is ONE
   * unit, so this fires once with `{ index: 0, … }` on pointer enter or focus and
   * once with `null` when that clears — never repeatedly while the pointer moves
   * inside the glyph, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** The dependency was activated (click, tap, Enter or Space): `{ index: 0, value, label }` — value is latency. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

// Angular period per rate step 1–5 (busier = faster).
const SPEED_MS = [4000, 3000, 2200, 1500, 900] as const;

export function OrbitStatus(props: InteractiveOrbitStatusProps): React.ReactNode {
  const {
    latency,
    rate,
    domain,
    latencyDomain: latencyDomainProp,
    rateDomain,
    threshold,
    size = 20,
    format,
    locale,
    strings = EN_ORBIT_STATUS,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    ...rest
  } = props;

  // Resolved once, then handed to both the geometry here and the static entry
  // below: two spellings of one extent must not reach two different scales.
  const latencyDomain = domain ?? latencyDomainProp;

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  useEntrance(wrapRef, "pop", animate);
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
  // One builder, so `onActive` and `onSelect` can never report a different
  // latency or a different string than the chip paints.
  const datum = (): MicroDatum => ({
    index: 0,
    value: geo.unknown ? null : Math.max(0, latency),
    label: title,
    formatted: geo.unknown ? "—" : strings.orbitLatency(fmt(Math.max(0, latency))),
  });
  const select = (): void => onSelect?.(datum());
  // `onActive` fires on the enter/leave EDGE only. `open` alone can't gate it —
  // pointer-enter then focus both set it `true`, which would announce the same
  // unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setOpen(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  // The Chart viewBox gains a right-hand gutter when the ms numeral is shown;
  // the orbit still sits in the left square, so anything positioned as a
  // percentage of the wrapper must divide by the FULL width, not the square.
  // Every term is resolved the way the static entry resolves it — same
  // `fontSize` fallback, same `labelFitsY` drop, same `orbitLabelBand` — because
  // a chip placed against a width the SVG did not actually take lands off the
  // mark. This used to be a hand-copied expression; the shared helper is what
  // keeps the two in step.
  const labelFontSize =
    isFiniteValue(rest.fontSize) && rest.fontSize > 0 ? rest.fontSize : labelFont(geo.size);
  const labelText =
    rest.label === "latency" &&
    !geo.unknown &&
    labelFitsY(geo.size / 2 + labelFontSize * 0.34, labelFontSize, geo.size, false)
      ? strings.orbitLatency(fmt(Math.max(0, latency)))
      : null;

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
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
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
      {/* Skip when the ms numeral is already printed beside the orbit. Keyed on
          the numeral the static entry actually paints, not on the prop: a box
          too small to seat it drops it, and asking for `label="latency"` there
          used to suppress the chip too, leaving nothing to read. */}
      {readout && open && labelText === null ? (
        <span className="mc-spark-readout" {...CHIP}>
          {geo.unknown ? "—" : strings.orbitLatency(fmt(Math.max(0, latency)))}
        </span>
      ) : null}
    </span>
  );
}
