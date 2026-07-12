"use client";
// Interactive <VolumeProfile> (plan/25 §16). One pointer listener; nearest level
// bin by y. ↑/↓ rove bins. Composes the static component (canon).
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
import { EN_VOLUME_PROFILE } from "../../core/strings-volume-profile.js";
import { binMass, volumeProfileGeometry } from "./geometry.js";
import {
  VolumeProfile as StaticVolumeProfile,
  volumeProfileSummary,
  type VolumeProfileProps,
} from "./index.js";

const FILL: CSSProperties = { width: "100%", height: "auto" };

// Bars are single merged `path`s (one per role), not `rect`s — the default
// `sweep` selector only matches rects.
const PROFILE_SELECTOR = 'path[data-mc-ink="bar"], path[data-mc-ink="accent"]';

export interface InteractiveVolumeProfileProps extends VolumeProfileProps {
  /**
   * Opt-in entrance motion (default `false`): level bars sweep in from the
   * `align` edge when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function VolumeProfile(props: InteractiveVolumeProfileProps): React.ReactNode {
  const {
    data,
    valueArea = 0.7,
    align = "left",
    bins = 12,
    width = 48,
    height = 32,
    format,
    locale,
    strings = EN_VOLUME_PROFILE,
    title,
    summary,
    animate = false,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate, {
    selector: PROFILE_SELECTOR,
    origin: align === "right" ? "right" : "left",
  });

  const geo = useMemo(
    () => volumeProfileGeometry({ data, bins, valueArea, align, width, height, gutter: 0 }),
    [data, bins, valueArea, align, width, height],
  );
  const rows = useMemo(() => binMass(data, bins), [data, bins]);
  const total = useMemo(() => rows.reduce((s, r) => s + r.mass, 0), [rows]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : volumeProfileSummary(geo, valueArea, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.bars.length === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.height === 0) return;
      const y = ((e.clientY - r.top) / r.height) * height;
      const i = geo.bars.findIndex((b) => y >= b.y && y <= b.y + b.height);
      setActive(i >= 0 ? i : null);
    },
    [geo, height],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.bars.length === 0) return;
      setActive((prev) => {
        const cur = prev ?? geo.bars.length - 1;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          return Math.max(0, cur - 1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          return Math.min(geo.bars.length - 1, cur + 1);
        }
        if (e.key === "Escape") return null;
        return prev;
      });
    },
    [geo],
  );

  const bar = active != null ? geo.bars[active] : undefined;
  const share = bar && total > 0 ? (rows[active!]?.mass ?? 0) / total : 0;
  const announced = bar
    ? strings.volumeAt(
        fmt(bar.level),
        `${Math.round(share * 100)}%`,
        bar.poc ? strings.volumePoc : "",
      )
    : "";

  return (
    <span
      ref={hostRef}
      className="mc-volprofile-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticVolumeProfile
        {...rest}
        data={data}
        valueArea={valueArea}
        align={align}
        bins={bins}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {bar ? (
          <rect
            x={0.5}
            y={bar.y - 0.4}
            width={width - 1}
            height={bar.height + 0.8}
            fill="none"
            stroke="var(--mc-accent)"
            strokeOpacity={0.6}
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticVolumeProfile>
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
      {bar ? (
        /* Pinned to the bars' base edge: level labels + the poc flag sit at
           the bar TIPS, so the base side is the one spot the chip can never
           cover chart text. */
        <span
          className="mc-spark-readout"
          style={{
            top: `${((bar.y + bar.height / 2) / height) * 100}%`,
            ...(align === "right" ? { left: "auto", right: 4 } : { left: 4 }),
            transform: "translateY(-50%)",
            bottom: "auto",
          }}
        >
          {`${fmt(bar.level)} · ${Math.round(share * 100)}%`}
        </span>
      ) : null}
    </span>
  );
}
