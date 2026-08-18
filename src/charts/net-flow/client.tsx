"use client";
// Interactive <NetFlow>. useActivePicker owns interaction: one pointer listener
// + nearest-period math, ←/→ rove periods, click / Enter / Space selects
// (onSelect). The live region states in, out, AND signed net — the full
// picture, never a net without its gross.;
// the crosshair + in/out/net ticks + pinned net ring are overlay children.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { chartSide } from "../../core/types.js";
import {
  CHIP,
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_NET_FLOW, type NetFlowStrings } from "../../core/strings-net-flow.js";
import { netFlowGeometry } from "./geometry.js";
import {
  NetFlow as StaticNetFlow,
  netFlowLabel,
  netFlowSummary,
  signedNet,
  type NetFlowProps,
} from "./index.js";

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
    format,
    locale,
    strings = EN_NET_FLOW,
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

  // Same clamp the static applies, so the pointer map and the overlay coords
  // are measured against the box that actually got painted (see `chartSide`).
  const width = chartSide(props.width ?? 80);
  const height = chartSide(props.height ?? 20);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "wipe", animate);

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Mirror the static's label gutter so `totalWidth` matches the rendered
  // viewBox — without it the pointer map and readout run short and the
  // crosshair drifts from the cursor.
  const geo = useMemo(() => {
    const base = netFlowGeometry({ width, height, data, mode, domain: props.domain });
    // `netFlowLabel` is the static's own drop rule — asking it (rather than
    // re-deriving from `label`) is what keeps the reserved gutter and the
    // painted viewBox the same width in a box too short to seat the text.
    const lab = base ? netFlowLabel(base, height, props.label ?? "last", fmt) : null;
    return netFlowGeometry({
      width,
      height,
      data,
      mode,
      domain: props.domain,
      gutterCh: lab ? lab.text.length : 0,
      fontSize: lab ? lab.font : 0,
    });
  }, [width, height, data, mode, props.domain, props.label, fmt]);

  const total = data.length;
  const navigable = geo !== null && !geo.degenerate;

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
    (i: number) => {
      const p = geo?.points[i];
      return {
        index: i,
        value: p?.net ?? null,
        formatted: p ? `${fmt(p.in)} / ${fmt(p.out)} · ${signedNet(p.net, fmt)}` : undefined,
      };
    },
    [geo, fmt],
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
      {...named(ariaLabel)}
      {...bind}
    >
      <StaticNetFlow
        {...rest}
        style={fillFor(style)}
        data={data}
        mode={mode}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {sp ? (
          <circle cx={sp.x} cy={sp.netY} r={2.4} fill="none" data-mc-active="" data-mc-w="tick" />
        ) : null}
        {/* NOT tagged `data-mc-ui`: the crosshair's own `x1`/`x2` are read as
            its position by a guard test, so it cannot be zeroed and carried by
            a transform — and gliding the three ticks beside a line that
            teleports reads as broken. They travel together or not at all. */}
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
            />
            <circle
              cx={ap.x}
              cy={ap.inTopY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
            />
            <circle
              cx={ap.x}
              cy={ap.outBotY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
            />
            <circle
              cx={ap.x}
              cy={ap.netY}
              r={2.4}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
            />
          </>
        ) : null}
        {rest.children}
      </StaticNetFlow>
      {readout && rp ? (
        <span className="mc-net-flow-readout mc-spark-readout" {...CHIP}>
          {`${fmt(rp.in)} / ${fmt(rp.out)} · ${signedNet(rp.net, fmt)}`}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
