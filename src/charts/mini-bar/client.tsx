"use client";
// Interactive <MiniBar>. One pointer listener; bar index by
// category-band lookup. ←/→ rove across bars ("East: 940 — 1st of 4."), focus
// ring overlay on the active bar. Composes the static component (canon).
import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_CATEGORY, type CategoryStrings } from "../../core/strings-category.js";
import { isFiniteValue } from "../../core/types.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { miniBarGeometry } from "./geometry.js";
import { MiniBar as StaticMiniBar, miniBarSummary, sortData, type MiniBarProps } from "./index.js";

// Bars carry valence tokens (bar/accent/positive/negative), not just "bar" —
// the default archetype selectors only match "bar", so every ink role is listed.
const BAR_SELECTOR =
  'rect[data-mc-ink="bar"], rect[data-mc-ink="accent"], rect[data-mc-ink="positive"], rect[data-mc-ink="negative"]';

export interface InteractiveMiniBarProps extends MiniBarProps {
  strings?: CategoryStrings;
  /**
   * Opt-in entrance motion (default `false`): bars rise from the baseline
   * (vertical) or sweep in from the left (horizontal) when the chart first
   * mounts client-side. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function MiniBar(props: InteractiveMiniBarProps): React.ReactNode {
  const {
    data,
    sort = "none",
    orientation = "vertical",
    domain,
    width = 50,
    height = 16,
    format,
    locale,
    strings = EN_CATEGORY,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Horizontal bars grow rightward (sweep, scaleX); vertical bars rise from the
  // baseline (scaleY) — the archetype tracks the chart's own orientation prop.
  // Each bar carries its own `data-mc-origin` (from true geometric sign) in the
  // static markup, so below-zero bars grow the honest way; the archetype default
  // (bottom/left) covers the common all-positive case.
  useEntrance(hostRef, orientation === "horizontal" ? "sweep" : "rise", animate, {
    selector: BAR_SELECTOR,
  });

  const sorted = useMemo(() => sortData(data, sort), [data, sort]);
  const geo = useMemo(
    () =>
      miniBarGeometry({
        width,
        height,
        values: sorted.map((d) => d.value),
        domain,
        orientation,
      }),
    [width, height, sorted, domain, orientation],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  // ranks over finite values (1 = highest), for "1st of 4" wording
  const ranks = useMemo(() => {
    const finite = sorted
      .map((d, i) => ({ i, v: d.value }))
      .filter((e): e is { i: number; v: number } => isFiniteValue(e.v));
    finite.sort((a, b) => b.v - a.v);
    const map = new Map<number, { rank: number; of: number }>();
    finite.forEach((e, r) => map.set(e.i, { rank: r + 1, of: finite.length }));
    return map;
  }, [sorted]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : miniBarSummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.bars.length === 0 || geo.band === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const pos =
        orientation === "vertical"
          ? ((e.clientX - r.left) / r.width) * width
          : ((e.clientY - r.top) / r.height) * height;
      const i = Math.floor(pos / geo.band);
      setActive(i >= 0 && i < geo.bars.length ? i : null);
    },
    [geo, orientation, width, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.bars.length === 0) return;
      const cur = active ?? 0;
      let next = cur;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = Math.min(geo.bars.length - 1, cur + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = Math.max(0, cur - 1);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.bars.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, geo],
  );

  const activeBar = active !== null ? geo.bars[active] : undefined;
  const activeDatum = active !== null ? sorted[active] : undefined;
  const announced =
    activeDatum === undefined
      ? ""
      : isFiniteValue(activeDatum.value)
        ? strings.category(
            activeDatum.label,
            fmt(activeDatum.value),
            ranks.get(active!)?.rank ?? 0,
            ranks.get(active!)?.of ?? 0,
          )
        : `${activeDatum.label}: ${strings.noData}`;

  // focus ring hugs the bar's category band, full value extent
  const ring =
    activeBar && !activeBar.empty
      ? orientation === "vertical"
        ? { x: activeBar.x - 0.5, y: -0.5, width: activeBar.w + 1, height: height + 1 }
        : { x: -0.5, y: activeBar.y - 0.5, width: width + 1, height: activeBar.h + 1 }
      : null;

  return (
    <span
      ref={hostRef}
      className="mc-minibar-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticMiniBar
        {...rest}
        data={data}
        sort={sort}
        orientation={orientation}
        domain={domain}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {ring ? (
          <rect
            {...ring}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticMiniBar>
      <LiveRegion>{announced}</LiveRegion>
      {activeBar && activeDatum && isFiniteValue(activeDatum.value) ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((orientation === "vertical" ? activeBar.x + activeBar.w / 2 : width / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {fmt(activeDatum.value)}
        </span>
      ) : null}
    </span>
  );
}
