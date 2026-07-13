"use client";
// Interactive <DepthWedge>. One pointer listener; nearest level by
// x reveals the cumulative depth on that side. ←/→ walk levels across the book.
// Composes the static component (canon).
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_DEPTH_WEDGE } from "../../core/strings-depth-wedge.js";
import { depthWedgeGeometry } from "./geometry.js";
import {
  DepthWedge as StaticDepthWedge,
  depthWedgeSummary,
  type DepthWedgeProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

export interface InteractiveDepthWedgeProps extends DepthWedgeProps {
  /**
   * Opt-in entrance motion (default `false`): the bid/ask wedges sweep
   * outward from the mid-price on first client-side mount. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function DepthWedge(props: InteractiveDepthWedgeProps): React.ReactNode {
  const {
    data,
    levels,
    normalize = false,
    width = 100,
    height = 24,
    format,
    locale,
    strings = EN_DEPTH_WEDGE,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The two sides are separate paths (demand = "positive", supply =
  // "negative"), never merged, so each can scale from its own center — a
  // sweep with a centered origin reads as the book pushing outward from the
  // mid-price on both sides at once, rather than one flat left→right reveal.
  useEntrance(hostRef, "sweep", animate, {
    selector: 'path[data-mc-ink="positive"], path[data-mc-ink="negative"]',
    origin: "center",
  });

  const geo = useMemo(
    () =>
      depthWedgeGeometry({
        demand: data.demand,
        supply: data.supply,
        levels: levels ?? null,
        normalize,
        width,
        height,
      }),
    [data, levels, normalize, width, height],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const combined = useMemo(
    () =>
      [
        ...geo.demandSteps.map((s) => ({ ...s, side: 0 as const })),
        ...geo.supplySteps.map((s) => ({ ...s, side: 1 as const })),
      ].sort((a, b) => a.x - b.x),
    [geo],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : depthWedgeSummary(geo, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (combined.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestD = Infinity;
      combined.forEach((s, i) => {
        const d = Math.abs(s.x - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    },
    [combined, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (combined.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? 0;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          return Math.min(combined.length - 1, cur + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          return Math.max(0, cur - 1);
        }
        if (e.key === "Escape") return null;
        return prev;
      });
    },
    [combined],
  );

  const step = active != null ? combined[active] : undefined;
  const sideName = step ? strings.depthWedgeSides[step.side].toLowerCase() : "";
  const announced = step ? strings.depthWedgeAt(sideName, fmt(step.cum), fmt(step.dist)) : "";

  return (
    <span
      ref={hostRef}
      className="mc-depth-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticDepthWedge
        {...rest}
        data={data}
        levels={levels}
        normalize={normalize}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {step ? (
          <line
            x1={step.x}
            x2={step.x}
            y1={0.5}
            y2={height - 0.5}
            data-mc-ink="muted"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticDepthWedge>
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
      {step ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(step.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {`${sideName} ${fmt(step.cum)}`}
        </span>
      ) : null}
    </span>
  );
}
