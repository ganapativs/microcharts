"use client";
// Interactive <SpiralYear>. One pointer listener; nearest mark by
// squared 2-D distance over the precomputed spiral marks. ←/→ step chronologically
// along the spiral; a polite live region announces the focused period. Composes the
// static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { dayOfYear } from "../../core/calendar-grid.js";
import { EN_SPIRAL_YEAR, type SpiralYearStrings } from "../../core/strings-spiral-year.js";
import { spiralYearGeometry } from "./geometry.js";
import {
  SpiralYear as StaticSpiralYear,
  spiralYearSummary,
  periodLabel,
  type SpiralYearProps,
} from "./index.js";

export interface InteractiveSpiralYearProps extends SpiralYearProps {
  strings?: SpiralYearStrings;
  /**
   * Opt-in entrance motion (default `false`): the rings fade in on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

function inferCadence(n: number, explicit?: "day" | "week"): "day" | "week" {
  if (explicit) return explicit;
  return n > 0 && n <= 60 ? "week" : "day";
}

export function SpiralYear(props: InteractiveSpiralYearProps): React.ReactNode {
  const {
    data,
    cadence: cadenceProp,
    startDate,
    steps = 5,
    mark = "dot",
    size = 24,
    format,
    locale,
    strings = EN_SPIRAL_YEAR,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The spiral's angle encodes the time of year, so the entrance must not
  // rotate — "grow" scales it concentrically from the center, keeping every
  // period at its true angular position.
  useEntrance(hostRef, "grow", animate);

  const cadence = inferCadence(data.length, cadenceProp);
  const startIndex = useMemo(() => {
    const doy = startDate ? dayOfYear(startDate) : null;
    return doy === null ? 0 : cadence === "week" ? Math.floor(doy / 7) : doy;
  }, [startDate, cadence]);

  const geo = useMemo(
    () => spiralYearGeometry({ values: data, size, steps, cadence, startIndex, pad: 1, mark }),
    [data, size, steps, cadence, startIndex, mark],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null); // position into geo.marks

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : spiralYearSummary(data, { cadence: cadenceProp, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.marks.length === 0) return;
      const rct = e.currentTarget.getBoundingClientRect();
      if (rct.width === 0 || rct.height === 0) return;
      const x = ((e.clientX - rct.left) / rct.width) * geo.size;
      const y = ((e.clientY - rct.top) / rct.height) * geo.size;
      let best = 0;
      let bestDist = Infinity;
      geo.marks.forEach((m, i) => {
        const dist = (m.cx - x) ** 2 + (m.cy - y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    },
    [geo],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const len = geo.marks.length;
      if (len === 0) return;
      const cur = active ?? -1;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(len - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = cur <= 0 ? 0 : cur - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = len - 1;
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

  const activeMark = active !== null ? geo.marks[active] : undefined;
  const activeVal = activeMark ? data[activeMark.index] : undefined;
  const activeLabel = activeMark ? periodLabel(activeMark.index, cadence) : "";
  const announced =
    activeMark && typeof activeVal === "number"
      ? strings.spiralYearAt(activeLabel, fmt(activeVal))
      : "";
  const readout =
    activeMark && typeof activeVal === "number" ? `${activeLabel}: ${fmt(activeVal)}` : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-spiral-live ${className}` : "mc-spiral-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticSpiralYear
        {...rest}
        style={FILL}
        data={data}
        cadence={cadence}
        startDate={startDate}
        steps={steps}
        mark={mark}
        size={size}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activeMark ? (
          <circle
            cx={activeMark.cx}
            cy={activeMark.cy}
            r={activeMark.r + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticSpiralYear>
      <LiveRegion>{announced}</LiveRegion>
      {activeMark && readout ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
