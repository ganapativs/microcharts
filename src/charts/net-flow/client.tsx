"use client";
// Interactive <NetFlow>. useActivePicker owns interaction: one pointer listener
// + nearest-period math, ←/→ rove periods, click / Enter / Space selects
// (onSelect). The live region states in, out, AND signed net — the full
// picture, never a net without its gross. Composes the static component (canon);
// the crosshair + in/out/net ticks + pinned net ring are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_NET_FLOW, type NetFlowStrings } from "../../core/strings-net-flow.js";
import { netFlowGeometry } from "./geometry.js";
import { NetFlow as StaticNetFlow, netFlowSummary, signedNet, type NetFlowProps } from "./index.js";

export interface InteractiveNetFlowProps extends NetFlowProps, PickerProps {
  strings?: NetFlowStrings;
  /**
   * Opt-in entrance motion (default `false`): the flow areas wipe on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function NetFlow(props: InteractiveNetFlowProps): React.ReactNode {
  const {
    data,
    mode,
    height = 20,
    width = 80,
    format,
    locale,
    strings = EN_NET_FLOW,
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
  useEntrance(hostRef, "wipe", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = netFlowGeometry({ width, height, data, mode, domain: props.domain });
    const showLabel =
      (props.label ?? "last") === "last" && base != null && !base.degenerate && base.last != null;
    const gutterCh = showLabel ? signedNet(base!.last!.net, fmt).length : 0;
    return netFlowGeometry({
      width,
      height,
      data,
      mode,
      domain: props.domain,
      gutterCh,
      fontSize: labelFont(height),
    });
  }, [width, height, data, mode, props.domain, props.label, fmt]);

  const total = data.length;
  const navigable = geo !== null && !geo.degenerate;

  // Pointer (viewBox space) → nearest period by x.
  const locate = useCallback(
    (x: number) => {
      if (!geo || geo.degenerate) return null;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((pt, i) => {
        const d = Math.abs(pt.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [geo],
  );

  // Period (DATA) index; `value` is the signed NET (in − out) — this chart's
  // decision value. Its gross in/out are still announced + shown in the readout.
  const datum = useCallback(
    (i: number) => ({ index: i, value: geo?.points[i]?.net ?? null }),
    [geo],
  );

  const { active, selected, bind } = useActivePicker({
    count: navigable ? total : 0,
    width: geo ? geo.totalWidth : width,
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
        : geo === null
          ? strings.noData
          : netFlowSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected;
  const ap = active !== null && geo ? geo.points[active] : undefined; // transient focus
  const sp = selected !== null && selected !== active && geo ? geo.points[selected] : undefined; // pin
  const rp = shown !== null && geo ? geo.points[shown] : undefined; // readout + announce
  const announced = rp
    ? strings.netFlowAt(shown! + 1, total, fmt(rp.in), fmt(rp.out), signedNet(rp.net, fmt))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-net-flow-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      {...bind}
    >
      <StaticNetFlow
        {...rest}
        style={FILL}
        data={data}
        mode={mode}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection: a persistent net ring that survives pointer-leave. */}
        {sp ? (
          <circle
            cx={sp.x}
            cy={sp.netY}
            r={2.4}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {ap ? (
          <>
            <line
              x1={ap.x}
              y1={0.5}
              x2={ap.x}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={ap.x}
              cy={ap.inTopY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={ap.x}
              cy={ap.outBotY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={ap.x}
              cy={ap.netY}
              r={2.4}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
        {rest.children}
      </StaticNetFlow>
      {rp ? (
        <span
          className="mc-net-flow-readout mc-spark-readout"
          style={{ left: `${(rp.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(rp.in)} / ${fmt(rp.out)} · ${signedNet(rp.net, fmt)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
