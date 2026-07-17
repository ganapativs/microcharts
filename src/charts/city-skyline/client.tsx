"use client";
// Interactive <CitySkyline>. x-band pointer lookup → highlight the
// building + announce it; ←/→ roving; the lit fraction is announced as a percent
// (secondary channel). Composes the static component.
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { citySkylineGeometry } from "./geometry.js";
import { EN_SKYLINE, type SkylineStrings } from "../../core/strings-skyline.js";
import {
  CitySkyline as StaticCitySkyline,
  citySkylineSummary,
  type CitySkylineProps,
} from "./index.js";

// Only the buildings (rect, ink="bar") rise from the ground. The lit-window
// pattern (path, ink="accent") is left OUT of the rise story on purpose: a
// scaleY rise would stretch the fixed-size window marks. As accent ink it
// enters via the VOICE act instead — fading in after the buildings settle,
// reading as windows "turning on".
const SKYLINE_SELECTOR = 'rect[data-mc-ink="bar"]';

export interface InteractiveCitySkylineProps extends CitySkylineProps {
  strings?: SkylineStrings;
  /**
   * Opt-in entrance motion (default `false`): buildings rise from the ground
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CitySkyline(props: InteractiveCitySkylineProps): React.ReactNode {
  const {
    data,
    bw = 9,
    gap = 3,
    domain,
    unit = "groups",
    labels = false,
    label = "none",
    height = 24,
    format,
    locale,
    title,
    summary,
    strings = EN_SKYLINE,
    animate = false,
    className,
    style,
    ...rest
  } = props;
  const fontSize = props.fontSize ?? labelFont(height, 0.3);
  const hostRef = useRef<HTMLSpanElement>(null);
  // ordered by x, spread over a 500ms window — the skyline builds left→right
  // instead of every building rising in lockstep.
  useEntrance(hostRef, "rise", animate, { selector: SKYLINE_SELECTOR, order: "x", window: 500 });

  const groundY = height - (labels ? fontSize + 2 : 2);
  const geo = useMemo(
    () =>
      citySkylineGeometry({
        data,
        bw,
        height,
        groundY,
        maxH: groundY - (label === "value" ? fontSize + 1 : 2),
        gap,
        domain,
        pad: 2,
      }),
    [data, bw, gap, domain, height, groundY, label, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : citySkylineSummary(data, { unit, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const x = ((e.clientX - r.left) / r.width) * geo.width;
    const i = Math.floor((x - 2) / (bw + gap));
    setActive(i >= 0 && i < data.length ? i : null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setActive((p) => Math.min(data.length - 1, (p ?? -1) + 1));
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      setActive((p) => Math.max(0, (p ?? data.length) - 1));
      e.preventDefault();
    } else if (e.key === "Escape") setActive(null);
  };

  const b = active !== null ? geo.buildings[active] : undefined;
  const d = active !== null ? data[active] : undefined;
  const announced =
    b && d
      ? d.lit === undefined
        ? strings.citySkylineAt(d.label, fmt(d.value))
        : strings.citySkylineAtLit(
            d.label,
            fmt(d.value),
            `${Math.round(Math.min(1, Math.max(0, d.lit)) * 100)}%`,
          )
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-skyline-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticCitySkyline
        {...rest}
        style={FILL}
        data={data}
        bw={bw}
        gap={gap}
        domain={domain}
        unit={unit}
        labels={labels}
        label={label}
        fontSize={fontSize}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {b && b.h > 0 ? (
          <rect
            x={b.x - 1}
            y={b.y - 1}
            width={b.w + 2}
            height={b.h + 2}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticCitySkyline>
      <LiveRegion>{announced}</LiveRegion>
      {b && announced ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${((b.x + b.w / 2) / geo.width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {announced}
        </span>
      ) : null}
    </span>
  );
}
