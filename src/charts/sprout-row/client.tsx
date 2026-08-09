"use client";
// Interactive <SproutRow>. useActivePicker owns interaction: one pointer
// listener + slot lookup, ←/→ (and ↑/↓) rove the row, click / Enter / Space
// selects (onSelect). Announces each item's stage; a focus ring lifts the active
// glyph.
import { useCallback, useMemo, useRef } from "react";
import { round2 } from "../../core/types.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { sproutRowGeometry, stageGlyphBox } from "./geometry.js";
import { EN_SPROUT, type SproutStrings } from "../../core/strings-sprout.js";
import {
  SproutRow as StaticSproutRow,
  sproutBox,
  sproutLabelsFit,
  sproutLayout,
  sproutRowSummary,
  type SproutRowProps,
} from "./index.js";

export interface InteractiveSproutRowProps extends SproutRowProps, PickerProps {
  strings?: SproutStrings;
  /**
   * Opt-in entrance motion (default `false`): each stage glyph grows upward from
   * the soil, staggered left to right, when the chart first mounts client-side —
   * the row literally sprouts in. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

/** Mirrors the static entry's `PAD` — the glyph's usable height is `baselineY - PAD`. */
const PAD = 2;
/** Breathing room between the painted glyph and the focus ring. */
const RING_PAD = 1.5;

export function SproutRow(props: InteractiveSproutRowProps): React.ReactNode {
  const {
    strings = EN_SPROUT,
    title,
    summary,
    data,
    labels = false,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;
  // The static's own resolution, not a second copy of it: the hit box, the ring
  // and the painted glyphs all have to be sized against one box.
  const { height, fontSize } = sproutBox(labels, props.height, props.fontSize, props.labelSize);
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
    // Mirror the static's label DROP, not just its layout: keeping a band the
    // static dropped would offset every hit-test by the gutter width.
    () =>
      sproutLayout(
        data,
        labels && sproutLabelsFit(data, fontSize, height, props.step),
        fontSize,
        props.step,
      ),
    [data, labels, fontSize, height, props.step],
  );
  const geo = useMemo(
    () =>
      sproutRowGeometry({
        stages: data.map((d) => d.value),
        height,
        step: lay.step,
        pad: PAD,
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
    (i: number) => {
      const stage = geo.slots[i]?.stage ?? null;
      // Mirror the chip, which renders the same announcement string (see `announce`).
      const formatted = !data[i]
        ? ""
        : stage === null
          ? strings.sproutEmpty(data[i]!.label)
          : strings.sproutStage(data[i]!.label, strings.sproutStageNames[stage]!, stage + 1);
      return { index: i, value: stage, label: data[i]?.label, formatted };
    },
    [geo, data, strings],
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

  // Concentric on what the glyph actually paints, at every stage and height —
  // a fixed radius/offset only lands on the plant at one size, and rode ~10px
  // above a seed dot at height 36.
  const ring = (i: number, pinned: boolean) => {
    const slot = geo.slots[i];
    if (!slot) return null;
    // A missing item paints no glyph; ring the seed-sized spot on the soil.
    const b = stageGlyphBox(slot.stage ?? 0, slot.x, slot.baselineY, slot.baselineY - PAD);
    // No scrub `data-mc-ui` here: `<ellipse>` is not in the shared rule's
    // selector, and carrying it on a transformed `<g>` puts the ring's own
    // coordinates at the origin — `getBBox()` reports a box in the element's
    // own user space, so the concentric-ring guard would measure this ring
    // against the glyph it names and find it half a chart away.
    return (
      <ellipse
        cx={round2((b.x0 + b.x1) / 2)}
        cy={round2((b.y0 + b.y1) / 2)}
        rx={round2((b.x1 - b.x0) / 2 + RING_PAD)}
        ry={round2((b.y1 - b.y0) / 2 + RING_PAD)}
        fill="none"
        data-mc-active=""
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
      {...named(ariaLabel)}
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
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticSproutRow>
      <LiveRegion>{announced}</LiveRegion>
      {readout && announced ? (
        <span className="mc-spark-readout" {...CHIP}>
          {announced}
        </span>
      ) : null}
    </span>
  );
}
