"use client";
// Interactive <EtaBar>. `live` mode: on prop change the remainder
// width transitions (CSS, reduced-motion → snap) and a polite live region
// re-announces at most every 10 s. No pointer scrub — there is no series — but
// hover OR focus reveals the forecast chip, the reveal-on-hover scalar pattern.
import { useEffect, useRef, useState } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { CHIP, named, fillFor, useScalarActive, wrap } from "../../shared/interactive.js";
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
  /**
   * The active (hovered / keyboard-focused) unit changed. One bar = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the mark, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
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
    onActive,
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
  // Chip = whatever the permanent gutter is NOT already printing. Default
  // `label="eta"` → chip is the percent; `label="percent"` → chip is the ETA;
  // `label="none"` (or a too-short bar that drops the gutter) → both.
  const height = rest.height ?? 8;
  const labelMode = rest.label ?? "eta";
  const etaGeo = etaBarGeometry({
    progress,
    elapsed,
    rate: rate ?? null,
    width: rest.width ?? 80,
    height,
  });
  const etaPct = makePercentFormatter(locale)(Math.max(0, Math.min(1, progress || 0)));
  const etaOnly =
    progress >= 1 || etaGeo.indeterminate || etaGeo.remainingTime == null
      ? undefined
      : etaFormat
        ? etaFormat(etaGeo.remainingTime)
        : fmt(etaGeo.remainingTime);
  // Mirrors the static's own gutter rule (`label`/`height < 9`/no ETA to print).
  // Left uncoerced on purpose: this subpath sits exactly on its size budget, and
  // a `!!` costs 2 B gzipped. Only ever read as a condition.
  const gutterPaints = labelMode !== "none" && height >= 9 && (labelMode === "percent" || etaOnly);
  const chip =
    summary === false
      ? undefined
      : !gutterPaints
        ? etaOnly
          ? `${etaPct} · ${etaOnly}`
          : etaPct
        : labelMode === "eta"
          ? etaPct
          : (etaOnly ?? etaPct);

  const [announced, setAnnounced] = useState("");
  // -Infinity, not 0: `performance.now()` is milliseconds since THIS document's
  // time origin, so anchoring at 0 claims "already announced at page load" and
  // silently swallows the leading edge for the whole first `announceEvery`
  // window — 10 s by default. An ETA bar that mounts and ticks inside a
  // streamed reply (the common case) therefore announced nothing at all, since
  // this branch drops the update rather than deferring it. -Infinity means
  // "never announced", so the first change always emits.
  const last = useRef(-Infinity);
  useEffect(() => {
    if (!full) return;
    const now = performance.now();
    if (now - last.current >= announceEvery) {
      last.current = now;
      setAnnounced(full);
    }
  }, [full, announceEvery]);

  // Clamped progress fraction. One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : null,
    formatted: chip,
  });
  const { active: open, bind } = useScalarActive(datum, onActive, onSelect);

  return (
    <span ref={hostRef} {...wrap("mc-eta-live", className, style)} {...named(label)} {...bind}>
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
      {readout && open && chip ? (
        <span className="mc-spark-readout" {...CHIP}>
          {chip}
        </span>
      ) : null}
    </span>
  );
}
