"use client";
// Interactive <TreeRings>. useActivePicker owns interaction: one pointer
// listener + radial lookup (distance from centre → ring index). ←/→ (and ↑/↓)
// step inner→outer, click / Enter / Space selects (onSelect).
import { useCallback, useMemo, useRef, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
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
import { treeRingsGeometry, treeRingsSize, TREE_PAD } from "./geometry.js";
import { EN_TREE, type TreeStrings } from "../../core/strings-tree.js";
import {
  TreeRings as StaticTreeRings,
  treeRingsSummary,
  treeRingsWidth,
  type TreeRingsProps,
} from "./index.js";

export interface InteractiveTreeRingsProps extends TreeRingsProps, PickerProps {
  strings?: TreeStrings;
  /**
   * Opt-in entrance motion (default `false`): the ring disc fades and scales
   * in on first client-side mount — rings are merged into O(1) path nodes for
   * the SSR hot path, so a per-ring stagger isn't available; a center-out
   * scale echoes the rings growing outward instead. Inert on the server and
   * on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TreeRings(props: InteractiveTreeRingsProps): React.ReactNode {
  const {
    data,
    total,
    size,
    label = "none",
    periodWord = "period",
    unit = "periods",
    format,
    locale,
    title,
    summary,
    strings = EN_TREE,
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

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "grow", animate);

  // Same resolver the static uses, so a hostile `size` cannot put the pointer
  // basis and the painted disc on different scales.
  const box = treeRingsSize(size);
  const geo = useMemo(
    () => treeRingsGeometry({ values: data, size: box, pad: TREE_PAD, total }),
    [data, box, total],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // `periodWord[0]` is a UTF-16 code unit, not a character: an astral noun
  // ("🌲 ring") capitalised to half a surrogate pair, and `periodWord=""` threw
  // on mount (`undefined.toUpperCase()`) — a caller-supplied string crashing
  // the whole chart.
  const periodLabel = useCallback(
    (i: number) => {
      const head = [...periodWord][0] ?? "";
      return `${head.toUpperCase()}${periodWord.slice(head.length)} ${i + 1}`.trim();
    },
    [periodWord],
  );

  // Pointer (viewBox space) → ring index by distance from centre; miss → null.
  const locate = useCallback(
    (x: number, y: number) => {
      const dx = x - geo.center.cx;
      const dy = y - geo.center.cy;
      const dist = Math.hypot(dx, dy);
      const rg = geo.rings.find((r) => r.rOuter > r.rInner && dist >= r.rInner && dist <= r.rOuter);
      return rg ? rg.index : null;
    },
    [geo],
  );

  // ↑/↓ alias →/← (inner↔outer reads as up/down on a ring stack).
  const step = useCallback(
    (cur: number, key: string) => {
      const n = data.length;
      if (n === 0) return null;
      switch (key) {
        case "ArrowRight":
        case "ArrowUp":
          return Math.min(n - 1, cur + 1);
        case "ArrowLeft":
        case "ArrowDown":
          return cur <= 0 ? 0 : cur - 1;
        case "Home":
          return 0;
        case "End":
          return n - 1;
      }
      return null;
    },
    [data.length],
  );

  // Rings are 1:1 with data; index = ring/period index, value = its number.
  const datum = useCallback(
    (i: number) => {
      const rg = geo.rings[i];
      return {
        index: i,
        value: rg?.value ?? null,
        label: periodLabel(i),
        formatted: rg ? strings.treeRingAt(periodLabel(rg.index), fmt(rg.value)) : undefined,
      };
    },
    [geo, periodLabel, fmt, strings],
  );

  // `label="last"` widens the static's viewBox by a right gutter; the pointer
  // basis has to follow it, or every angle is measured in a squeezed x-space.
  const { active, selected, bind } = useActivePicker({
    count: data.length,
    width: treeRingsWidth({ data, size: box, label, fontSize: props.fontSize, labelSize: props.labelSize, fmt }),
    height: box,
    locate,
    datum,
    step,
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
        : treeRingsSummary(data, { unit, periodWord, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const halo = (i: number, pinned: boolean) => {
    const rg = geo.rings[i];
    if (!rg || rg.rOuter <= rg.rInner) return null;
    return (
      <circle
        cx={geo.center.cx}
        cy={geo.center.cy}
        r={(rg.rInner + rg.rOuter) / 2}
        fill="none"
        data-mc-active=""
        // geometric, not a role: this literal IS the ring's own thickness
        // (the data-encoded channel), so the focus halo matches its width exactly.
        // Inline style, not the presentation attribute: the `data-mc-w` pin marker
        // below matches a stylesheet stroke-width rule, and any CSS declaration
        // beats a presentation attribute — inline style is what actually wins.
        // No `non-scaling-stroke` either, for the same reason: this width is
        // viewBox geometry, so pinning it to screen pixels made the halo stop
        // covering its ring the moment the chart was rendered at anything other
        // than 1:1. The width roles the sibling dials use are not geometry.
        //
        // The overlay wash is off here, and this is the one chart where that is
        // structural rather than taste: the halo is a CIRCLE whose stroke spans
        // one ring, so filling it paints the entire disc and buries every inner
        // ring under it. The outline is the whole treatment.
        style={
          {
            strokeWidth: Math.max(1, rg.rOuter - rg.rInner),
            "--mc-active-fill-opacity": 0,
          } as CSSProperties
        }
        strokeOpacity={pinned ? 0.55 : 0.3}
        data-mc-w={pinned ? "tick" : undefined}
      />
    );
  };

  const shown = active ?? selected;
  const shownRing = shown !== null ? geo.rings[shown] : undefined;
  const announced = shownRing
    ? strings.treeRingAt(periodLabel(shownRing.index), fmt(shownRing.value))
    : "";

  return (
    <span ref={hostRef} {...wrap("mc-tree-live", className, style)} {...named(ariaLabel)} {...bind}>
      <StaticTreeRings
        {...rest}
        data={data}
        total={total}
        size={box}
        label={label}
        periodWord={periodWord}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      >
        {selected !== null && selected !== active ? halo(selected, true) : null}
        {active !== null ? halo(active, false) : null}
        {rest.children}
      </StaticTreeRings>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownRing ? (
        <span className="mc-spark-readout" {...CHIP}>
          {announced}
        </span>
      ) : null}
    </span>
  );
}
