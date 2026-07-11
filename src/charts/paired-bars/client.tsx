"use client";
// Interactive <PairedBars> (plan/22 #12). One pointer listener; pair by
// category-band lookup. ←/→ rove pairs ("East: 940 vs 1,200."). Composes the
// static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_PAIRED, type PairedStrings } from "../../core/strings-paired.js";
import { isFiniteValue } from "../../core/types.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { pairedBarsGeometry } from "./geometry.js";
import {
  PairedBars as StaticPairedBars,
  pairedBarsSummary,
  type PairedBarsProps,
} from "./index.js";

// Only the value bars (bar/positive/negative) animate — the muted "neutral"
// ref ghost stays static, arriving with the base whole-chart fade instead.
const VALUE_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

export interface InteractivePairedBarsProps extends PairedBarsProps {
  strings?: PairedStrings;
  /**
   * Opt-in entrance motion (default `false`): value bars rise from the
   * baseline (vertical) or sweep in from the left (horizontal) when the chart
   * first mounts client-side. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PairedBars(props: InteractivePairedBarsProps): React.ReactNode {
  const {
    data,
    mode = "grouped",
    orientation = "vertical",
    domain,
    width = 60,
    height = 20,
    format,
    locale,
    strings = EN_PAIRED,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: VALUE_SELECTOR,
  });

  const geo = useMemo(
    () =>
      pairedBarsGeometry({
        width,
        height,
        pairs: data.map((d) => ({ value: d.value, ref: d.ref })),
        domain,
        mode,
        orientation,
      }),
    [width, height, data, domain, mode, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : pairedBarsSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.pairs.length === 0 || geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const pos =
        orientation === "vertical"
          ? ((e.clientX - r.left) / r.width) * width
          : ((e.clientY - r.top) / r.height) * height;
      const i = Math.floor(pos / geo.pitch);
      setActive(i >= 0 && i < geo.pairs.length ? i : null);
    },
    [geo, orientation, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.pairs.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = Math.min(geo.pairs.length - 1, cur + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.pairs.length - 1;
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

  const activePair = active !== null ? geo.pairs[active] : undefined;
  const activeDatum = active !== null ? data[active] : undefined;
  const announced = !activeDatum
    ? ""
    : isFiniteValue(activeDatum.value) && isFiniteValue(activeDatum.ref)
      ? strings.pairAt(activeDatum.label, fmt(activeDatum.value), fmt(activeDatum.ref))
      : isFiniteValue(activeDatum.value)
        ? `${activeDatum.label}: ${fmt(activeDatum.value)}, no reference.`
        : `${activeDatum.label}: ${strings.noData}`;

  const ringPos = active !== null ? active * geo.pitch : 0;
  const bandW = geo.pitch > 0 ? geo.pitch - 1.5 : 0;

  return (
    <span
      ref={hostRef}
      className="mc-paired-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticPairedBars
        {...rest}
        data={data}
        mode={mode}
        orientation={orientation}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {activePair ? (
          <rect
            x={orientation === "vertical" ? ringPos - 0.5 : -0.5}
            y={orientation === "vertical" ? -0.5 : ringPos - 0.5}
            width={orientation === "vertical" ? bandW + 1 : width + 1}
            height={orientation === "vertical" ? height + 1 : bandW + 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticPairedBars>
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
      {activePair && activeDatum && isFiniteValue(activeDatum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((ringPos + bandW / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {isFiniteValue(activeDatum.ref)
            ? `${fmt(activeDatum.value)} vs ${fmt(activeDatum.ref)}`
            : fmt(activeDatum.value)}
        </span>
      ) : null}
    </span>
  );
}
