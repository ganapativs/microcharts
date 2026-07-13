"use client";
// Interactive <EtaBar>. `live` mode: on prop change the remainder
// width transitions (CSS, reduced-motion → snap) and a polite live region
// re-announces at most every 10 s. No pointer scrub — there is no series.
// Composes the static entry (canon).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_ETA_BAR } from "../../core/strings-eta-bar.js";
import { EtaBar as StaticEtaBar, etaBarSummary, type EtaBarProps } from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

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

  return (
    <span
      ref={hostRef}
      className="mc-eta-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
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
      {focused && full ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {full}
        </span>
      ) : null}
    </span>
  );
}
