"use client";
// Interactive <NetFlow>. One pointer listener + nearest-period
// math. ←/→ step periods; the live region states in, out, AND signed net — the
// full picture, never a net without its gross. Composes the static component
// (canon); the crosshair + in/out value ticks are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { FILL, wrap } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_NET_FLOW, type NetFlowStrings } from "../../core/strings-net-flow.js";
import { netFlowGeometry } from "./geometry.js";
import { NetFlow as StaticNetFlow, netFlowSummary, signedNet, type NetFlowProps } from "./index.js";

export interface InteractiveNetFlowProps extends NetFlowProps {
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
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : netFlowSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const total = data.length;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || geo.degenerate || total === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      let best = 0;
      let bestDist = Infinity;
      geo.points.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    },
    [geo, total],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (total === 0 || geo?.degenerate) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((prev) => Math.min(total - 1, (prev ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(total - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [total, geo],
  );

  const p = active !== null && geo ? geo.points[active] : undefined;
  const announced = p
    ? strings.netFlowAt(active! + 1, total, fmt(p.in), fmt(p.out), signedNet(p.net, fmt))
    : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-net-flow-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
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
        {p ? (
          <>
            <line
              x1={p.x}
              y1={0.5}
              x2={p.x}
              y2={height - 0.5}
              stroke="var(--mc-neutral)"
              data-mc-w="support"
              strokeDasharray="1.5 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.inTopY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.outBotY}
              r={1.6}
              fill="none"
              stroke="var(--mc-stroke)"
              data-mc-w="support"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x}
              cy={p.netY}
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
      {p ? (
        <span
          className="mc-net-flow-readout mc-spark-readout"
          style={{ left: `${(p.x / geo!.totalWidth) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${fmt(p.in)} / ${fmt(p.out)} · ${signedNet(p.net, fmt)}`}
        </span>
      ) : null}
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
    </span>
  );
}
