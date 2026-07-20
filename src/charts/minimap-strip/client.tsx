"use client";
// Interactive <MinimapStrip>. Drag or click to move the viewport
// window; ←/→ nudge 5% (Shift 20%). The window maps linearly to the domain — no
// fisheye. Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { fillFor, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_MINIMAP } from "../../core/strings-minimap.js";
import { minimapDomain, minimapWindow } from "./geometry.js";
import {
  MinimapStrip as StaticMinimapStrip,
  minimapSummary,
  type MinimapStripProps,
} from "./index.js";

export interface InteractiveMinimapProps extends MinimapStripProps {
  onWindowChange?: (window: [number, number]) => void;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes in left to
   * right on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function MinimapStrip(props: InteractiveMinimapProps): React.ReactNode {
  const {
    data,
    domain: domainProp,
    width = 120,
    height = 16,
    format,
    locale,
    strings = EN_MINIMAP,
    title,
    summary,
    onWindowChange,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const domain = useMemo(() => minimapDomain(data, domainProp), [domainProp, data]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // A slider always has a position: an unmeasurable window starts as the whole
  // domain, so drag/keys have something real to move.
  const [win, setWin] = useState<[number, number]>(
    () => minimapWindow(data.window) ?? [domain[0], domain[1]],
  );

  const span = domain[1] - domain[0] || 1;
  const winSpan = win[1] - win[0];

  const setCenter = useCallback(
    (center: number) => {
      const half = winSpan / 2;
      let lo = center - half;
      lo = Math.max(domain[0], Math.min(domain[1] - winSpan, lo));
      const next: [number, number] = [lo, lo + winSpan];
      setWin(next);
      onWindowChange?.(next);
    },
    [winSpan, domain, onWindowChange],
  );

  const onPointer = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.buttons !== 1 && e.type === "pointermove") return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const v = domain[0] + ((e.clientX - r.left) / r.width) * span;
      setCenter(v);
    },
    [domain, span, setCenter],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = span * (e.shiftKey ? 0.2 : 0.05);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCenter((win[0] + win[1]) / 2 + step);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCenter((win[0] + win[1]) / 2 - step);
      }
    },
    [span, win, setCenter],
  );

  const liveData = { ...data, window: win };
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : minimapSummary(liveData, domain, 0, strings, fmt);
  // `label` doubles as the aria-label fallback below: a slider must always have
  // a name, even when the summary is opted out and no title is given.
  const label = [title, strings.minimapView(fmt(win[0]), fmt(win[1]), fmt(span))]
    .filter(Boolean)
    .join(". ");

  return (
    <span
      ref={hostRef}
      {...wrap("mc-minimap-live", className, style)}
      tabIndex={0}
      role="slider"
      aria-label={[title, accName].filter(Boolean).join(". ") || label}
      aria-valuemin={domain[0]}
      aria-valuemax={domain[1]}
      aria-valuenow={Math.round((win[0] + win[1]) / 2)}
      aria-valuetext={label}
      onPointerDown={onPointer}
      onPointerMove={onPointer}
      onKeyDown={onKeyDown}
    >
      <StaticMinimapStrip
        {...rest}
        data={liveData}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      />
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
        {strings.minimapView(fmt(win[0]), fmt(win[1]), fmt(span))}
      </span>
    </span>
  );
}
