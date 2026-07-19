"use client";
// Interactive <Funnel>. useActivePicker owns interaction: one pointer listener +
// stage-by-x-band lookup, ←/→ rove stages ("Checkout: 2,730 — 22% of visitors."),
// click / Enter / Space selects (onSelect). Composes the static component (canon)
// — the SVG is never re-implemented.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { isFiniteValue } from "../../core/types.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { funnelGeometry } from "./geometry.js";
import { Funnel as StaticFunnel, funnelSummary, type FunnelProps } from "./index.js";

// Stage columns carry "bar" or "accent" (the highlighted leak) — the default
// `rise` selector only matches "bar".
const STAGE_SELECTOR = 'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"]';

export interface InteractiveFunnelProps extends FunnelProps, PickerProps {
  strings?: CompositionStrings;
  /**
   * Opt-in entrance motion (default `false`): stage columns rise from the
   * baseline when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Funnel(props: InteractiveFunnelProps): React.ReactNode {
  const {
    data,
    mode = "absolute",
    connectors = true,
    label = "none",
    width = 60,
    height = 18,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // ordered by x (stage/pipeline order, left→right), spread over a 450ms window
  // — the cascade follows the funnel sequence, not bar height, so a
  // non-monotonic funnel still animates in stage order.
  useEntrance(hostRef, "rise", animate, { selector: STAGE_SELECTOR, order: "x", window: 450 });

  const geo = useMemo(
    () =>
      funnelGeometry({
        width,
        height,
        values: data.map((d) => d.value),
        mode,
        connectors,
        fontSize: label === "none" ? 0 : 5,
      }),
    [width, height, data, mode, connectors, label],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 }),
    [format, locale],
  );

  const locate = useCallback(
    (x: number) => {
      if (geo.stages.length === 0 || geo.pitch === 0) return null;
      const i = Math.floor(x / geo.pitch);
      return i >= 0 && i < geo.stages.length ? i : null;
    },
    [geo],
  );
  // Unit = stage. Stages are 1:1 with `data` (a funnel never rolls up), so the
  // datum index is also the consumer's data index.
  const datum = useCallback(
    (i: number) => {
      const d = data[geo.stages[i]!.index];
      return {
        index: i,
        value: d && isFiniteValue(d.value) ? d.value : null,
        label: d?.label,
      };
    },
    [data, geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.stages.length,
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
        : funnelSummary(data, fmt, pctFmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const outline = (i: number, pinned: boolean) => {
    const s = geo.stages[i];
    if (!s) return null;
    return (
      <rect
        x={s.x - 0.5}
        y={-0.5}
        width={s.w + 1}
        height={height + 1}
        fill="none"
        stroke="var(--mc-accent)"
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const st = shown !== null ? geo.stages[shown] : undefined;
  const stDatum = st ? data[st.index] : undefined;
  const firstLabel = data[0]?.label ?? "";
  const announced =
    st && stDatum && isFiniteValue(stDatum.value)
      ? strings.stageAt(stDatum.label, fmt(stDatum.value), pctFmt(st.share), firstLabel)
      : stDatum
        ? `${stDatum.label}: ${strings.noData}`
        : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-funnel-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticFunnel
        {...rest}
        style={FILL}
        data={data}
        mode={mode}
        connectors={connectors}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus outline is transient. */}
        {selected !== null && selected !== active ? outline(selected, true) : null}
        {active !== null ? outline(active, false) : null}
        {rest.children}
      </StaticFunnel>
      <LiveRegion>{announced}</LiveRegion>
      {st && stDatum && isFiniteValue(stDatum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((st.x + st.w / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {`${stDatum.label} ${pctFmt(st.share)}`}
        </span>
      ) : null}
    </span>
  );
}
