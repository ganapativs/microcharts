"use client";
// Interactive <CitySkyline>. useActivePicker owns interaction: one pointer
// listener + x-band lookup → highlight the building + announce it, ←/→ roving,
// click / Enter / Space selects (onSelect). The lit fraction is announced as a
// percent (secondary channel). Composes the static component.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { labelFont } from "../../core/labels.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
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

export interface InteractiveCitySkylineProps extends CitySkylineProps, PickerProps {
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
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  const fontSize = props.fontSize ?? labelFont(height, 0.3);
  const hostRef = useRef<HTMLSpanElement>(null);
  // ordered by x, spread over a 500ms window — the skyline builds left→right
  // instead of every building rising in lockstep.
  useEntrance(hostRef, "rise", animate, { selector: SKYLINE_SELECTOR, order: "x", window: 500 });

  // Pads mirror the static EXACTLY (bottom = fontSize + 4, top = fontSize + 2
  // when values are labelled) — a smaller pad here drew every building against
  // a taller plot than the one rendered, so the rings sat off the roofs.
  const groundY = height - (labels ? fontSize + 4 : 2);
  const geo = useMemo(
    () =>
      citySkylineGeometry({
        data,
        bw,
        height,
        groundY,
        maxH: groundY - (label === "value" ? fontSize + 2 : 2),
        gap,
        domain,
        pad: 2,
      }),
    [data, bw, gap, domain, height, groundY, label, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // One building per datum, so the unit index IS the DATA index.
  const locate = useCallback(
    (x: number) => {
      const i = Math.floor((x - 2) / (bw + gap));
      return i >= 0 && i < data.length ? i : null;
    },
    [bw, gap, data],
  );
  // `value` = the building's height value (the primary, zero-anchored channel);
  // `lit` is the secondary channel and rides in the announcement, not the datum.
  const datum = useCallback(
    (i: number) => ({ index: i, value: data[i]?.value ?? null, label: data[i]?.label }),
    [data],
  );

  const { active, selected, bind } = useActivePicker({
    count: data.length,
    width: geo.width,
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
        : citySkylineSummary(data, { unit, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const bl = geo.buildings[i];
    if (!bl || bl.h <= 0) return null;
    return (
      <rect
        x={bl.x - 1}
        y={bl.y - 1}
        width={bl.w + 2}
        height={bl.h + 2}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const b = shown !== null ? geo.buildings[shown] : undefined;
  const d = shown !== null ? data[shown] : undefined;
  // Read the lit fraction off the GEOMETRY, not the raw datum: the geometry has
  // already resolved "unknown" (absent or non-finite) to null and clamped the
  // rest. Re-clamping `d.lit` here meant `Math.max(0, NaN)` → "NaN% lit" in the
  // live region — and it duplicated a clamp that has one home.
  const announced =
    b && d
      ? !isFiniteValue(d.value)
        ? strings.citySkylineEmpty(d.label)
        : b.lit === null
          ? strings.citySkylineAt(d.label, fmt(d.value))
          : strings.citySkylineAtLit(d.label, fmt(d.value), `${Math.round(b.lit * 100)}%`)
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-skyline-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticCitySkyline
        {...rest}
        style={fillFor(style)}
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
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
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
