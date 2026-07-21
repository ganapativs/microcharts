"use client";
// Interactive <PercentileLadder>. useActivePicker owns interaction: one pointer
// listener + pure nearest-tick math, ←/→ step ticks, click / Enter / Space
// selects (onSelect). Each rung announces its value and its multiple of the
// median ("p99: 2.1 s — 17× the median."). Composes the static component
// (canon); the probe line is an overlay child re-using geometry.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2 } from "../../core/types.js";
import { percentileLadderGeometry } from "./geometry.js";
import {
  PercentileLadder as StaticPercentileLadder,
  ladderFont,
  ladderSummary,
  type PercentileLadderProps,
} from "./index.js";

export interface InteractivePercentileLadderProps extends PercentileLadderProps, PickerProps {
  strings?: QuantileStrings;
  /**
   * Opt-in entrance motion (default `false`): the percentile ticks pop onto
   * the track in rank order (p50 → p99) on first client-side mount. Inert on
   * the server and on hydrated server HTML; `prefers-reduced-motion` always
   * wins.
   */
  animate?: boolean;
}

export function PercentileLadder(props: InteractivePercentileLadderProps): React.ReactNode {
  const {
    data,
    ps,
    scale = "linear",
    label = "ps",
    width = 80,
    height = 12,
    format,
    locale,
    strings = EN_QUANTILE,
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
  // Ticks (or dots in `marks="dot"`) carry the "data"/"flag" ink roles on
  // either <line> or <circle> — the attribute selector covers both mark modes.
  // "trail" + order "index" lands them in rank order (they're already
  // authored p50 → p99, so DOM order IS the rank order) — the ladder reads
  // as climbing the percentiles, not a generic scatter of ticks.
  useEntrance(hostRef, "trail", animate, {
    selector: '[data-mc-ink="data"], [data-mc-ink="flag"]',
    order: "index",
  });

  // must match the static geometry (label font sizes the log-tag gutter) —
  // import the CHART's font, not `core/labels`' same-named helper
  const font = ladderFont(height);
  const geo = useMemo(
    () => percentileLadderGeometry({ width, height, data, ps, scale, domain: props.domain, font }),
    [width, height, data, ps, scale, props.domain, font],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const ratioFmt = useMemo(() => makeFormatter({ maximumFractionDigits: 1 }, locale), [locale]);

  // A collapsed ladder (every percentile identical) paints ONE rung, so it
  // offers one navigable unit — roving the hidden rungs would cycle the chip
  // through p50/p90/p99 while the probe line never moved. Same predicate the
  // static renders by (`geo.collapsed`), read from geometry, not re-derived.
  const count = geo === null ? 0 : geo.collapsed ? 1 : geo.ticks.length;

  // index = TICK (percentile rung) index in ascending-p order — the requested
  // `ps` deduped/sorted/capped, not an index into `data`.
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.ticks.length === 0) return null;
      if (geo.collapsed) return 0;
      let best = 0;
      let bestDist = Infinity;
      geo.ticks.forEach((t, i) => {
        const d = Math.abs(t.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );
  // median reference = the p50 tick if present, else the lowest percentile.
  // Declared above `datum` so the chip-mirroring `formatted` (below) can read it.
  const medianValue = useMemo(() => {
    if (!geo) return 0;
    const mid = geo.ticks.find((t) => t.p === 50) ?? geo.ticks[0]!;
    return mid.value;
  }, [geo]);

  const datum = useCallback(
    (i: number) => {
      const t = geo?.ticks[i];
      return {
        index: i,
        value: t?.value ?? null,
        label: t ? `p${t.p}` : undefined,
        formatted: t
          ? `p${t.p} ${fmt(t.value)} (${ratioFmt(medianValue === 0 ? 0 : round2(t.value / medianValue))}×)`
          : undefined,
      };
    },
    [geo, fmt, ratioFmt, medianValue],
  );

  const { active, selected, bind } = useActivePicker({
    count,
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
        : geo === null
          ? strings.noData
          : ladderSummary(geo, fmt, ratioFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const probe = (i: number, pinned: boolean) => {
    const t = geo?.ticks[i];
    if (!t) return null;
    return (
      <line
        x1={t.x}
        y1={0.5}
        x2={t.x}
        y2={height - 0.5}
        data-mc-ink="accent"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const tick = shown !== null && geo ? geo.ticks[shown] : undefined;
  const announced = tick
    ? strings.ladderProbe(
        String(tick.p),
        fmt(tick.value),
        `${ratioFmt(medianValue === 0 ? 0 : round2(tick.value / medianValue))}×`,
      )
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-percentile-ladder-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticPercentileLadder
        {...rest}
        style={fillFor(style)}
        data={data}
        ps={ps}
        scale={scale}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? probe(selected, true) : null}
        {active !== null ? probe(active, false) : null}
        {rest.children}
      </StaticPercentileLadder>
      {readout && tick ? (
        <span
          className="mc-ladder-readout mc-spark-readout"
          style={{ left: `${(tick.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`p${tick.p} ${fmt(tick.value)} (${ratioFmt(medianValue === 0 ? 0 : round2(tick.value / medianValue))}×)`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
