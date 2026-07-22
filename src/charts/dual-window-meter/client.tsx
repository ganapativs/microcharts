"use client";
// Interactive <DualWindowMeter>. useActivePicker owns interaction: ONE pointer
// listener + nearest-sample-by-x math, roving keyboard (←/→/Home/End), touch
// tap-to-pin, and the onActive/onSelect contract — never a DOM node per sample.
// Composes the static component (canon) — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { lastFinite } from "../../core/stats.js";
import { labelFont } from "../../core/labels.js";
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
import { EN_DUAL_WINDOW } from "../../core/strings-dual-window.js";
import { rollingMean } from "./geometry.js";
import {
  DualWindowMeter as StaticDualWindowMeter,
  dualWindowSummary,
  type DualWindowMeterProps,
} from "./index.js";

export interface InteractiveDualWindowMeterProps extends DualWindowMeterProps, PickerProps {
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
  useEntrance(hostRef, "draw", animate);

  const [wf, ws] = windows[0] < windows[1] ? windows : [windows[1], windows[0]];
  const fast = useMemo(() => rollingMean(data, wf), [data, wf]);
  const slow = useMemo(() => rollingMean(data, ws), [data, ws]);
  // `{ maximumFractionDigits: 1 }` mirrors the static default (index.tsx) so the
  // readout, live announcement and accessible name don't over-claim precision on
  // raw rolling-mean floats — and the label gutter matches the composed static.
  const fmt = useMemo(
    () => makeFormatter(format, locale, { maximumFractionDigits: 1 }),
    [format, locale],
  );
  // Same font metric as the static — it sizes the label gutter, and therefore
  // every x the crosshair and readout are placed at.
  const fontSize = labelFont(height, 0.32);
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
  const xOf = useCallback((i: number) => pad + (i / n) * plotW, [n, plotW]);

  // Nearest sample by x. `index` in the datum is the DATA index (1:1 with the
  // raw series the consumer passes).
  const locate = useCallback(
    (x: number) => {
      if (data.length === 0) return null;
      return Math.max(0, Math.min(data.length - 1, Math.round(((x - pad) / plotW) * n)));
    },
    [data.length, plotW, n],
  );
  // `value` reports the sustained (slow) window mean — the headline reading
  // (the `data`-ink thick trace + the summary's leading number).
  const datum = useCallback(
    (i: number) => {
      const fi = fast[i];
      const si = slow[i];
      return {
        index: i,
        value: si ?? null,
        formatted: `${fi == null ? "—" : fmt(fi)} · ${si == null ? "—" : fmt(si)}`,
      };
    },
    [fast, slow, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: data.length,
    width,
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
        : dualWindowSummary(
            lastFinite(fast) ?? null,
            lastFinite(slow) ?? null,
            target,
            strings,
            fmt,
          );
  const labelText = [title, accName].filter(Boolean).join(". ") || undefined;

  // The sample shown by the crosshair + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const f = shown != null ? fast[shown] : null;
  const s = shown != null ? slow[shown] : null;
  const announced =
    shown != null
      ? strings.dualWindowAt(f == null ? "—" : fmt(f), s == null ? "—" : fmt(s), fmt(target))
      : "";
  const shownX = shown != null ? xOf(shown) : 0;
  const selX = selected != null ? xOf(selected) : 0;

  return (
    <span
      ref={hostRef}
      {...wrap("mc-dualwin-live", className, style)}
      {...named(labelText)}
      {...bind}
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
        style={fillFor(style)}
      >
        {selected != null && selected !== active ? (
          <line
            x1={selX}
            x2={selX}
            y1={0.5}
            y2={height - 0.5}
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {shown != null ? (
          <line
            x1={shownX}
            x2={shownX}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticDualWindowMeter>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown != null ? (
        <span className="mc-spark-readout" style={crosshairReadoutStyle(shownX, width)}>
          {`${f == null ? "—" : fmt(f)} · ${s == null ? "—" : fmt(s)}`}
        </span>
      ) : null}
    </span>
  );
}
