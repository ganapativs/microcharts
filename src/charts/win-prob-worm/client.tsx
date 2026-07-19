"use client";
// Interactive <WinProbWorm>. useActivePicker owns interaction: one pointer
// listener + nearest-x lookup, ←/→ (Home/End) rove the points (each announcing
// the current leader + probability), click / Enter / Space selects (onSelect).
// Composes the static component (canon) — the crosshair + readout chip are
// overlay children, the worm/midline/dots come from the static so the two
// entries can never drift.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { isFiniteValue } from "../../core/types.js";
import { clamp } from "../../core/scale.js";
import { labelFont } from "../../core/labels.js";
import { EN_WIN_PROB_WORM, type WinProbWormStrings } from "../../core/strings-win-prob-worm.js";
import { PAD, leaderProb, resolveWormGeo, winProbWormSummary } from "./geometry.js";
import { WinProbWorm as StaticWinProbWorm, type WinProbWormProps } from "./index.js";

export interface InteractiveWinProbWormProps extends WinProbWormProps, PickerProps {
  strings?: WinProbWormStrings;
  /**
   * Opt-in entrance motion (default `false`): the worm draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const pct = (v: number, fmt: (n: number) => string): string => `${fmt(v)}%`;

export function WinProbWorm(props: InteractiveWinProbWormProps): React.ReactNode {
  const {
    data,
    sides = ["A", "B"],
    label = "last",
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_WIN_PROB_WORM,
    title,
    summary,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The worm is one line split into below-50 (muted) + above-50 (accent) paths;
  // stagger 0 starts both draw fronts together so the single worm reads as one
  // continuous trace, not two sequential strokes.
  useEntrance(hostRef, "draw", animate, {
    selector: 'path[data-mc-ink="muted"], path[data-mc-ink="accent"]',
    stagger: 0,
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const FONT = labelFont(height);

  // Geometry must match the static entry EXACTLY (same shared resolve), so the
  // overlay + pointer math never drift.
  const geo = useMemo(
    () => resolveWormGeo({ width, height, data, label, font: FONT, fmt }),
    [width, height, data, label, FONT, fmt],
  );

  const plotW = Math.max(0, width - 2 * PAD - geo.gutter);
  const lastX = Math.max(1, data.length - 1);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo.geo === null
          ? strings.noData
          : winProbWormSummary(geo.geo, fmt, strings, sides);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const locate = useCallback(
    (x: number) => {
      if (geo.geo === null || data.length === 0) return null;
      const i = Math.round(((x - PAD) / Math.max(1, plotW)) * (data.length - 1));
      return clamp(i, 0, data.length - 1);
    },
    [geo.geo, data.length, plotW],
  );
  // index = the DATA index (points are 1:1 with `data`, gaps included);
  // value = the win probability at that point (clamped 0–100), `null` in a gap.
  const datum = useCallback(
    (i: number) => ({
      index: i,
      value: isFiniteValue(data[i]) ? clamp(data[i] as number, 0, 100) : null,
    }),
    [data],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.geo === null ? 0 : data.length,
    width,
    height,
    locate,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const crosshair = (i: number, pinned: boolean) => {
    if (!isFiniteValue(data[i])) return null;
    const x = PAD + (i / lastX) * plotW;
    return (
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        data-mc-ink="accent"
        data-mc-w={pinned ? "tick" : "support"}
        strokeDasharray="1.5 1.5"
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  // The point shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shownValue = shown !== null && isFiniteValue(data[shown]) ? (data[shown] as number) : null;
  const clampedShown = shownValue === null ? null : clamp(shownValue, 0, 100);
  const announced =
    clampedShown === null
      ? ""
      : strings.winProbWormAt(
          shown! + 1,
          clampedShown >= 50 ? sides[0] : sides[1],
          pct(leaderProb(clampedShown), fmt),
        );
  const px = shown !== null ? PAD + (shown / lastX) * plotW : 0;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-win-prob-worm-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticWinProbWorm
        {...rest}
        data={data}
        sides={sides}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; the crosshair is transient. */}
        {selected !== null && selected !== active ? crosshair(selected, true) : null}
        {active !== null ? crosshair(active, false) : null}
        {rest.children}
      </StaticWinProbWorm>
      {clampedShown !== null ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(px / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {pct(leaderProb(clampedShown), fmt)}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
