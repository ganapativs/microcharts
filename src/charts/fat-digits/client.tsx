"use client";
// Interactive <FatDigits>. Announces the value + tier through a
// polite region on change; the weight eases via CSS on variable fonts (snaps
// otherwise), with no layout shift (tabular-nums). Wrapper focus only — the
// numeral is one value. Composes the static component.
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
  /** Click/tap or Enter/Space — `{ index: 0, value: the numeral }`. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function FatDigits(props: InteractiveFatDigitsProps): React.ReactNode {
  const {
    live = true,
    strings = EN_FAT,
    animate = false,
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

  // One numeral, one selectable unit (index 0): the value it prints.
  const pick = (): void => onSelect?.({ index: 0, value: Number.isFinite(value) ? value : null });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-fat-live", className, style)}
      {...named(label)}
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
