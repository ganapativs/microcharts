"use client";
// Interactive <Bullet>. The static measure/target/bands
// visual, wrapped focusable, with a readout of the exact value vs target revealed
// on hover or focus. The wrapper owns the accessible name (role=img); the inner
// static chart is decorative so the reading isn't announced twice.
import { useRef, useState } from "react";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { useSeatHoist } from "../../shared/seat-hoist.js";
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
  /** The bullet was activated (click, tap, Enter or Space): `{ index: 0, value }` — the measure (never the target or a band). */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function Bullet(props: InteractiveBulletProps): React.ReactNode {
  const {
    value,
    target,
    format,
    locale,
    strings,
    title,
    summary,
    animate = false,
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLSpanElement>(null);
  // no LiveRegion here to host it: seat the wrapper so the readout chip
  // and the hit box travel with the mark when inline (see seat-hoist).
  useSeatHoist(hostRef);
  useEntrance(hostRef, "sweep", animate, { selector: MEASURE_SELECTOR });

  const fmt = makeFormatter(format, locale);
  const auto = bulletSummary(fmt(value), target === undefined ? null : fmt(target), strings);
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : auto;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const readout =
    target === undefined
      ? fmt(value)
      : `${fmt(value)} / ${fmt(target)}${
          Number.isFinite(value - target)
            ? ` · ${value - target >= 0 ? "+" : "−"}${fmt(Math.abs(value - target))}`
            : ""
        }`;

  // Drill-down: the MEASURE — the one thing the bar encodes. The target and the
  // qualitative bands are context, not the datum.
  const select = (): void => onSelect?.({ index: 0, value: Number.isFinite(value) ? value : null });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-bullet-interactive", className, style)}
      {...named(label)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
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
      {open ? (
        <span className="mc-spark-readout" style={{ right: 0 }}>
          {readout}
        </span>
      ) : null}
    </span>
  );
}
