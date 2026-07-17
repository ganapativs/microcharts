"use client";
// Interactive <Hypnogram>. One pointer listener; run lookup by x.
// ←/→ rove runs, Home/End jump. Composes the static component (canon).
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
import { EN_HYPNOGRAM } from "../../core/strings-hypnogram.js";
import { firstAppearance, hypnogramGeometry } from "./geometry.js";
import {
  Hypnogram as StaticHypnogram,
  hypnogramSummary,
  resolveDomain,
  type HypnogramProps,
} from "./index.js";

export interface InteractiveHypnogramProps extends HypnogramProps {
  /**
   * Opt-in entrance motion (default `false`): the state trace wipes on when
   * the chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Hypnogram(props: InteractiveHypnogramProps): React.ReactNode {
  const {
    data,
    states: statesProp,
    variant = "steps",
    domain: domainProp,
    width = 120,
    height = 24,
    strings = EN_HYPNOGRAM,
    format,
    locale,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props as InteractiveHypnogramProps & {
    format?: Intl.NumberFormatOptions | ((n: number) => string);
    locale?: string | string[];
  };

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const appearance = useMemo(() => firstAppearance(data), [data]);
  const rowStates = useMemo(() => {
    if (!statesProp) return appearance;
    const extra = appearance.filter((s) => !statesProp.includes(s));
    return [...statesProp, ...extra];
  }, [statesProp, appearance]);
  const domain = useMemo(() => domainProp ?? resolveDomain(data), [domainProp, data]);
  const geo = useMemo(
    () => hypnogramGeometry({ data, states: rowStates, domain, width, height, style: variant }),
    [data, rowStates, domain, width, height, variant],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : hypnogramSummary(data, rowStates, domain, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.runs.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = geo.runs.findIndex((run) => x >= run.x0 && x <= run.x1);
      setActive(i >= 0 ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.runs.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.runs.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.runs.length - 1;
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

  const run = active !== null ? geo.runs[active] : undefined;
  const announced = run ? strings.hypnogramRun(run.state, fmt(run.t0), fmt(run.t1)) : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-hypno-live ${className}` : "mc-hypno-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticHypnogram
        {...rest}
        data={data}
        states={statesProp}
        variant={variant}
        style={FILL}
        width={width}
        height={height}
        domain={domain}
        strings={strings}
        summary={false}
      >
        {run ? (
          <rect
            x={run.x0 - 0.5}
            y={0.5}
            width={Math.max(1, run.x1 - run.x0) + 1}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticHypnogram>
      <LiveRegion>{announced}</LiveRegion>
      {run ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((run.x0 + run.x1) / 2 / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {run.state}
        </span>
      ) : null}
    </span>
  );
}
