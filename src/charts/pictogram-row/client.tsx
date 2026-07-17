"use client";
// Interactive <PictogramRow>. `live` announces value changes
// ("6 of 8."). No per-unit pointer targets — the units are ONE datum; hovering
// unit 4 of 8 has no distinct meaning (documented skip). Composes the static
// component (canon).
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import {
  PictogramRow as StaticPictogramRow,
  pictogramSummary,
  type PictogramRowProps,
} from "./index.js";

export interface InteractivePictogramRowProps extends PictogramRowProps {
  /** Announce when the value changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
  /**
   * Opt-in entrance motion (default `false`): each unit settles into place,
   * staggered, when the chart first mounts client-side. Inert on the server
   * and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function PictogramRow(props: InteractivePictogramRowProps): React.ReactNode {
  const {
    live = true,
    animate = false,
    strings = EN_SCALAR,
    title,
    format,
    locale,
    className,
    style,
    ...rest
  } = props;
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const text = pictogramSummary(rest.value, rest.total, fmt, strings);
  const hostRef = useRef<HTMLSpanElement>(null);
  // "settle" — each unit (dot or square) fades + scales in like a marker, the
  // best-read entrance for a row of repeated glyph units. Filled units carry
  // their ink role on the fill mark itself (circle/rect/path), unfilled units
  // carry it on the ring — a custom selector catches every unit regardless of
  // shape or fill state (the default "settle" selector only matches circles).
  // Index order over a 450ms window gives the row a counting feel (units
  // settle one at a time, reading order) instead of a uniform staggered fade.
  useEntrance(hostRef, "settle", animate, {
    selector: "circle[data-mc-ink], rect[data-mc-ink], path[data-mc-ink]",
    order: "index",
    window: 450,
  });

  const [announced, setAnnounced] = useState("");
  const prev = useRef(rest.value);
  useEffect(() => {
    if (prev.current === rest.value) return;
    prev.current = rest.value;
    if (live) setAnnounced(text);
  }, [rest.value, text, live]);

  const label = [title, text].filter(Boolean).join(". ") || undefined;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-pictogram-live ${className}` : "mc-pictogram-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticPictogramRow
        {...rest}
        style={FILL}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
    </span>
  );
}
