"use client";
// Interactive <CometTrail>. Motion only on data change — no idle
// loop: the head EASES to each new value (WAAPI transform, ~200 ms) and the old
// head decays into the trail. A continuous stream makes the comet; a stalled
// stream goes still, which is itself the signal. The dot jumps to truth, eased,
// never simulated between updates. Reduced-motion → instant reposition (the static
// encoding is already complete). Composes the static component (canon).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion, useInViewport } from "../../shared/motion.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_COMET_TRAIL, type CometTrailStrings } from "../../core/strings-comet-trail.js";
import { LiveRegion } from "../../shared/live-region.js";
import { cometTrailGeometry } from "./geometry.js";
import {
  CometTrail as StaticCometTrail,
  cometTrailSummary,
  type CometTrailProps,
} from "./index.js";

export interface InteractiveCometTrailProps extends CometTrailProps {
  strings?: CometTrailStrings;
}

export function CometTrail(props: InteractiveCometTrailProps): React.ReactNode {
  const {
    data,
    trail = 12,
    label = "last",
    domain,
    width = 60,
    height = 16,
    format,
    locale,
    strings = EN_COMET_TRAIL,
    title,
    summary,
    className,
    style,
    ...rest
  } = props;
  const fontSize = props.fontSize ?? labelFont(height);

  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInViewport<HTMLSpanElement>();
  const labelBand = label === "last" ? fontSize * 3 : 0;
  const geo = useMemo(
    () =>
      cometTrailGeometry({ values: data, width: width - labelBand, height, domain, trail, pad: 1 }),
    [data, width, labelBand, height, domain, trail],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null); // trail position, null = head
  const [announced, setAnnounced] = useState("");
  const prevHead = useRef<{ cx: number; cy: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : cometTrailSummary(data, { trail, strings, format, locale });
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  // Ease the head to its new position on each data change (transform, not layout).
  useEffect(() => {
    const head = wrapRef.current?.querySelector<SVGCircleElement>(".mc-comet-head");
    if (!head || !geo.head) {
      prevHead.current = geo.head ? { cx: geo.head.cx, cy: geo.head.cy } : null;
      return;
    }
    const prev = prevHead.current;
    prevHead.current = { cx: geo.head.cx, cy: geo.head.cy };
    if (!prev || reduced || !inView) return;
    const dx = prev.cx - geo.head.cx;
    const dy = prev.cy - geo.head.cy;
    if (dx === 0 && dy === 0) return;
    head.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0px, 0px)" }],
      { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }, [geo, reduced, inView, wrapRef]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const len = geo.trail.length;
      if (geo.head === null) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((p) => {
          const next = p === null ? 0 : Math.min(len - 1, p + 1);
          if (len === 0) return null;
          const t = geo.trail[next]!;
          setAnnounced(strings.cometTrailAt(next + 1, fmt(data[t.index] ?? NaN)));
          return next;
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((p) => {
          if (p === null || p === 0) {
            setAnnounced(cometTrailSummary(data, { trail, strings, format, locale }));
            return null;
          }
          const next = p - 1;
          const t = geo.trail[next]!;
          setAnnounced(strings.cometTrailAt(next + 1, fmt(data[t.index] ?? NaN)));
          return next;
        });
      } else if (e.key === "Escape") {
        setActive(null);
        setAnnounced("");
      }
    },
    [geo, data, trail, strings, fmt, format, locale],
  );

  const activeMark = active !== null ? geo.trail[active] : (geo.head ?? undefined);

  return (
    <span
      ref={wrapRef}
      {...wrap("mc-comet-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticCometTrail
        {...rest}
        style={FILL}
        data={data}
        trail={trail}
        label={label}
        domain={domain}
        width={width}
        height={height}
        fontSize={fontSize}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {active !== null && activeMark ? (
          <circle
            cx={activeMark.cx}
            cy={activeMark.cy}
            r={activeMark.r + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticCometTrail>
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
