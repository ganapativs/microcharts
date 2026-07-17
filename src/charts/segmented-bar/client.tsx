"use client";
// Interactive <SegmentedBar>. One pointer listener; segment by
// x lookup. ←/→ rove segments incl. "Other", which announces its member count
// ("Other: 5%, 3 categories."). Composes the static component (canon).
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
import { LiveRegion } from "../../shared/live-region.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { largestRemainderPercents, rollup, segmentedBarGeometry } from "./geometry.js";
import {
  SegmentedBar as StaticSegmentedBar,
  sharesSummary,
  type SegmentedBarProps,
} from "./index.js";

export interface InteractiveSegmentedBarProps extends SegmentedBarProps {
  strings?: CompositionStrings;
  /**
   * Opt-in entrance motion (default `false`): segments sweep in left to right,
   * assembling into the whole bar on first client-side mount. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SegmentedBar(props: InteractiveSegmentedBarProps): React.ReactNode {
  const {
    data,
    maxSegments = 5,
    order = "data",
    width = 60,
    height = 10,
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
  // "sweep" from the left — a part-to-whole bar reads best assembling left→right
  // (each segment grows from its own left edge) rather than fading in place.
  useEntrance(hostRef, "sweep", animate, {
    selector: 'rect[data-mc-cat], rect[data-mc-ink="neutral"]',
  });

  const rolled = useMemo(() => {
    let r = rollup(data, maxSegments, strings.otherLabel);
    if (order === "desc") {
      r = [...r].sort((a, b) =>
        a.label === strings.otherLabel
          ? 1
          : b.label === strings.otherLabel
            ? -1
            : b.value - a.value,
      );
    }
    return r;
  }, [data, maxSegments, order, strings]);

  const fontSize = Math.max(5, Math.min(Math.round(height * 0.6), 7));
  const geo = useMemo(
    () => segmentedBarGeometry({ width, height, values: rolled.map((d) => d.value), fontSize }),
    [width, height, rolled, fontSize],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pcts = useMemo(() => largestRemainderPercents(geo.segments.map((s) => s.share)), [geo]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : sharesSummary(rolled, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.segments.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = geo.segments.findIndex((s) => x >= s.x && x <= s.x + s.w + 0.5);
      setActive(i >= 0 ? i : null);
    },
    [geo, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.segments.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
          next = Math.min(geo.segments.length - 1, cur + 1);
          break;
        case "ArrowLeft":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.segments.length - 1;
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

  const seg = active !== null ? geo.segments[active] : undefined;
  const datum = seg ? rolled[seg.index] : undefined;
  const announced =
    seg && datum
      ? datum.members > 1
        ? strings.shareOther(datum.label, `${pcts[active!]}%`, datum.members)
        : strings.shareAt(datum.label, `${pcts[active!]}%`, fmt(datum.value))
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
      className={className ? `mc-segbar-live ${className}` : "mc-segbar-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticSegmentedBar
        {...rest}
        style={FILL}
        data={data}
        maxSegments={maxSegments}
        order={order}
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
            y={0.5}
            width={seg.w + 1}
            height={height - 1}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticSegmentedBar>
      <LiveRegion>{announced}</LiveRegion>
      {seg && datum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((seg.x + seg.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${datum.label} ${pcts[active!]}%`}
        </span>
      ) : null}
    </span>
  );
}
