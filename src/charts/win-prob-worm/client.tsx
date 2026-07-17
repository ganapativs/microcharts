"use client";
// Interactive <WinProbWorm>. ←/→ (Home/End) rove the points, each
// announcing the current leader + probability; a pointer picks the nearest x.
// Composes the static component (canon) — the crosshair + readout chip are
// overlay children, the worm/midline/dots come from the static so the two
// entries can never drift.
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
import { LiveRegion } from "../../shared/live-region.js";
import { FILL } from "../../shared/interactive.js";
import { isFiniteValue } from "../../core/types.js";
import { clamp } from "../../core/scale.js";
import { labelFont } from "../../core/labels.js";
import { EN_WIN_PROB_WORM, type WinProbWormStrings } from "../../core/strings-win-prob-worm.js";
import { PAD, leaderProb, resolveWormGeo, winProbWormSummary } from "./geometry.js";
import { WinProbWorm as StaticWinProbWorm, type WinProbWormProps } from "./index.js";

export interface InteractiveWinProbWormProps extends WinProbWormProps {
  strings?: WinProbWormStrings;
  /**
   * Opt-in entrance motion (default `false`): the worm draws on when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const pct = (v: number, fmt: (n: number) => string): string => `${fmt(v)}%`;

export function WinProbWorm(props: InteractiveWinProbWormProps): React.ReactNode {
  const {
    data,
    sides = ["A", "B"],
    label = "last",
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_WIN_PROB_WORM,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  const hostRef = useRef<HTMLSpanElement>(null);
  // The worm is one line split into below-50 (muted) + above-50 (accent) paths;
  // stagger 0 starts both draw fronts together so the single worm reads as one
  // continuous trace, not two sequential strokes.
  useEntrance(hostRef, "draw", animate, {
    selector: 'path[data-mc-ink="muted"], path[data-mc-ink="accent"]',
    stagger: 0,
  });

  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const FONT = labelFont(height);

  // Geometry must match the static entry EXACTLY (same shared resolve), so the
  // overlay + pointer math never drift.
  const geo = useMemo(
    () => resolveWormGeo({ width, height, data, label, font: FONT, fmt }),
    [width, height, data, label, FONT, fmt],
  );

  const plotW = Math.max(0, width - 2 * PAD - geo.gutter);
  const lastX = Math.max(1, data.length - 1);

  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo.geo === null
          ? strings.noData
          : winProbWormSummary(geo.geo, fmt, strings, sides);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.geo === null || data.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const xView = ((e.clientX - r.left) / r.width) * width;
      const i = Math.round(((xView - PAD) / Math.max(1, plotW)) * (data.length - 1));
      setActive(clamp(i, 0, data.length - 1));
    },
    [geo.geo, data.length, width, plotW],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.geo === null || data.length === 0) return;
      switch (e.key) {
        case "ArrowRight":
          setActive((p) => Math.min(data.length - 1, (p ?? -1) + 1));
          break;
        case "ArrowLeft":
          setActive((p) => (p === null || p <= 0 ? 0 : p - 1));
          break;
        case "Home":
          setActive(0);
          break;
        case "End":
          setActive(data.length - 1);
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
    },
    [geo.geo, data.length],
  );

  const activeValue =
    active !== null && isFiniteValue(data[active]) ? (data[active] as number) : null;
  const clampedActive = activeValue === null ? null : clamp(activeValue, 0, 100);
  const announced =
    clampedActive === null
      ? ""
      : strings.winProbWormAt(
          active! + 1,
          clampedActive >= 50 ? sides[0] : sides[1],
          pct(leaderProb(clampedActive), fmt),
        );
  const px = active !== null ? PAD + (active / lastX) * plotW : 0;

  return (
    <span
      ref={hostRef}
      className={className ? `mc-win-prob-worm-live ${className}` : "mc-win-prob-worm-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticWinProbWorm
        {...rest}
        data={data}
        sides={sides}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {clampedActive !== null ? (
          <line
            x1={px}
            y1={0}
            x2={px}
            y2={height}
            data-mc-ink="accent"
            data-mc-w="tick"
            strokeDasharray="1.5 1.5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticWinProbWorm>
      {clampedActive !== null ? (
        <span
          className="mc-spark-readout"
          style={{ left: `${(px / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          {pct(leaderProb(clampedActive), fmt)}
        </span>
      ) : null}
      <LiveRegion>{announced}</LiveRegion>
    </span>
  );
}
