"use client";
// Interactive <MicroDonut> (plan/22 #18). Pointer → wedge by atan2 angle
// lookup (pure); ←/→ rove wedges. Disabled entirely when `decorative` — an
// aria-hidden chart must not be a tab stop. Composes the static component.
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_COMPOSITION, type CompositionStrings } from "../../core/strings-composition.js";
import { largestRemainderPercents, rollup } from "../segmented-bar/geometry.js";
import { sharesSummary } from "../segmented-bar/index.js";
import { microDonutGeometry } from "./geometry.js";
import { MicroDonut as StaticMicroDonut, type MicroDonutProps } from "./index.js";

export interface InteractiveMicroDonutProps extends MicroDonutProps {
  strings?: CompositionStrings;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  /**
   * Opt-in entrance motion (default `false`): the wedges fade in, staggered,
   * when the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins. Skipped when
   * `decorative` (an aria-hidden ornament renders through the static entry
   * directly, before any hook that could wire it runs).
   */
  animate?: boolean;
}

export function MicroDonut(props: InteractiveMicroDonutProps): React.ReactNode {
  const {
    data,
    maxWedges = 4,
    decorative = false,
    weight = 5,
    size = 24,
    format,
    locale,
    strings = EN_COMPOSITION,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Wedges carry either a category role or the rolled-up "other" neutral role
  // — the default "reveal" selector only matches data-mc-cat, so the neutral
  // wedge is added explicitly.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'path[data-mc-ink="neutral"], path[data-mc-cat]',
  });

  const rolled = useMemo(
    () => rollup(data, maxWedges, strings.otherLabel),
    [data, maxWedges, strings],
  );
  const geo = useMemo(
    () => microDonutGeometry({ size, shares: rolled.map((d) => d.value), weight }),
    [size, rolled, weight],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pcts = useMemo(() => largestRemainderPercents(geo.wedges.map((w) => w.share)), [geo]);
  const [active, setActive] = useState<number | null>(null);

  // decorative = ornament: no naming, no tab stop, no interaction
  if (decorative) {
    return (
      <StaticMicroDonut
        {...rest}
        data={data}
        maxWedges={maxWedges}
        decorative
        weight={weight}
        size={size}
        strings={strings}
      />
    );
  }

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : sharesSummary(rolled, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.wedges.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const dx = ((e.clientX - r.left) / r.width) * size - size / 2;
      const dy = ((e.clientY - r.top) / r.height) * size - size / 2;
      // angle from 12 o'clock, clockwise (matches core/arc convention)
      const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
      const i = geo.wedges.findIndex((w) => angle >= w.a0 && angle <= w.a1);
      setActive(i >= 0 ? i : null);
    },
    [geo, size],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (geo.wedges.length === 0) return;
    const cur = active ?? 0;
    let next = cur;
    switch (e.key) {
      case "ArrowRight":
        next = Math.min(geo.wedges.length - 1, cur + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, cur - 1);
        break;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setActive(next);
  };

  const wedge = active !== null ? geo.wedges[active] : undefined;
  const datum = wedge ? rolled[wedge.index] : undefined;
  const announced =
    wedge && datum
      ? datum.members > 1
        ? strings.shareOther(datum.label, `${pcts[active!]}%`, datum.members)
        : strings.shareAt(datum.label, `${pcts[active!]}%`, fmt(datum.value))
      : "";

  return (
    <span
      ref={hostRef}
      className="mc-donut-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticMicroDonut
        {...rest}
        data={data}
        maxWedges={maxWedges}
        weight={weight}
        size={size}
        strings={strings}
        summary={false}
      >
        {wedge ? (
          <path
            d={wedge.d}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticMicroDonut>
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
      {wedge && datum ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {`${datum.label} ${pcts[active!]}%`}
        </span>
      ) : null}
    </span>
  );
}
