"use client";
// Interactive <LikertStrip>. One pointer listener; segment by
// x-band lookup. ←/→ step levels in DATA order ("Agree: 34%, level 4 of 5.").
// Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { likertStripGeometry } from "./geometry.js";
import { LikertStrip as StaticLikertStrip, likertSummary, type LikertStripProps } from "./index.js";

export interface InteractiveLikertStripProps extends LikertStripProps {
  strings?: CompositionStrings;
  /**
   * Opt-in entrance motion (default `false`): segments sweep outward from the
   * center line on first client-side mount — negative ink grows left, positive
   * right. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function LikertStrip(props: InteractiveLikertStripProps): React.ReactNode {
  const {
    data,
    neutral = "split",
    label = "ends",
    width = 60,
    height = 12,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // "sweep" with per-mark signed origin — the diverging composition grows OUT
  // from the center line: negative ink grows leftward (origin right), positive
  // rightward (origin left), echoing the encoding instead of a flat fade.
  useEntrance(hostRef, "sweep", animate, {
    origin: "signed",
    selector:
      'rect[data-mc-ink="negative"], rect[data-mc-ink="positive"], rect[data-mc-ink="neutral"]',
  });

  const fontSize = 5;
  const gutter = label === "none" ? 0 : Math.ceil(4 * fontSize * 0.62) + 2;
  const geo = useMemo(
    () =>
      likertStripGeometry({
        width,
        height,
        values: data.map((d) => d.value),
        neutral,
        gutterL: gutter,
        gutterR: gutter,
      }),
    [width, height, data, neutral, gutter],
  );
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );
  const [active, setActive] = useState<number | null>(null); // segment array index

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo
          ? likertSummary(geo.shares, data.length % 2 === 1, pctFmt, strings)
          : strings.noResponses;
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || geo.segments.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = geo.segments.findIndex((s) => x >= s.x && x <= s.x + s.width);
      setActive(i >= 0 ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo || geo.segments.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.segments.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
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

  const seg = geo && active !== null ? geo.segments[active] : undefined;
  const datum = seg ? data[seg.level] : undefined;
  const announced =
    seg && datum
      ? strings.likertAt(datum.label, pctFmt(seg.share), seg.level + 1, data.length)
      : "";

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-likert-live ${className}` : "mc-likert-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticLikertStrip
        {...rest}
        style={FILL}
        data={data}
        neutral={neutral}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {seg ? (
          <rect
            x={seg.x - 0.5}
            y={1}
            width={seg.width + 1}
            height={height - 2}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticLikertStrip>
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
      {seg && datum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((seg.x + seg.width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${datum.label} ${pctFmt(seg.share)}`}
        </span>
      ) : null}
    </span>
  );
}
