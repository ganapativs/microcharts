"use client";
// Interactive <Bullet>. The static measure/target/bands
// visual, wrapped focusable, with a readout of the exact value vs target revealed
// on hover or focus. The wrapper owns the accessible name (role=img); the inner
// static chart is decorative so the reading isn't announced twice.
import { useRef, useState } from "react";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { makeFormatter } from "../../core/format.js";
import { EN_BULLET } from "../../core/strings-bullet.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { Bullet as StaticBullet, bulletSummary, type BulletProps } from "./index.js";

// The measure bar shares the "bar" ink with the background bands; it's always
// the LAST `rect` sibling (bands render first, then the measure) so `:last-of-
// type` isolates it without touching the static component.
const MEASURE_SELECTOR = 'rect[data-mc-ink="bar"]:last-of-type';

export interface InteractiveBulletProps extends BulletProps {
  /**
   * Opt-in entrance motion (default `false`): the measure bar sweeps in from
   * the left when the chart first mounts client-side. Inert on the server and
   * on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /** Show the floating value chip on hover/focus (default `true`). `false` suppresses only the chip. */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One measure = one
   * unit, so this fires once with `{ index: 0, … }` on pointer enter or focus
   * and once with `null` when that clears — never repeatedly while the pointer
   * moves inside the mark, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** The bullet was activated (click, tap, Enter or Space): `{ index: 0, value }` — the measure (never the target or a band). */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function Bullet(props: InteractiveBulletProps): React.ReactNode {
  const {
    value,
    target,
    format,
    locale,
    strings = EN_BULLET,
    title,
    summary,
    animate = false,
    readout = true,
    onActive,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "sweep", animate, { selector: MEASURE_SELECTOR });

  const fmt = makeFormatter(format, locale);
  const hasTarget = target !== undefined && Number.isFinite(target);
  const auto = Number.isFinite(value)
    ? bulletSummary(fmt(value), hasTarget ? fmt(target) : null, strings)
    : strings.noData;
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : auto;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // The gap is the chip's unique contribution — the permanent gutter never
  // prints it. When `label="both"` already shows value/target, float only the gap.
  const gap =
    hasTarget && Number.isFinite(value - target!)
      ? `${value - target! >= 0 ? "+" : "−"}${fmt(Math.abs(value - target!))}`
      : "";
  const readoutText =
    (rest.label ?? "none") === "both" && gap
      ? gap
      : hasTarget
        ? `${fmt(value)} / ${fmt(target)}${gap ? ` · ${gap}` : ""}`
        : fmt(value);

  // Measure only (target/bands are context). One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(value) ? value : null,
    formatted: readoutText,
  });
  const select = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `open` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setOpen(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-bullet-interactive", className, style)}
      {...named(label)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticBullet
        {...rest}
        value={value}
        target={target}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
        style={fillFor(style)}
      />
      {/* The chip carries the signed distance to target, which the accessible
          name does NOT — the summary states value and target, not the gap. So a
          screen-reader user could reach this chart and never get the number the
          sighted reader is handed. Announcing the readout closes that, and the
          region doubles as this entry's inline-seat host (see live-region.tsx),
          which is what `useSeatHoist` was standing in for. */}
      <LiveRegion>{open ? readoutText : ""}</LiveRegion>
      {readout && open ? (
        <span className="mc-spark-readout" style={{ right: 0 }}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
