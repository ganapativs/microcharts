"use client";
// Interactive <PercentileLadder>. One pointer listener + pure
// nearest-tick math. ←/→ step ticks; each announces its value and its multiple
// of the median ("p99: 2.1 s — 17× the median."). Composes the static component
// (canon); the probe line is an overlay child re-using geometry.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2 } from "../../core/types.js";
import { percentileLadderGeometry } from "./geometry.js";
import {
  PercentileLadder as StaticPercentileLadder,
  ladderSummary,
  type PercentileLadderProps,
} from "./index.js";

export interface InteractivePercentileLadderProps extends PercentileLadderProps {
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
    className,
    style,
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

  // must match the static geometry (label font sizes the log-tag gutter)
  const font = Math.min(9, Math.max(6, Math.round(height * 0.5)));
  const geo = useMemo(
    () => percentileLadderGeometry({ width, height, data, ps, scale, domain: props.domain, font }),
    [width, height, data, ps, scale, props.domain, font],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const ratioFmt = useMemo(() => makeFormatter({ maximumFractionDigits: 1 }, locale), [locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : ladderSummary(geo, fmt, ratioFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // median reference = the p50 tick if present, else the lowest percentile
  const medianValue = useMemo(() => {
    if (!geo) return 0;
    const mid = geo.ticks.find((t) => t.p === 50) ?? geo.ticks[0]!;
    return mid.value;
  }, [geo]);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || geo.ticks.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.ticks.forEach((t, i) => {
        const d = Math.abs(t.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo || geo.ticks.length === 0) return;
      const pos = active ?? -1;
      let next = pos;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.ticks.length - 1, pos + 1);
          break;
        case "ArrowLeft":
          next = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.ticks.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo],
  );

  const tick = active !== null && geo ? geo.ticks[active] : undefined;
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
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPercentileLadder
        {...rest}
        style={FILL}
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
        {tick ? (
          <line
            x1={tick.x}
            y1={0.5}
            x2={tick.x}
            y2={height - 0.5}
            data-mc-ink="accent"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticPercentileLadder>
      {tick ? (
        <span
          className="mc-ladder-readout mc-spark-readout"
          style={{ left: `${(tick.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`p${tick.p} ${fmt(tick.value)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
