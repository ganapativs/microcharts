"use client";
// Interactive <Constellation>. useActivePicker owns interaction: one pointer
// listener + nearest-star math (squared 2-D distance over the precomputed
// stars), ←/→ (and ↑/↓) step chronologically, click / Enter / Space selects.
// Focus ring on the active event, persistent ring on the pinned one; the readout
// names the time, value, and magnitude. Composes the static component (canon).
// Vertical jitter (value-less data) stays layout-only — the readout never
// presents it as data.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_CONSTELLATION, type ConstellationStrings } from "../../core/strings-constellation.js";
import { constellationGeometry } from "./geometry.js";
import {
  Constellation as StaticConstellation,
  constellationSummary,
  type ConstellationProps,
} from "./index.js";

export interface InteractiveConstellationProps extends ConstellationProps, PickerProps {
  strings?: ConstellationStrings;
  /**
   * Opt-in entrance motion (default `false`): stars fade and scale in on
   * first client-side mount. Inert on the server and on hydrated server
   * HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function Constellation(props: InteractiveConstellationProps): React.ReactNode {
  const {
    data,
    connect = true,
    domain,
    xDomain,
    xFormat,
    width = 60,
    height = 20,
    rBase = 1.6,
    format,
    locale,
    strings = EN_CONSTELLATION,
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
  // With the chronology line, "draw" traces it left→right and the star dots pop
  // out of it exactly as the draw front reaches them (engine-automatic). The
  // connector carries ink="ghost" (not "data"/"accent"), so the draw default
  // selector misses it — pass it explicitly. With `connect={false}` there's no
  // path to draw, and a linear wipe over a 2-D scatter would imply an order the
  // data doesn't have — so the star dots just settle in place.
  useEntrance(
    hostRef,
    connect ? "draw" : "settle",
    animate,
    connect ? { selector: 'path[data-mc-ink="ghost"]' } : { selector: "circle" },
  );

  const geo = useMemo(
    () =>
      constellationGeometry({
        points: data,
        width,
        height,
        domain,
        xDomain,
        connect,
        rBase,
        pad: 1,
      }),
    [data, width, height, domain, xDomain, connect, rBase],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const xFmt = useCallback((x: number) => (xFormat ? xFormat(x) : fmt(x)), [xFormat, fmt]);

  // The picker's index space is the DATA index (`star.index`), not the position
  // in `geo.stars` — points dropped by the geometry (non-finite x, or a missing
  // y in value mode) leave gaps, and a consumer's onActive/selectedIndex must
  // still line up with `data`. This map walks back to the drawn star.
  const byData = useMemo(() => {
    const m = new Map<number, number>();
    geo.stars.forEach((s, i) => m.set(s.index, i));
    return m;
  }, [geo]);
  const starAt = useCallback(
    (i: number | null) => (i === null ? undefined : geo.stars[byData.get(i) ?? -1]),
    [geo, byData],
  );

  /** Data indices ordered by time — the rove order for ←/→ (and ↑/↓). */
  const order = useMemo(() => {
    const idx = geo.stars.map((s) => ({ i: s.index, x: s.x }));
    idx.sort((a, b) => a.x - b.x);
    return idx.map((e) => e.i);
  }, [geo]);

  // Nearest star by squared 2-D distance — a scatter has no x-only "column".
  const locate = useCallback(
    (x: number, y: number) => {
      let best: number | null = null;
      let bestDist = Infinity;
      for (const s of geo.stars) {
        const d = (s.cx - x) ** 2 + (s.cy - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = s.index;
        }
      }
      return best;
    },
    [geo],
  );

  // Chronological rove. A scatter has no rows/lanes, so both axes map to
  // prev/next (as the 1-D default does) — only the ORDER is custom (time, not
  // array order), which is why this chart supplies its own `step`.
  const step = useCallback(
    (cur: number, key: string) => {
      const pos = cur < 0 ? -1 : order.indexOf(cur);
      let t = pos;
      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          t = Math.min(order.length - 1, pos + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          t = pos <= 0 ? 0 : pos - 1;
          break;
        case "Home":
          t = 0;
          break;
        case "End":
          t = order.length - 1;
          break;
        default:
          return null;
      }
      return order[t] ?? null;
    },
    [order],
  );

  // value = the star's encoded number: its y value, else its magnitude when the
  // layout is jittered (y then encodes nothing). label = the formatted time.
  const datum = useCallback(
    (i: number) => {
      const s = starAt(i);
      const v = s && Number.isFinite(s.value) ? s.value : s && Number.isFinite(s.m) ? s.m : null;
      return { index: i, value: v, label: s ? xFmt(s.x) : undefined };
    },
    [starAt, xFmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.stars.length,
    // the rendered viewBox (rounded), not the raw props — the composed static
    // chart sizes itself from these, so pointer math maps 1:1
    width: geo.width,
    height: geo.height,
    locate,
    datum,
    step,
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
        : constellationSummary(data, { xFormat, strings, format, locale });
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // The star shown by the focus ring + readout: the live hover/keyboard focus,
  // falling back to a pinned selection when the pointer has left.
  const shown = active ?? selected;
  const shownStar = starAt(shown);
  const activeStar = starAt(active);
  const selStar = selected !== active ? starAt(selected) : undefined;
  // Detail = value and/or magnitude; never the jittered vertical position.
  const detail = shownStar
    ? [
        Number.isFinite(shownStar.value) ? fmt(shownStar.value) : null,
        Number.isFinite(shownStar.m) ? `magnitude ${fmt(shownStar.m)}` : null,
      ]
        .filter(Boolean)
        .join(", ") || "event"
    : "";
  const readout = shownStar ? `${xFmt(shownStar.x)}: ${detail}` : "";
  const announced = shownStar ? strings.constellationAt(xFmt(shownStar.x), detail) : "";

  return (
    <span
      ref={hostRef}
      {...wrap("mc-constellation-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticConstellation
        {...rest}
        style={FILL}
        data={data}
        connect={connect}
        domain={domain}
        xDomain={xDomain}
        xFormat={xFormat}
        width={width}
        height={height}
        rBase={rBase}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave (a heavier ring than
            the transient focus one); the static halo already uses w="tick". */}
        {selStar ? (
          <circle
            cx={selStar.cx}
            cy={selStar.cy}
            r={selStar.r + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="full"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {activeStar ? (
          <circle
            cx={activeStar.cx}
            cy={activeStar.cy}
            r={activeStar.r + 1.5}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticConstellation>
      <LiveRegion>{announced}</LiveRegion>
      {shownStar ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(shownStar.cx / geo.width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {readout}
        </span>
      ) : null}
    </span>
  );
}
