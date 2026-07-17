"use client";
// Interactive <DualWindowMeter>. One pointer listener; nearest
// sample by x reveals both window values against the target. ←/→ rove points.
// Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_DUAL_WINDOW } from "../../core/strings-dual-window.js";
import { rollingMean } from "./geometry.js";
import {
  DualWindowMeter as StaticDualWindowMeter,
  dualWindowSummary,
  type DualWindowMeterProps,
} from "./index.js";

export interface InteractiveDualWindowMeterProps extends DualWindowMeterProps {
  /**
   * Opt-in entrance motion (default `false`): the fast and slow lines draw on
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function DualWindowMeter(props: InteractiveDualWindowMeterProps): React.ReactNode {
  const {
    data,
    target,
    windows = [3, 30],
    label = "last",
    width = 100,
    height = 24,
    format,
    locale,
    strings = EN_DUAL_WINDOW,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const [wf, ws] = windows[0] < windows[1] ? windows : [windows[1], windows[0]];
  const fast = useMemo(() => rollingMean(data, wf), [data, wf]);
  const slow = useMemo(() => rollingMean(data, ws), [data, ws]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.36), 7));
  const gutter =
    label === "last"
      ? Math.min(
          width * 0.35,
          Math.max(fmt(lastFinite(fast) ?? 0).length, fmt(lastFinite(slow) ?? 0).length, 1) *
            fontSize *
            0.62 +
            3,
        )
      : 0;
  const pad = 1;
  const plotW = Math.max(1, width - gutter - pad * 2);
  const n = Math.max(1, data.length - 1);
  const xOf = (i: number) => pad + (i / n) * plotW;

  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : dualWindowSummary(lastFinite(fast), lastFinite(slow), target, strings, fmt);
  const labelText = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (data.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      const i = Math.max(0, Math.min(data.length - 1, Math.round(((x - pad) / plotW) * n)));
      setActive(i);
    },
    [data.length, width, plotW, n],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (data.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? data.length - 1;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          return Math.min(data.length - 1, cur + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          return Math.max(0, cur - 1);
        }
        if (e.key === "Escape") return null;
        return prev;
      });
    },
    [data.length],
  );

  const f = active != null ? fast[active] : null;
  const s = active != null ? slow[active] : null;
  const announced =
    active != null
      ? strings.dualWindowAt(f == null ? "—" : fmt(f), s == null ? "—" : fmt(s), fmt(target))
      : "";
  const crossX = active != null ? xOf(active) : 0;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-dualwin-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={labelText}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDualWindowMeter
        {...rest}
        data={data}
        target={target}
        windows={[wf, ws]}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {active != null ? (
          <line
            x1={crossX}
            x2={crossX}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticDualWindowMeter>
      <LiveRegion>{announced}</LiveRegion>
      {active != null ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(crossX / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${f == null ? "—" : fmt(f)} · ${s == null ? "—" : fmt(s)}`}
        </span>
      ) : null}
    </span>
  );
}

function lastFinite(arr: readonly (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--)
    if (arr[i] != null && Number.isFinite(arr[i]!)) return arr[i]!;
  return null;
}
