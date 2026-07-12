"use client";
// Interactive <TreeRings>. Radial pointer lookup (distance from
// centre → ring index) + ←/→ stepping inner→outer; the focused ring is ringed
// and its period announced. Composes the static component.
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { treeRingsGeometry } from "./geometry.js";
import { EN_TREE, type TreeStrings } from "../../core/strings-tree.js";
import { TreeRings as StaticTreeRings, treeRingsSummary, type TreeRingsProps } from "./index.js";

export interface InteractiveTreeRingsProps extends TreeRingsProps {
  strings?: TreeStrings;
  /**
   * Opt-in entrance motion (default `false`): the ring disc fades and scales
   * in on first client-side mount — rings are merged into O(1) path nodes for
   * the SSR hot path, so a per-ring stagger isn't available; a center-out
   * scale echoes the rings growing outward instead. Inert on the server and
   * on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function TreeRings(props: InteractiveTreeRingsProps): React.ReactNode {
  const {
    data,
    total,
    size = 24,
    periodWord = "period",
    unit = "periods",
    format,
    locale,
    title,
    summary,
    strings = EN_TREE,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "grow", animate);

  const geo = useMemo(
    () => treeRingsGeometry({ values: data, size, pad: 1, total }),
    [data, size, total],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : treeRingsSummary(data, { unit, periodWord, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;
  const periodLabel = (i: number) =>
    `${periodWord[0]!.toUpperCase()}${periodWord.slice(1)} ${i + 1}`;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const px = ((e.clientX - r.left) / r.width) * size - geo.center.cx;
    const py = ((e.clientY - r.top) / r.height) * size - geo.center.cy;
    const dist = Math.hypot(px, py);
    const ring = geo.rings.find(
      (rg) => rg.rOuter > rg.rInner && dist >= rg.rInner && dist <= rg.rOuter,
    );
    setActive(ring ? ring.index : null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (data.length === 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      setActive((p) => Math.min(data.length - 1, (p ?? -1) + 1));
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      setActive((p) => Math.max(0, (p ?? data.length) - 1));
      e.preventDefault();
    } else if (e.key === "Escape") setActive(null);
  };

  const ring = active !== null ? geo.rings[active] : undefined;
  const announced = ring ? strings.treeRingAt(periodLabel(ring.index), fmt(ring.value)) : "";

  return (
    <span
      ref={hostRef}
      className="mc-tree-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticTreeRings
        {...rest}
        data={data}
        total={total}
        size={size}
        periodWord={periodWord}
        unit={unit}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {ring && ring.rOuter > ring.rInner ? (
          <circle
            cx={geo.center.cx}
            cy={geo.center.cy}
            r={(ring.rInner + ring.rOuter) / 2}
            fill="none"
            stroke="var(--mc-accent)"
            // geometric, not a role: this literal IS the ring's own thickness
            // (the data-encoded channel), so the focus halo matches its width exactly
            strokeWidth={Math.max(1, ring.rOuter - ring.rInner)}
            strokeOpacity={0.3}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticTreeRings>
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
      {ring ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {announced}
        </span>
      ) : null}
    </span>
  );
}
