"use client";
// Interactive <BubbleRow>. useActivePicker owns interaction: one pointer
// listener + nearest-bubble lookup, ←/→ (and ↑/↓) rove the row, click / Enter /
// Space selects (onSelect). Announces each bubble's exact value — the number the
// low-precision area channel can't carry. Composes the static component (canon)
// — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { labelFont } from "../../core/labels.js";
import { bubbleRowGeometry } from "./geometry.js";
import { EN_BUBBLE, type BubbleStrings } from "../../core/strings-bubble.js";
import { BubbleRow as StaticBubbleRow, bubbleRowSummary, type BubbleRowProps } from "./index.js";

export interface InteractiveBubbleRowProps extends BubbleRowProps, PickerProps {
  strings?: BubbleStrings;
  /**
   * Opt-in entrance motion (default `false`): the bubbles inflate along the
   * row, left to right, on first client-side mount. Inert on the server and
   * on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function BubbleRow(props: InteractiveBubbleRowProps): React.ReactNode {
  const {
    data,
    align = "center",
    label = "value",
    height = 30,
    gap = 2,
    format,
    locale,
    title,
    summary,
    strings = EN_BUBBLE,
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
  const fontSize = props.fontSize ?? labelFont(height, 0.34);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const hostRef = useRef<HTMLSpanElement>(null);
  // `circle` (not the default ink selector) so bubbles still inflate when a
  // literal `color` prop drops the data-mc-ink attribute. "trail" + order "x"
  // sequences the pop by real x position, left to right along the row.
  useEntrance(hostRef, "trail", animate, { selector: "circle", order: "x" });

  const labelBand = label === "none" ? 0 : fontSize + 2;
  // Same numeral-width spread as the static, so the overlay ring aligns exactly.
  const labelWidths = useMemo(
    () =>
      label === "none"
        ? undefined
        : data.map((d) => {
            if (!isFiniteValue(d.value)) return 0;
            const t = label === "both" ? `${d.label} ${fmt(d.value)}` : fmt(d.value);
            return t.length * 0.72 * fontSize + fontSize;
          }),
    [data, label, fmt, fontSize],
  );
  const geo = useMemo(
    () =>
      bubbleRowGeometry({
        values: data.map((d) => d.value),
        height,
        gap,
        align,
        pad: 1,
        labelBand,
        labelWidths,
      }),
    [data, height, gap, align, labelBand, labelWidths],
  );

  // One bubble per datum, so the unit index IS the DATA index.
  const locate = useCallback(
    (x: number) => {
      let best: number | null = null;
      let bestD = Infinity;
      for (let i = 0; i < geo.bubbles.length; i++) {
        const d = Math.abs(geo.bubbles[i]!.cx - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    [geo],
  );
  // `value` = the bubble's magnitude (the encoded area), `null` when missing.
  const datum = useCallback(
    (i: number) => {
      const d = data[i];
      const text = d
        ? isFiniteValue(d.value)
          ? strings.bubbleAt(d.label, fmt(d.value))
          : strings.bubbleEmpty(d.label)
        : "";
      return {
        index: i,
        value: d?.value ?? null,
        label: d?.label,
        formatted: text ? text.replace(/[.。]$/, "") : undefined,
      };
    },
    [data, strings, fmt],
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
        : bubbleRowSummary(data, { strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const b = geo.bubbles[i];
    if (!b) return null;
    return (
      <circle
        cx={b.cx}
        cy={b.cy}
        r={b.r}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "full"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const b = shown !== null ? geo.bubbles[shown] : undefined;
  const shownDatum = shown !== null ? data[shown] : undefined;
  const announced =
    b && shownDatum
      ? isFiniteValue(shownDatum.value)
        ? strings.bubbleAt(shownDatum.label, fmt(shownDatum.value))
        : strings.bubbleEmpty(shownDatum.label)
      : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-bubble-live", className, style)}
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticBubbleRow
        {...rest}
        style={fillFor(style)}
        data={data}
        align={align}
        label={label}
        height={height}
        gap={gap}
        fontSize={fontSize}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticBubbleRow>
      <LiveRegion>{announced}</LiveRegion>
      {readout && b && announced ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(b.cx, geo.width)}>
          {announced.replace(/[.。]$/, "")}
        </span>
      ) : null}
    </span>
  );
}
