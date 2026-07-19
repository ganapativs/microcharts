"use client";
// Interactive <EtaBar>. `live` mode: on prop change the remainder
// width transitions (CSS, reduced-motion → snap) and a polite live region
// re-announces at most every 10 s. No pointer scrub — there is no series.
// Composes the static entry (canon).
import { useEffect, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
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
  /** The bar was activated (click, tap, Enter or Space): `{ index: 0, value }` — the clamped progress. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function EtaBar(props: InteractiveEtaBarProps): React.ReactNode {
  const {
    progress,
    elapsed,
    rate,
    formatEta,
    format,
    locale,
    strings = EN_ETA_BAR,
    title,
    summary,
    announceEvery = 10000,
    animate = false,
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
        : etaBarSummary({ progress, elapsed, rate: rate ?? null, formatEta, fmt }, strings);
  const label = [title, full].filter(Boolean).join(". ") || undefined;
  // The chip used to render `full` — the whole accessible sentence ("62% done;
  // about 294 remaining at the current rate."), 143px past its cap, and a
  // verbatim duplicate of the aria-label beside it. A caller-supplied `summary`
  // string of any length landed in it too. The chip now shows the two numbers
  // the sentence is built from; the sentence stays in the live region.
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
        : `${etaPct} · ${formatEta ? formatEta(etaGeo.remainingTime) : fmt(etaGeo.remainingTime)}`;

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
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-eta-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
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
        formatEta={formatEta}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      />
      <LiveRegion>{announced}</LiveRegion>
      {focused && chip ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
