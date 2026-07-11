"use client";
// Interactive <SpreadBand> (plan/26 §6). Nearest-x lookup announces the lead at
// that point ("Point 6 of 12: organic +11 over paid."); the crosshair touches
// both lines. ←/→ steps x. Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { isFiniteValue } from "../../core/types.js";
import { EN_SPREAD_BAND } from "../../core/strings-spread-band.js";
import { gutterFont, lastGap, spreadBandGeometry } from "./geometry.js";
import {
  SpreadBand as StaticSpreadBand,
  signedGap,
  spreadBandSummary,
  type SpreadBandProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveSpreadBandProps extends SpreadBandProps {
  /**
   * Opt-in entrance motion (default `false`): the signed gap band wipes on
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SpreadBand(props: InteractiveSpreadBandProps): React.ReactNode {
  const {
    data,
    labels = ["A", "B"],
    label = "gap",
    domain,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_SPREAD_BAND,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = gutterFont(height);

  const endGap = lastGap(data);
  const showLabel = label === "gap" && endGap !== null && endGap !== 0;
  const gutterCh = showLabel ? signedGap(endGap!, fmt).length : 0;

  const geo = useMemo(
    () => spreadBandGeometry({ width, height, data, domain, gutterCh, fontSize }),
    [width, height, data, domain, gutterCh, fontSize],
  );
  const n = data.length;
  const [active, setActive] = useState<number | null>(null);
  const clear = useCallback(() => setActive(null), []);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : spreadBandSummary(geo, labels, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (n === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const span = geo.plot.x1 - geo.plot.x0;
      const i = Math.round(((x - geo.plot.x0) / Math.max(1, span)) * (n - 1));
      setActive(Math.min(n - 1, Math.max(0, i)));
    },
    [n, geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (n === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(n - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = n - 1;
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
    [active, n],
  );

  const d = active !== null ? data[active] : undefined;
  const av = d?.a;
  const bv = d?.b;
  const bothFinite = isFiniteValue(av) && isFiniteValue(bv);
  const gap = bothFinite ? (av as number) - (bv as number) : 0;
  const aLeads = gap > 0;
  const leader = aLeads ? labels[0] : labels[1];
  const other = aLeads ? labels[1] : labels[0];

  const announced =
    active === null
      ? ""
      : !bothFinite
        ? strings.spreadBandAtEmpty(active + 1, n)
        : gap === 0
          ? strings.spreadBandAtTie(active + 1, n)
          : strings.spreadBandAt(active + 1, n, leader, `+${fmt(Math.abs(gap))}`, other);

  const crossX =
    active !== null
      ? (geo.subjectPoints[active]?.[0] ?? geo.referencePoints[active]?.[0])
      : undefined;

  const chip = !bothFinite ? "—" : gap === 0 ? "level" : `${leader} +${fmt(Math.abs(gap))}`;

  return (
    <span
      ref={hostRef}
      className="mc-spread-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={clear}
      onKeyDown={onKeyDown}
      onBlur={clear}
    >
      <StaticSpreadBand
        {...rest}
        data={data}
        labels={labels}
        label={label}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        title={title}
        summary={false}
        style={FILL}
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
            {geo.subjectPoints[active!] ? (
              <circle
                cx={geo.subjectPoints[active!]![0]}
                cy={geo.subjectPoints[active!]![1]}
                r={2}
                data-mc-ink="accent"
              />
            ) : null}
            {geo.referencePoints[active!] ? (
              <circle
                cx={geo.referencePoints[active!]![0]}
                cy={geo.referencePoints[active!]![1]}
                r={1.5}
                style={{ fill: "var(--mc-neutral)" }}
              />
            ) : null}
          </>
        ) : null}
        {rest.children}
      </StaticSpreadBand>
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
          style={{ left: `${(crossX / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {chip}
        </span>
      ) : null}
    </span>
  );
}
