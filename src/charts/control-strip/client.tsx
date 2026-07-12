"use client";
// Interactive <ControlStrip>. One pointer listener + nearest-x.
// ←/→ step all points; Home/End jump ends. (Tab is left for focus egress —
// trapping it to cycle violations would break keyboard escape; the violations
// are visible as rings.) Composes the static component (canon); the crosshair +
// readout chip are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_CONTROL, type ControlStrings } from "../../core/strings-control.js";
import { controlGeometry } from "./geometry.js";
import {
  ControlStrip as StaticControlStrip,
  controlSummary,
  type ControlStripProps,
} from "./index.js";

export interface InteractiveControlStripProps extends ControlStripProps {
  strings?: ControlStrings;
  /**
   * Opt-in entrance motion (default `false`): the process line draws on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ControlStrip(props: InteractiveControlStripProps): React.ReactNode {
  const {
    data,
    limits = "sigma",
    baseline,
    rules = "none",
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_CONTROL,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(
    () => controlGeometry({ width, height, data, limits, baseline, rules, domain: props.domain }),
    [width, height, data, limits, baseline, rules, props.domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : controlSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.points.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - px);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, count, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(count - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(count - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [count],
  );

  const p = active !== null && geo ? geo.points[active] : undefined;
  const value = active !== null ? data[active] : undefined;
  const side = p?.out && value !== undefined ? (value > geo!.band.hi ? "upper" : "lower") : null;
  const announced =
    p && value !== undefined
      ? strings.controlAt(
          active! + 1,
          count,
          fmt(value),
          side,
          side === "upper" ? fmt(geo!.band.hi) : side === "lower" ? fmt(geo!.band.lo) : "",
        )
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-control-strip-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticControlStrip
        {...rest}
        data={data}
        limits={limits}
        baseline={baseline}
        rules={rules}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {p ? (
          <>
            <line
              x1={p.x}
              y1={0.5}
              x2={p.x}
              y2={height - 0.5}
              data-mc-ink="muted"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            {/* focus ring stroke is state-dependent (negative when out), so it
                stays an attribute — a role can't switch color per point */}
            <circle
              cx={p.x}
              cy={p.y}
              r={2.4}
              fill="none"
              stroke={p.out ? "var(--mc-negative)" : "var(--mc-accent)"}
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticControlStrip>
      {p && value !== undefined ? (
        <span
          className="mc-control-readout mc-spark-readout"
          style={{ left: `${(p.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {fmt(value)}
        </span>
      ) : null}
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
