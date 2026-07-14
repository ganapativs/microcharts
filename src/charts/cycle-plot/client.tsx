"use client";
// Interactive <CyclePlot>. ←/→ step slots (announcing the slot's
// center, cycle count, and drift); ↑/↓ step cycles within the focused slot
// (announcing individual observations). A pointer picks the slot under the
// cursor. Composes the static component (canon); the focus band + readout chip
// are overlay children.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_CYCLE, type CycleStrings } from "../../core/strings-cycle.js";
import { cycleGeometry } from "./geometry.js";
import { CyclePlot as StaticCyclePlot, cycleSummary, type CyclePlotProps } from "./index.js";

export interface InteractiveCyclePlotProps extends CyclePlotProps {
  strings?: CycleStrings;
  /**
   * Opt-in entrance motion (default `false`): the spine draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const slotName = (slots: readonly string[] | undefined, i: number): string =>
  slots?.[i] ?? `slot ${i + 1}`;

const driftDir = (d: number): "rising" | "falling" | "steady" =>
  d > 0 ? "rising" : d < 0 ? "falling" : "steady";

export function CyclePlot(props: InteractiveCyclePlotProps): React.ReactNode {
  const {
    data,
    period,
    slots,
    center = "mean",
    cycleUnit = "cycles",
    domain,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_CYCLE,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // The spine (ink="data") is the primary draw. With `spine={false}` (the rare
  // within-slot-drift-only mode) there's no data path, so draw the ghost
  // within-slot polylines instead of falling through to a whole-svg wipe.
  useEntrance(
    hostRef,
    "draw",
    animate,
    props.spine === false ? { selector: 'path[data-mc-ink="ghost"]' } : undefined,
  );

  const geo = useMemo(
    () => cycleGeometry({ width, height, data, period, center, domain }),
    [width, height, data, period, center, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // [slot, cycle] — cycle < 0 means the whole-slot readout
  const [sel, setSel] = useState<{ slot: number; cycle: number } | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : cycleSummary(geo, { slots, cycleUnit }, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const count = geo?.slots.length ?? 0;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!geo || count === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * width;
      let best = 0;
      let bestDist = Infinity;
      geo.slots.forEach((sl, i) => {
        const d = Math.abs(sl.center.x - px);
        if (sl.n > 0 && d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setSel({ slot: best, cycle: -1 });
    },
    [geo, count, width],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!geo || count === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setSel((p) => ({ slot: Math.min(count - 1, (p?.slot ?? -1) + 1), cycle: -1 }));
          break;
        case "ArrowLeft":
          setSel((p) => ({ slot: p === null || p.slot <= 0 ? 0 : p.slot - 1, cycle: -1 }));
          break;
        case "ArrowDown":
          setSel((p) => {
            if (p === null) return { slot: 0, cycle: 0 };
            const n = geo.values[p.slot]?.length ?? 0;
            return { slot: p.slot, cycle: Math.min(n - 1, p.cycle + 1) };
          });
          break;
        case "ArrowUp":
          setSel((p) =>
            p === null
              ? { slot: 0, cycle: -1 }
              : { slot: p.slot, cycle: Math.max(-1, p.cycle - 1) },
          );
          break;
        case "Home":
          setSel({ slot: 0, cycle: -1 });
          break;
        case "End":
          setSel({ slot: count - 1, cycle: -1 });
          break;
        case "Escape":
          setSel(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [geo, count],
  );

  const sl = sel && geo ? geo.slots[sel.slot] : undefined;
  const name = sel ? slotName(slots, sel.slot) : "";
  const cycleVals = sel && geo ? (geo.values[sel.slot] ?? []) : [];
  const obs = sel && sel.cycle >= 0 ? cycleVals[sel.cycle] : undefined;

  const announced =
    sl && sel
      ? obs !== undefined
        ? strings.cyclePoint(name, sel.cycle + 1, cycleVals.length, fmt(obs))
        : strings.cycleAt(name, center, fmt(sl.center.value), sl.n, cycleUnit, driftDir(sl.drift))
      : "";
  const readout = sl ? (obs !== undefined ? fmt(obs) : fmt(sl.center.value)) : "";

  return (
    <span
      ref={hostRef}
      className="mc-cycle-plot-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setSel(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setSel(null)}
    >
      <StaticCyclePlot
        {...rest}
        data={data}
        period={period}
        slots={slots}
        center={center}
        cycleUnit={cycleUnit}
        domain={domain}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {sl ? (
          <rect
            x={sl.x0}
            y={0.5}
            width={Math.max(0, sl.x1 - sl.x0)}
            height={height - 1}
            fill="var(--mc-accent)"
            fillOpacity={0.08}
            stroke="var(--mc-accent)"
            data-mc-w="hair"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticCyclePlot>
      {sl && geo ? (
        <span
          className="mc-cycle-plot-readout mc-spark-readout"
          style={{ left: `${(sl.center.x / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {readout}
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
