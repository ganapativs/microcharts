"use client";
// Interactive <BubbleRow>. Nearest-bubble pointer lookup + ←/→
// roving; announces each bubble's exact value (the number the low-precision area
// can't carry); the focused bubble gets a thicker ring. Composes the static.
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { labelFont } from "../../core/labels.js";
import { bubbleRowGeometry } from "./geometry.js";
import { EN_BUBBLE, type BubbleStrings } from "../../core/strings-bubble.js";
import { BubbleRow as StaticBubbleRow, bubbleRowSummary, type BubbleRowProps } from "./index.js";

export interface InteractiveBubbleRowProps extends BubbleRowProps {
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
    className,
    style,
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
            if (d.value === null) return 0;
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
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : bubbleRowSummary(data, { strings, format, locale });
  const label2 = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0) return;
    const x = ((e.clientX - r.left) / r.width) * geo.width;
    let best = 0;
    let bestD = Infinity;
    geo.bubbles.forEach((b, i) => {
      const d = Math.abs(b.cx - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive(best);
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

  const b = active !== null ? geo.bubbles[active] : undefined;
  const datum = active !== null ? data[active] : undefined;
  const announced =
    b && datum && datum.value !== null ? strings.bubbleAt(datum.label, fmt(datum.value)) : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-bubble-live ${className}` : "mc-bubble-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label2}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBubbleRow
        {...rest}
        style={FILL}
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
        {b ? (
          <circle
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="full"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticBubbleRow>
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
      {b && announced ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(b.cx / geo.width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {/* chips are terse — the live region keeps the full sentence */}
          {announced.replace(/[.。]$/, "")}
        </span>
      ) : null}
    </span>
  );
}
