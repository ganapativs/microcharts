"use client";
// Interactive <BubbleRow> (plan/24 #11). Nearest-bubble pointer lookup + ←/→
// roving; announces each bubble's exact value (the number the low-precision area
// can't carry); the focused bubble gets a thicker ring. Composes the static.
import { useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { bubbleRowGeometry } from "./geometry.js";
import { EN_BUBBLE, type BubbleStrings } from "../../core/strings-bubble.js";
import { BubbleRow as StaticBubbleRow, bubbleRowSummary, type BubbleRowProps } from "./index.js";

export interface InteractiveBubbleRowProps extends BubbleRowProps {
  strings?: BubbleStrings;
}

export function BubbleRow(props: InteractiveBubbleRowProps): React.ReactNode {
  const {
    data,
    align = "center",
    label = "value",
    height = 30,
    gap = 2,
    fontSize = 6,
    format,
    locale,
    title,
    summary,
    strings = EN_BUBBLE,
    ...rest
  } = props;

  const labelBand = label === "none" ? 0 : fontSize + 2;
  const geo = useMemo(
    () =>
      bubbleRowGeometry({
        values: data.map((d) => d.value),
        height,
        gap,
        align,
        pad: 1,
        labelBand,
      }),
    [data, height, gap, align, labelBand],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
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

  return (
    <span
      className="mc-bubble-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
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
            strokeWidth={1.5}
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
          {announced}
        </span>
      ) : null}
    </span>
  );
}
