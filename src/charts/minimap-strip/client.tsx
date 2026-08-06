"use client";
// Interactive <MinimapStrip>. Drag or click to move the viewport
// window; ←/→ nudge 5% (Shift 20%). The window maps linearly to the domain — no
// fisheye. Hover/focus/drag floats the window's own range as a chip, so
// edges the slider reports to assistive tech are visible too.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { CHIP, fillFor, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_MINIMAP } from "../../core/strings-minimap.js";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  minimapDomain,
  minimapFog,
  minimapWindow,
} from "./geometry.js";
import { chartSide } from "../../core/types.js";
import {
  MinimapStrip as StaticMinimapStrip,
  minimapSummary,
  type MinimapStripProps,
} from "./index.js";

export interface InteractiveMinimapProps extends MinimapStripProps {
  onWindowChange?: (window: [number, number]) => void;
  /**
   * Show the floating window-range chip on hover/focus/drag (default `true`).
   * `false` suppresses only the chip — `aria-valuetext` and `onWindowChange`
   * are untouched, so the range can be rendered elsewhere.
   */
  readout?: boolean;
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
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_MINIMAP,
    title,
    summary,
    onWindowChange,
    animate = false,
    readout = true,
    className,
    style,
    ...rest
  } = props;

  // Same resolution the static entry makes, for the same reason: the chip's x
  // is computed here, and a non-finite `width` put it at `NaN%`.
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);
  const [open, setOpen] = useState(false);

  const domain = useMemo(() => minimapDomain(data, domainProp), [domainProp, data]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Viewed share — a percent of its own, so `locale` but never `format`.
  const pctFmt = useMemo(() => makePercentFormatter(locale), [locale]);
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
  // The fog is painted by the composed static from the same `known`, but the
  // name here passed a flat 0 — the interactive strip showed 8% of itself
  // hatched as unknown and told a screen reader nothing about it.
  const unknownShare = useMemo(() => minimapFog(data.known, domain).unknownShare, [data, domain]);
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : minimapSummary(liveData, domain, unknownShare, strings, fmt, pctFmt);
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
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
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
      {/* The window edges are the whole point of the control, and until now
          only `aria-valuetext` carried them — a sighted reader dragging saw a
          rectangle and no numbers. The chip rides over the window's centre. */}
      {readout && open ? (
        <span className="mc-spark-readout" {...CHIP}>
          {`${fmt(win[0])}–${fmt(win[1])}`}
        </span>
      ) : null}
    </span>
  );
}
