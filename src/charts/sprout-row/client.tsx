"use client";
// Interactive <SproutRow>. useActivePicker owns interaction: one pointer
// listener + slot lookup, ←/→ (and ↑/↓) rove the row, click / Enter / Space
// selects (onSelect). Announces each item's stage; a focus ring lifts the active
// glyph. Composes the static component (overlay rings as children).
import { useCallback, useMemo, useRef } from "react";
import { labelFont } from "../../core/labels.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { sproutRowGeometry } from "./geometry.js";
import { EN_SPROUT, type SproutStrings } from "../../core/strings-sprout.js";
import {
  SproutRow as StaticSproutRow,
  sproutLayout,
  sproutRowSummary,
  type SproutRowProps,
} from "./index.js";

export interface InteractiveSproutRowProps extends SproutRowProps, PickerProps {
  strings?: SproutStrings;
  /**
   * Opt-in entrance motion (default `false`): each stage glyph settles into
   * place, staggered, when the chart first mounts client-side — echoing the
   * row sprouting in. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SproutRow(props: InteractiveSproutRowProps): React.ReactNode {
  const {
    strings = EN_SPROUT,
    title,
    summary,
    data,
    labels = false,
    // Labels stagger onto two tiers below the soil, so the default row is taller
    // when names are shown — mirror the static default exactly.
    height = labels ? 40 : 20,
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
  // "rise" from the soil: each stage glyph (data-mc-ink="point") grows upward
  // from its baseline, left→right — the row literally sprouts. "trail" scaled
  // each glyph from its own centre, which read as popping in place, not growing
  // out of the ground.
  useEntrance(hostRef, "rise", animate, {
    selector: '[data-mc-ink="point"]',
    origin: "bottom",
    order: "x",
  });
  // The SAME label-driven layout the static derives, so the overlay ring lands
  // on the glyph even when category labels widen the row.
  const lay = useMemo(
    () => sproutLayout(data, labels, fontSize, props.step),
    [data, labels, fontSize, props.step],
  );
  const geo = useMemo(
    () =>
      sproutRowGeometry({
        stages: data.map((d) => d.value),
        height,
        step: lay.step,
        pad: 2,
        padX: lay.padX,
        bottomReserve: lay.labelBand,
      }),
    [data, height, lay],
  );

  // One slot per datum, so the unit index IS the DATA index.
  const locate = useCallback(
    (x: number) => {
      const i = Math.floor((x - lay.padX) / lay.step);
      return i >= 0 && i < data.length ? i : null;
    },
    [lay, data],
  );
  // `value` = the clamped growth STAGE (0–3), the number the glyph encodes;
  // `null` for a missing item (soil tick only).
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.slots[i]?.stage ?? null, label: data[i]?.label }),
    [geo, data],
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

  const announce = (i: number | null): string => {
    if (i === null || !data[i]) return "";
    const slot = geo.slots[i]!;
    if (slot.stage === null) return strings.sproutEmpty(data[i]!.label);
    return strings.sproutStage(
      data[i]!.label,
      strings.sproutStageNames[slot.stage]!,
      slot.stage + 1,
    );
  };

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : sproutRowSummary(data, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const slot = geo.slots[i];
    if (!slot) return null;
    return (
      <circle
        cx={slot.x}
        cy={slot.baselineY - 5}
        r={7}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const announced = announce(shown);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-sprout-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticSproutRow
        {...rest}
        data={data}
        labels={labels}
        height={height}
        step={lay.step}
        fontSize={fontSize}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticSproutRow>
      <LiveRegion>{announced}</LiveRegion>
      {announced ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {announced}
        </span>
      ) : null}
    </span>
  );
}
