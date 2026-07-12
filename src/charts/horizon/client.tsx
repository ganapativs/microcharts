"use client";
// Interactive <Horizon> (plan/22 #25). Interaction is ESSENTIAL here — the
// encoding is learned: the nearest-x crosshair announces the TRUE value, not
// the band, and raises a value dot at the folded position. ←/→ steps x.
// Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { describeSeries, EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import { isFiniteValue } from "../../core/types.js";
import { horizonGeometry } from "./geometry.js";
import { Horizon as StaticHorizon, type HorizonProps } from "./index.js";

export interface InteractiveHorizonProps extends HorizonProps {
  strings?: SeriesStrings & SlotStrings;
  /**
   * Opt-in entrance motion (default `false`): the folded bands wipe on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const DEFAULT_STRINGS = { ...EN_SERIES, ...EN_SLOTS };

export function Horizon(props: InteractiveHorizonProps): React.ReactNode {
  const {
    data,
    folds = 2,
    mode = "mirror",
    baseline = 0,
    domain,
    width = 80,
    height = 14,
    format,
    locale,
    strings = DEFAULT_STRINGS,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const geo = useMemo(
    () => horizonGeometry({ width, height, values: data, domain, baseline, folds, mode }),
    [width, height, data, domain, baseline, folds, mode],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : describeSeries(data, { format: fmt, strings });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.n === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.round(((x - 0.5) / Math.max(1, width - 1)) * (geo.n - 1));
      setActive(Math.min(geo.n - 1, Math.max(0, i)));
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.n === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.n - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.n - 1;
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

  const value = active !== null ? data[active] : undefined;
  const announced =
    active !== null
      ? isFiniteValue(value)
        ? strings.point(active + 1, geo.n, fmt(value))
        : strings.pointEmpty(active + 1, geo.n)
      : "";
  const crossX = active !== null ? geo.xFor(active) : undefined;

  return (
    <span
      ref={hostRef}
      className="mc-horizon-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticHorizon
        {...rest}
        data={data}
        folds={folds}
        mode={mode}
        baseline={baseline}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        summary={false}
      >
        {crossX !== undefined ? (
          <>
            <line
              x1={crossX}
              y1={0}
              x2={crossX}
              y2={height}
              data-mc-ink="muted"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            {isFiniteValue(value) ? (
              <circle cx={crossX} cy={geo.foldedY(value)} r={1.75} data-mc-ink="accent" />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticHorizon>
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
      {active !== null && crossX !== undefined ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(crossX / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isFiniteValue(value) ? fmt(value) : "—"}
        </span>
      ) : null}
    </span>
  );
}
