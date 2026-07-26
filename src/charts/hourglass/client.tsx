"use client";
// Interactive <Hourglass>. Sand levels cross-fade on change (opacity
// swap — not d: interpolation); announces at documented thresholds (50 / 90 /
// 100%). not on every tick. Hover/focus reveals the elapsed percent the sand
// only approximates.
import { useEffect, useRef, useState } from "react";
import { useSeatHoist } from "../../shared/seat-hoist.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_HOURGLASS, type HourglassStrings } from "../../core/strings-hourglass.js";
import { LiveRegion } from "../../shared/live-region.js";
import { named, fillFor, wrap as wrapAttrs } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import {
  Hourglass as StaticHourglass,
  hourglassPct,
  hourglassSummary,
  type HourglassProps,
} from "./index.js";

export interface InteractiveHourglassProps extends HourglassProps {
  live?: boolean;
  strings?: HourglassStrings;
  /**
   * Opt-in entrance motion (default `false`): the glyph pops in (fade + scale)
   * when the chart first mounts client-side — a whole-svg animation, so it
   * never collides with the per-change sand settle this entry already drives.
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
  /**
   * Show the floating percent chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label` already prints a percent.
   */
  readout?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One glyph = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the glyph, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** The glyph was activated (click, tap, Enter or Space): `{ index: 0, value }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

const THRESHOLDS = [0.5, 0.9, 1];

export function Hourglass(props: InteractiveHourglassProps): React.ReactNode {
  const {
    live = true,
    strings = EN_HOURGLASS,
    title,
    value,
    locale,
    animate = false,
    readout = true,
    onActive,
    onSelect,
    summary,
    className,
    style,
    ...rest
  } = props;
  const generated = hourglassSummary(value, strings, locale);
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : generated;
  const wrap = useRef<HTMLSpanElement>(null);
  // seat the wrapper, not just the SVG, so the click target stays on the
  // painted glyph when this sits inline in prose (see seat-hoist).
  useSeatHoist(wrap);
  useEntrance(wrap, "pop", animate);
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  // The elapsed percent the sand encodes — the same number `label="elapsed"`
  // prints, so hovering and labelling never disagree.
  const elapsedPct = Number.isFinite(value)
    ? Math.round(Math.min(1, Math.max(0, value)) * 100)
    : null;
  const readoutText = elapsedPct === null ? "—" : hourglassPct(elapsedPct, locale);

  useEffect(() => {
    const before = prev.current;
    if (before === value) return;
    prev.current = value;
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // Sand FALLS: the top level settles down as it drains, the bottom pile
      // grows up from the floor as it fills — both scale from the floor (origin
      // set in styles.css) so the motion direction encodes gravity instead of a
      // flat cross-fade. ≤200ms, canonical strong ease-out. Scoped to the sand
      // paths (DOM order: top then bottom) so the glass frame never flickers.
      wrap.current?.querySelectorAll<SVGPathElement>("path.mc-hourglass-sand").forEach((p, i) =>
        p.animate(
          [
            { opacity: 0.4, transform: `scaleY(${i === 0 ? 1.08 : 0.92})` },
            { opacity: 1, transform: "scaleY(1)" },
          ],
          { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
        ),
      );
    }
    // announce only when a documented threshold was crossed
    const crossed = THRESHOLDS.some((t) => before < t !== value < t);
    if (live && crossed) setAnnounced(generated);
  }, [value, generated, live]);

  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Clamped elapsed fraction the sand encodes. One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null,
    formatted: readoutText,
  });
  const select = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={wrap}
      {...wrapAttrs("mc-hourglass-live", className, style)}
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
      <StaticHourglass
        {...rest}
        style={fillFor(style)}
        value={value}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* The sand is a rough gauge; the number behind it is invisible unless
          `label` prints it. Hover/focus reveals the elapsed percent. */}
      {readout && hover && (props.label ?? "none") === "none" ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
