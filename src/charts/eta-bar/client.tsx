"use client";
// Interactive <EtaBar>. `live` mode: on prop change the remainder
// width transitions (CSS, reduced-motion → snap) and a polite live region
// re-announces at most every 10 s. No pointer scrub — there is no series.
// Composes the static entry (canon).
import { useEffect, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_ETA_BAR } from "../../core/strings-eta-bar.js";
import { etaBarGeometry } from "./geometry.js";
import { EtaBar as StaticEtaBar, etaBarSummary, type EtaBarProps } from "./index.js";

export interface InteractiveEtaBarProps extends EtaBarProps {
  /** Minimum ms between live-region announcements (documented throttle). */
  announceEvery?: number;
  /**
   * Opt-in entrance motion (default `false`): the elapsed bar sweeps in from
   * the left when the chart first mounts client-side. Independent of the
   * existing CSS transition on the bar's x/width (which eases live prop
   * updates, a different property than the WAAPI transform this drives) — the
   * two never run at once, since the entrance fires once on mount before any
   * value update. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /** Show the floating value chip on hover/focus (default `true`). `false` suppresses only the chip. */
  readout?: boolean;
  /** The bar was activated (click, tap, Enter or Space): `{ index: 0, value }` — the clamped progress. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function EtaBar(props: InteractiveEtaBarProps): React.ReactNode {
  const {
    progress,
    elapsed,
    rate,
    etaFormat,
    format,
    locale,
    strings = EN_ETA_BAR,
    title,
    summary,
    announceEvery = 10000,
    animate = false,
    readout = true,
    onSelect,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate);

  const fmt = makeFormatter(format, locale);
  const full =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : etaBarSummary({ progress, elapsed, rate: rate ?? null, etaFormat, fmt }, strings);
  const label = [title, full].filter(Boolean).join(". ") || undefined;
  // The chip shows only the two numbers the summary is built from — never
  // `full`, whose sentence (or an unbounded caller `summary`) blew past the
  // chip's width cap and duplicated the aria-label beside it verbatim. The
  // sentence stays in the live region.
  const etaGeo = etaBarGeometry({ progress, elapsed, rate: rate ?? null, width: 80, height: 8 });
  const etaPct = makeFormatter(undefined, locale, {
    style: "percent",
    maximumFractionDigits: 0,
  })(Math.max(0, Math.min(1, progress || 0)));
  const chip =
    summary === false
      ? undefined
      : progress >= 1 || etaGeo.indeterminate || etaGeo.remainingTime == null
        ? etaPct
        : `${etaPct} · ${etaFormat ? etaFormat(etaGeo.remainingTime) : fmt(etaGeo.remainingTime)}`;

  const [announced, setAnnounced] = useState("");
  const [focused, setFocused] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    if (!full) return;
    const now = performance.now();
    if (now - last.current >= announceEvery) {
      last.current = now;
      setAnnounced(full);
    }
  }, [full, announceEvery]);

  // Drill-down: the clamped progress fraction the done bar encodes.
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : null,
      formatted: chip,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-eta-live", className, style)}
      {...named(label)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticEtaBar
        {...rest}
        progress={progress}
        elapsed={elapsed}
        rate={rate}
        etaFormat={etaFormat}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      />
      <LiveRegion>{announced}</LiveRegion>
      {readout && focused && chip ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
