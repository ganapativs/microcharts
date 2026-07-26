"use client";
// Interactive <FatDigits>. Announces the value + tier through a
// polite region on change; the weight eases via CSS on variable fonts (snaps
// otherwise). with no layout shift (tabular-nums). Wrapper focus only —
// numeral is one value.
import { useEffect, useRef, useState } from "react";
import { named, fillFor, wrap, type MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_FAT, type FatStrings } from "../../core/strings-fat.js";
import { FatDigits as StaticFatDigits, fatDigitsSummary, type FatDigitsProps } from "./index.js";

export interface InteractiveFatDigitsProps extends FatDigitsProps {
  /** Announce changes through a polite region (default true). */
  live?: boolean;
  strings?: FatStrings;
  /**
   * Opt-in entrance motion (default `false`): the numeral lifts and scales in
   * (a subtle `pop`) when the chart first mounts client-side. Inert on the
   * server and on hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
  /**
   * The active (hovered / keyboard-focused) unit changed. One numeral = one unit,
   * so this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the numeral, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
  /** Click/tap or Enter/Space — `{ index: 0, value: the numeral }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function FatDigits(props: InteractiveFatDigitsProps): React.ReactNode {
  const {
    live = true,
    strings = EN_FAT,
    animate = false,
    onActive,
    onSelect,
    title,
    value,
    domain,
    encode = "value",
    tiers = 5,
    format,
    locale,
    className,
    style,
    ...rest
  } = props;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "pop", animate);
  const text = fatDigitsSummary(value, { encode, tiers, domain, strings, format, locale });
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(text);
  }, [value, text, live]);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // One numeral, one selectable unit (index 0): the value it prints. One
  // builder, so `onActive` and `onSelect` can never report different numbers.
  const datum = (): MicroDatum => ({ index: 0, value: Number.isFinite(value) ? value : null });
  const pick = (): void => onSelect?.(datum());
  // `onActive` fires on the enter/leave EDGE only: pointer-enter then focus both
  // mean "active", and the same unit must not be announced twice. No state — the
  // numeral paints no chip, so a hover must not cost a render.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-fat-live", className, style)}
      {...named(label)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      onClick={pick}
      onKeyDown={(e) => {
        if (!onSelect || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick();
      }}
    >
      <StaticFatDigits
        {...rest}
        style={fillFor(style)}
        value={value}
        domain={domain}
        encode={encode}
        tiers={tiers}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
    </span>
  );
}
